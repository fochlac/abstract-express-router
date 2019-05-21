import { requestId } from '../requestId'

jest.spyOn(Math, 'random').mockImplementation(() => 0.5)
const next = jest.fn()
const req = {}

describe('requestId middleware', () => {
	it('should add a request id', () => {
		requestId(req, null, next)

		expect(req.requestId).toBe(37)
		expect(next).toBeCalledTimes(1)
	})
})
