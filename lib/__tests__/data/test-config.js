import { oneOfValidator, regexpValidator } from '../../middleware/validate'
import { spy, stub } from 'sinon'

const branch = regexpValidator(/^[0-9]{0,25}$/)
const repository = oneOfValidator(['test', 'foo'])
const pullRequestId = regexpValidator(/^[0-9]{0,10}$/)
const report = value => value === 'report'

const addPullRequestReport = stub().callsFake((req, res) => res.status(200).send())
const addBranchReport = stub().callsFake((req, res) => res.status(200).send())
const testMiddleware = stub().callsFake((req, res, next) => next())
const testMiddlewareBranch = stub().callsFake((req, res, next) => next())
const testMiddlewareEndPoint = stub().callsFake((req, res, next) => next())

export const resetSpies = () => {
	addPullRequestReport.resetHistory()
	addBranchReport.resetHistory()
	testMiddleware.resetHistory()
	testMiddlewareBranch.resetHistory()
	testMiddlewareEndPoint.resetHistory()
}

export const spies = {
	addPullRequestReport,
	addBranchReport,
	testMiddleware,
	testMiddlewareBranch,
	testMiddlewareEndPoint,
}

export const testConfig = {
	middleware: [testMiddleware],
	api: {
		branches: {
			middleware: [testMiddlewareBranch],
			post: {
				body: { branch, report, repository },
				controller: addBranchReport,
			},
		},
		pullrequests: {
			':id': {
				params: { id: pullRequestId },
				post: {
					middleware: [testMiddlewareEndPoint],
					body: {
						pullRequestId,
						report,
						base: branch,
						repository,
					},
					controller: addPullRequestReport,
				},
			},
		},
	},
}
