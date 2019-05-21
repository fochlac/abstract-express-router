/**
 * factory function for a validation middleware
 *
 * @param {(logLevel:number, ...message) => void} log configured logger
 * @returns {(validationMap:object) => (req, res, next) => void}
 */
export const createValidate = log => {
	return function validate(validationMap) {
		let failed
		return (req, res, next) => {
			failed = 'params'
			const hasValidParams = validateObject(req.params, validationMap.params)
			const isValid =
				hasValidParams &&
				['body', 'query'].every(reqKey => {
					failed = reqKey
					return validateObject(req[reqKey], validationMap[reqKey])
				})

			if (isValid) {
				next()
				log(3, req.requestId, `Validation succeded for call to ${req.baseUrl}`)
			} else if (!hasValidParams) {
				log(
					3, req.requestId,
					`Validation of path parameters failed for call to ${
						req.baseUrl
					}. Trying next route.`,
				)
				next('router')
			} else {
				log(2, req.requestId, `Validation failed at field ${failed} for call to ${req.baseUrl}`)
				res.status(400).send({ success: false, reason: 'Bad_Request' })
			}
		}

		function validateObject(input, validationMap) {
			return (
				!validationMap ||
				Object.keys(validationMap).every(param => {
					failed = param
					return validateElement(input && input[param], validationMap[param])
				})
			)
		}

		function validateElement(input, validator) {
			if (!input || !input.toString) return validator.allowUndefined || false

			switch (getValidatorType(validator)) {
				case OBJECT:
					return validateObject(input, validator)
				case FUNCTION:
					return validator(input)
				case REGEXP:
					return validateRegex(input.toString(), validator.regexp)
				case ONEOF:
					return validateOneOf(input.toString(), validator.list)
				default:
					return false
			}
		}
	}
}

function getValidatorType(validator) {
	if (typeof validator === 'object' && validator.type === REGEXP && validator.regexp) {
		return REGEXP
	}
	if (typeof validator === 'object' && validator.type === ONEOF && validator.list) {
		return ONEOF
	}
	if (typeof validator === 'function') {
		return FUNCTION
	}
	if (typeof validator === 'object') {
		return OBJECT
	}
}

const FUNCTION = 'FUNCTION'
const OBJECT = 'OBJECT'

const REGEXP = 'REGEXP'
function validateRegex(input, regexp) {
	return regexp.test(input)
}

const ONEOF = 'ONEOF'
function validateOneOf(input, list) {
	return list.includes(input)
}

export function regexpValidator(regexp, allowUndefined = false) {
	return {
		type: REGEXP,
		regexp,
		allowUndefined,
	}
}

export function oneOfValidator(list, allowUndefined = false) {
	return {
		type: ONEOF,
		list,
		allowUndefined,
	}
}
