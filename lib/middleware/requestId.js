let currentId = 0

export const requestId = (req, res, next) => {
	currentId += Math.floor(Math.random() * 73) + 1
	req.requestId = currentId
	next()
}
