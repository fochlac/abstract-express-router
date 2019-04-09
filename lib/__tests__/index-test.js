import { resetSpies, spies, testConfig } from './data/test-config'

import { createRouter } from '../createRouter'
import { spy } from 'sinon'
import supertest from 'supertest'

jest.mock('express', () => {
	const express = require.requireActual('express')
	express.static = path => (req, res) => res.status(200).send(path)
	return express
})

describe('integration test', () => {
	const logger = spy()
	const app = createRouter(testConfig, { logLevel: 4, logger })
	const app_without_catchAll = createRouter(testConfig, {
		logLevel: 4,
		logger,
		useCatchAll: false,
	})
	const app_with_static = createRouter(
		{ ...testConfig, static: '/home' },
		{ logLevel: 4, logger },
	)

	it('should throw for invalid routing configs', () => {
		try {
			createRouter({ middleware: ['test'] }, { logLevel: 1, logger })
		} catch (err) {
			expect(err.toString()).toEqual(
				'Error: Invalid router config. Middleware needs to be an array of functions.',
			)
		}
		try {
			createRouter(
				{ post: { middleware: ['test'], controller: Function.prototype } },
				{ logLevel: 1, logger },
			)
		} catch (err) {
			expect(err.toString()).toEqual(
				'Error: Invalid router config. Middleware needs to be an array of functions.',
			)
		}
		try {
			createRouter({ post: {} }, { logLevel: 1, logger })
		} catch (err) {
			expect(err.toString()).toEqual(
				'Error: Invalid router config. Endpoints need to define a controller function.',
			)
		}
	})

	it('should call root level middleware for any request', () => {
		resetSpies()
		logger.resetHistory()
		return supertest(app)
			.get('/api')
			.then(result => {
				expect(result.status).toEqual(404)
				expect(spies.testMiddleware.callCount).toEqual(1)
				expect(logger.args).toMatchSnapshot()
			})
	})

	it('should call correct middlewares, validation and controller for valid request to "/api/branch"', () => {
		resetSpies()
		logger.resetHistory()
		return supertest(app)
			.post('/api/branches')
			.send({ report: 'report', repository: 'foo', branch: '123' })
			.then(result => {
				expect(spies.testMiddleware.callCount).toEqual(1)
				expect(spies.testMiddlewareBranch.callCount).toEqual(1)
				expect(spies.addBranchReport.callCount).toEqual(1)
				expect(result.status).toEqual(200)
				expect(logger.args).toMatchSnapshot()
			})
	})

	it('should call correct middlewares and validation request to "/api/branch" with invalid body', () => {
		resetSpies()
		logger.resetHistory()
		return supertest(app)
			.post('/api/branches')
			.send({ report: 'report', repository: 'foo', branch: 'asd' })
			.then(result => {
				expect(spies.testMiddleware.callCount).toEqual(1)
				expect(spies.testMiddlewareBranch.callCount).toEqual(1)
				expect(spies.addBranchReport.callCount).toEqual(0)
				expect(result.status).toEqual(400)
				expect(logger.args).toMatchSnapshot()
			})
	})

	it('should skip to next route if path param is invalid', () => {
		resetSpies()
		logger.resetHistory()
		return supertest(app)
			.post('/api/pullrequests/asad')
			.send({ report: 'report', repository: 'foo', branch: 'asd' })
			.then(result => {
				expect(spies.testMiddleware.callCount).toEqual(1)
				expect(spies.testMiddlewareBranch.callCount).toEqual(0)
				expect(spies.addBranchReport.callCount).toEqual(0)
				expect(result.status).toEqual(404)
				expect(JSON.parse(result.text)).toMatchObject({
					success: false,
					reason: 'Not_Found',
				})
				expect(logger.args).toMatchSnapshot()
			})
	})

	it('should return default 404 without catchAll and matching route ', () => {
		resetSpies()
		logger.resetHistory()
		return supertest(app_without_catchAll)
			.post('/api/pullrequests/asad')
			.send({ report: 'report', repository: 'foo', branch: 'asd' })
			.then(result => {
				expect(spies.testMiddleware.callCount).toEqual(1)
				expect(spies.testMiddlewareBranch.callCount).toEqual(0)
				expect(spies.addBranchReport.callCount).toEqual(0)
				expect(result.status).toEqual(404)
				expect(logger.args).toMatchSnapshot()
			})
	})

	it('should call full route if every parameter is valid', () => {
		resetSpies()
		logger.resetHistory()
		return supertest(app)
			.post('/api/pullrequests/123/')
			.send({ report: 'report', repository: 'foo', base: '123', pullRequestId: 123 })
			.then(result => {
				expect(spies.testMiddleware.callCount).toEqual(1)
				expect(spies.testMiddlewareBranch.callCount).toEqual(0)
				expect(spies.testMiddlewareEndPoint.callCount).toEqual(1)
				expect(spies.addBranchReport.callCount).toEqual(0)
				expect(spies.addPullRequestReport.callCount).toEqual(1)
				expect(result.status).toEqual(200)
				expect(logger.args).toMatchSnapshot()
			})
	})

	it('should call static middleware if it doesnt match anything else for gets', () => {
		resetSpies()
		logger.resetHistory()
		return supertest(app_with_static)
			.get('/invalidTestPath')
			.then(result => {
				expect(spies.testMiddleware.callCount).toEqual(1)
				expect(spies.testMiddlewareBranch.callCount).toEqual(0)
				expect(spies.testMiddlewareEndPoint.callCount).toEqual(0)
				expect(spies.addBranchReport.callCount).toEqual(0)
				expect(spies.addPullRequestReport.callCount).toEqual(0)
				expect(result.status).toEqual(200)
				expect(result.text).toEqual('/home')
				expect(logger.args).toMatchSnapshot()
			})
	})
})
