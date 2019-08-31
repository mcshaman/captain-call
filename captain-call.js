#!/usr/bin/env node
const shellQuote = require('shell-quote')
const defaultHandler = require('./default-handler.js')

const DEFAULT_HANDLER_KEY = Symbol('default handler')

function parseCommand(pCommand) {
	if (typeof pCommand === 'string') {
		return shellQuote.parse(pCommand)
	}

	if (Array.isArray(pCommand)) {
		if (pCommand.every(pItem => typeof pItem === 'string')) {
			return [...pCommand]
		}
	}

	if (command && typeof command === 'string') {
		throw new Error('command called with invalid command argument')
	}
}

const captain = ((pDefaultHandler) => {
	function captain(pHandlers = {}) {
		function add(...pArgs) {
			const [commandName, handler] = pArgs.length > 1 ? pArgs : [null, pArgs[0]]

			if (commandName) {
				if (typeof commandName !== 'string') {
					throw new Error('addOrders commandName argument not valid')
				}
			}

			if (typeof handler !== 'function') {
				throw new Error('addOrders fn argument not valid')
			}

			const key = commandName ? commandName : DEFAULT_HANDLER_KEY

			return captain({
				...pHandlers,
				[key]: handler
			})
		}

		function call(pCommand) {
			const command = parseCommand(pCommand)
			const commandPath = command[0]
			const handler = pHandlers[commandPath] || pHandlers[DEFAULT_HANDLER_KEY]
			if (typeof handler !== 'function') {
				throw new Error('invalid fn property in config')
			}

			return handler(command, self)
		}
		
		const self = call
		self.add = add
		self.call = call
		return self
	}
	return captain().add(pDefaultHandler)
})(defaultHandler)

module.exports = captain

if (require.main === module) {
	captain.command(process.argv.slice(2))
}