#!/usr/bin/env node
const defaultHandler = require('./defaultHandler.js')

class Captain {
	constructor() {
		this.handlers = {}
		this.inspections = []
	}

	addHandler(pCommandName, pHandler) {
		this.handlers[pCommandName] = pHandler
	}

	addInspection() {
		const [commandName, fn] = arguments.length > 1 ? arguments : [null, arguments[0]]
		this.inspections.push({commandName: commandName, fn})
	}

	call(pCommand) {
		if (!pCommand.length) {
			throw new Error('No command supplied')
		}
	
		const commandName = pCommand[0]
		const handler = this.handlers[commandName] || defaultHandler
		const args = pCommand.slice(1)
		const response = handler(commandName, args)
		return this.inspections.reduce((pResponse, pInspection) => {
			if (pInspection.commandName === commandName || !pInspection.commandName) {
				return pInspection.fn(pResponse)
			}
			return pResponse
		}, response)
	}
}

if (require.main === module) {
	const captain = new Captain()
	captain.call(process.argv.slice(2))
}

module.exports = Captain