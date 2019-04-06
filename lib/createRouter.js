import express, { Router } from 'express'

import bodyparser from 'body-parser'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import { createLogger } from './utils/log'
import { createValidate } from './middleware/validate'

const methods = ['get', 'post', 'put', 'delete']

export function createRouter(routerConfig, { logLevel, logger }) {
	const log = createLogger({ logLevel, logger })
	const validate = createValidate(log)

	const router = express()

	router.use(cookieParser())
	router.use(bodyparser.json())
	router.use(bodyparser.urlencoded({ extended: true }))
	router.use(compression())

	router.use((req, res, next) => {
		log(4, `${req.method} call to ${req.originalUrl}`)
		next()
	})

	createSubrouter({ ...routerConfig }, log, validate, router)

	router.use((req, res) => {
		log(3, `Call to unknown path: ${req.path}`)
		res.status(404).send({ success: false, reason: 'Not_Found' })
	})

	return router
}

function createSubrouter(config, log, validate, router = Router({mergeParams: true})) {
	const { params, body, query, middleware } = config

	if (params || body || query) {
		router.use(validate({ params, body, query }))
		delete config.params
		delete config.body
		delete config.query
	}

	if (middleware) {
		if (!middleware.forEach || middleware.some(mw => typeof mw !== 'function')) {
			log(1, 'Invalid router config. Middleware needs to be an array of functions.')
			throw new Error('Invalid router config. Middleware needs to be an array of functions.')
		}

		middleware.forEach(mw => router.use(mw))
		delete config.middleware
	}

	methods.forEach(method => {
		if (config[method]) {
			createEndpoint(router, method, config[method], log, validate)
			delete config[method]
		}
	})

	Object.keys(config).forEach(key => {
		router.use('/' + key, createSubrouter(config[key], log, validate))
	})

	return router
}

function createEndpoint(router, method, config, log, validate) {
	const { params, body, query, controller, middleware = [] } = config
	if (!controller || typeof controller !== 'function') {
		log(1, 'Invalid router config. Endpoints need to define a controller function.')
		throw new Error('Invalid router config. Endpoints need to define a controller function.')
	}
	if (!middleware.forEach || middleware.some(mw => typeof mw !== 'function')) {
		log(1, 'Invalid router config. Middleware needs to be an array of functions.')
		throw new Error('Invalid router config. Middleware needs to be an array of functions.')
	}
	router[method]('/', validate({ params, body, query }), ...middleware, controller)
}
