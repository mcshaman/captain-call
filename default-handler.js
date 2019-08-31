const {spawn} = require('child_process')

module.exports = function defaultHandler(pArgs) {
	const command = pArgs[0]
	const args = pArgs.slice(1)
	return spawn(command, args, {stdio: 'inherit'})
}