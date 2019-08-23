#!/usr/bin/env node
const defaultCommand = require('./default-command.js')

function getCommand(...pArgs) {
	const [commandName, commands] = pArgs.length > 1 ? pArgs : [undefined, pArgs[0]]
	return commands.find(({name}) => name === commandName)
}

const captain = (function captin(...pCommands) {
	const commands = pCommands
	return {
		command(...pCommands) {
			return captain(...commands, ...pCommands)
		},
		call(pCommand) {
			if (!pCommand.length) {
				throw new Error('No command supplied')
			}
		
			const commandName = pCommand[0]
			const command = getCommand(commandName, commands) || {}
			const defaultCommand = getCommand(commands) || {}
			const orders = command.orders || defaultCommand.orders
			const inspection = command.inspection || defaultCommand.inspection

			if (!orders) {
				throw new Error('No default orders found')
			}

			const response = orders(pCommand)
			if (inspection) {
				return inspection(response)
			}
			return response
		},
	}
})(defaultCommand)

module.exports = captain

if (require.main === module) {
	captain.call(process.argv.slice(2))
}