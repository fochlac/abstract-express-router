import { spy, stub, useFakeTimers } from 'sinon'

import { createLogger } from '../log'

describe('createLogger', () => {
	useFakeTimers(1554501331074)

	it('should use the provided logger', () => {
		const logger = spy()
		const log = createLogger({ logger })

		log(1, 'test', 'test2', { test: '123' }, new Error('test -split-'))
		log(3, 'test', 'test2')

		expect(logger.callCount).toEqual(2)
		expect(logger.firstCall.args[0].level).toEqual(1)
		expect(logger.firstCall.args[0].message.split('-split-')[0]).toMatchSnapshot()
		expect(logger.secondCall.args).toMatchSnapshot()
	})

	it('should use console.log if no logger is provided', () => {
		stub(console, 'log')
		const log = createLogger({ logLevel: 3 })

		const obj = {test: 'test123'}
		obj.obj = obj
		log(1, 'test', 'test2', { test: '123' }, new Error('test -split-'))
		log(3, 'test', 'test2')
		log(4, 'test', 'test2')
		log(2, 'test', 'test2', obj)

		expect(console.log.callCount).toEqual(3)
		expect(console.log.firstCall.args[0].split('-split-')[0]).toMatchSnapshot()
		expect(console.log.secondCall.args).toMatchSnapshot()
		expect(console.log.thirdCall.args).toMatchSnapshot()
		console.log.restore()
	})
})
