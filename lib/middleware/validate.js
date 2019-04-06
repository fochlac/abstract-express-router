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
				log(3, `Validation succeded for call to ${req.baseUrl}`)
			} else if (!hasValidParams) {
				log(
					3,
					`Validation of path parameters failed for call to ${req.baseUrl}. Trying next route.`,
				)
				next('router')
			} else {
				log(2, `Validation failed at field ${failed} for call to ${req.baseUrl}`)
				res.status(400).send({ success: false, reason: 'Bad_Request' })
			}
		}

		function validateObject(input, validationMap) {
			return (
				!validationMap ||
				Object.keys(validationMap).every(param => {
					failed = param
					return typeof validationMap[param] === 'object' && !validationMap[param].type
						? validateObject(input && input[param], validationMap[param])
						: validateElement(input && input[param], validationMap[param])
				})
			)
		}

		function validateElement(input, validationInfo) {
			if (typeof validationInfo === 'function') {
				return validationInfo(input)
			}

			switch (validationInfo.type) {
				case REGEXP:
					if (!input || !input.toString) return validationInfo.allowUndefined
					return validateRegex(input.toString(), validationInfo.regexp)
				case ONEOF:
					if (!input || !input.toString) return validationInfo.allowUndefined
					return validateOneOf(input.toString(), validationInfo.list)
			}
		}
	}
}

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
