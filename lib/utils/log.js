/**
 * factory function for the logger
 *
 * loglevels:
 * 0 - silent, 1 - error, 2 - warning, 3 - info, 4 - debug
 *
 * @param {Object} config
 * @returns {(level: number, ...messages:string) => void} configured log function
 */
export const createLogger = ({ logger, logLevel = 3 }) => (level, ...messages) => {
	const message = messages.map(parseMessage).join(' ')
	if (logger) {
		logger({ level, message })
	} else if (level <= logLevel) {
		console.log(`${getDate()}-[abstract-express-router]-${level}-${message}`)
	}
}

function getDate() {
	const now = new Date()

	return `${now.getUTCFullYear()}_${now.getUTCMonth()}_${now.getUTCDate()}-${now.getUTCHours()}:${now.getUTCMinutes()}:${now.getUTCSeconds()}`
}

function parseMessage(item) {
	let output
	if (typeof item === 'string') {
		output = item
	} else {
		try {
			if (Object.prototype.toString.call(item) === '[object Error]') {
				output = '\n' + item.stack.toString()
			} else {
				output = '\n' + JSON.stringify(item, null, 2)
			}
		} catch (err) {
			output = 'error parsing item: ' + item + ' - ' + err
		}
	}
	return output
}
