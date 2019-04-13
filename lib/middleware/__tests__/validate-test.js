import { oneOfValidator, regexpValidator } from '../validate.js'

import { createValidate } from '../validate'
import { spy } from 'sinon'

const validationMap = {
	params: {
		id: regexpValidator(/^[0-9]*$/),
	},
	body: {
		value: regexpValidator(/^[a-zA-Z]*$/),
		value2: val => +val > 5,
	},
	query: { param: oneOfValidator(['test1', 'foo'], true) },
}

const validationMap2 = {
	...validationMap,
	body: {
		...validationMap.body,
		testObject: { value3: regexpValidator(/^[0-9]*$/), value4: regexpValidator(/^[0-9]*$/) },
	},
}

const validationMap3 = {
	body: {
		repository: {
			repo: /^[a-zA-Z-_]{5,250}$/,
			type: /^(users|projects)$/,
			project: /^[a-zA-Z-_]{5,250}$/,
		},
		name: /^[a-zA-Z-_]{5,250}$/,
	},
}

const log = spy()
const next = spy()
const send = spy()
const res = {
	status: status => {
		expect(status).toEqual(400)
		return { send }
	},
}

function testValidate(req, map = validationMap) {
	log.resetHistory()
	next.resetHistory()
	send.resetHistory()
	createValidate(log)(map)(req, res, next)
}

describe('validation middleware', () => {
	it('should pass on a valid request', () => {
		testValidate({
			params: { id: 1 },
			body: { value: 'test', value2: 10 },
			query: { param: 'test1' },
		})

		expect(send.notCalled).toBeTruthy()
		expect(next.calledOnce).toBeTruthy()
		expect(next.firstCall.args.length).toEqual(0)
		expect(log.calledOnce).toBeTruthy()
	})

	it('should pass on a valid request if the optional query param is not set', () => {
		testValidate({
			params: { id: 1 },
			body: { value: 'test', value2: 10 },
		})

		expect(send.notCalled).toBeTruthy()
		expect(next.calledOnce).toBeTruthy()
		expect(next.firstCall.args.length).toEqual(0)
		expect(log.calledOnce).toBeTruthy()
	})

	it('should pass on request for valid testobject', () => {
		testValidate(
			{
				params: { id: '123' },
				body: {
					value: 'test',
					value2: 10,
					testObject: { value3: '123', value4: '112312323' },
				},
				query: { param: 'test1' },
			},
			validationMap2,
		)

		expect(send.notCalled).toBeTruthy()
		expect(next.calledOnce).toBeTruthy()
		expect(next.firstCall.args.length).toEqual(0)
		expect(log.calledOnce).toBeTruthy()
	})

	it('should pass on request for valid testobject', () => {
		testValidate(
			{
				body: {
					name: 'develop',
					repository: {
						repo: 'atlantis',
						type: 'projects',
						project: 'WEBFLEET',
					},
				},
			},
			validationMap3,
		)

		expect(send.notCalled).toBeTruthy()
		expect(next.calledOnce).toBeTruthy()
		expect(next.firstCall.args.length).toEqual(0)
		expect(log.calledOnce).toBeTruthy()
	})

	it('should call next route if request params are invalid', () => {
		testValidate({
			params: { id: '1a23' },
			body: { value: 'test', value2: 10 },
		})

		expect(send.notCalled).toBeTruthy()
		expect(next.calledOnce).toBeTruthy()
		expect(next.firstCall.args.length).toEqual(1)
		expect(next.calledWith('router')).toBeTruthy()
		expect(log.calledOnce).toBeTruthy()
	})

	it('should call next route if request params are missing', () => {
		testValidate({
			body: { value: 'test', value2: 10 },
		})

		expect(send.notCalled).toBeTruthy()
		expect(next.calledOnce).toBeTruthy()
		expect(next.firstCall.args.length).toEqual(1)
		expect(next.calledWith('router')).toBeTruthy()
		expect(log.calledOnce).toBeTruthy()
	})

	it('should send a bad_request if request body is invalid and params are valid', () => {
		testValidate({
			params: { id: '123' },
			body: { value: 'tesa12312t', value2: 10 },
		})

		expect(send.calledOnce).toBeTruthy()
		expect(next.notCalled).toBeTruthy()
		expect(log.calledOnce).toBeTruthy()
	})

	it('should send a bad_request if request body is invalid and params are valid', () => {
		testValidate({
			params: { id: '123' },
			body: { value: 'test', value2: 1 },
		})

		expect(send.calledOnce).toBeTruthy()
		expect(next.notCalled).toBeTruthy()
		expect(log.calledOnce).toBeTruthy()
	})

	it('should send a bad_request if query is invalid and params are valid', () => {
		testValidate({
			params: { id: '123' },
			body: { value: 'test', value2: 10 },
			query: { param: 'test1123' },
		})

		expect(send.calledOnce).toBeTruthy()
		expect(next.notCalled).toBeTruthy()
		expect(log.calledOnce).toBeTruthy()
	})

	it('should send a bad_request if query is invalid and params are valid', () => {
		testValidate(
			{
				params: { id: '123' },
				body: { value: 'test', value2: 10, testObject: { value3: '123', value4: 12312 } },
				query: { param: 'test1123' },
			},
			validationMap2,
		)

		expect(send.calledOnce).toBeTruthy()
		expect(next.notCalled).toBeTruthy()
		expect(log.calledOnce).toBeTruthy()
	})
})
