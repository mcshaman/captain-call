const {spawn} = require('child_process')

module.exports = function defaultHandler(pCommand, pArgs) {
	return spawn(pCommand, pArgs, {stdio: 'inherit'})
}