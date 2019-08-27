#!/usr/bin/env node
const shellQuote = require('shell-quote')
const defaultConfig = require('./default-config.js')

const DEFAULT_COMMAND_NAME = Symbol('default command name')

function buildConfig(pConfigs, pContext) {
	const resolvedConfigs = pConfigs.reduce((pResolvedConfigs, pConfig) => {
		const resolvedConfig = typeof pConfig === 'function' ? pConfig(pContext) : pConfig
		return pResolvedConfigs.concat(resolvedConfig)
	}, [])

	const orders = {}
	for (const resolvedConfig of resolvedConfigs) {
		const {type, fn} = resolvedConfig
		if (typeof fn !== 'function') {
			throw new Error('invalid fn property in config')
		}

		if (type === 'order') {
			const {commandName} = resolvedConfig
			const key = commandName || DEFAULT_COMMAND_NAME
			orders[key] = fn
		} else {
			throw new Error('invalid config type in config')
		}
	}
	return orders
}

function getOrders(pCommandName, pOrders) {
	const command = pOrders[pCommandName]
	if (command) {
		return command
	}
	return pOrders[DEFAULT_COMMAND_NAME]
}

function commandIsValid(pCommand) {
	const command = Array.isArray(pCommand) ? pCommand[0] : pCommand
	if (command && typeof command === 'string') {
		return true
	}
}

const captain = ((pDefaultConfig) => {
	function captain(pScopedConfigs = []) {
		const scopedObject = {
			addConfigs(pConfigs) {
				const configs = Array.isArray(pConfigs) ? pConfigs : [pConfigs]
				return captain([...pScopedConfigs, ...configs])
			},
			addOrders(...pArgs) {
				const [commandName, fn] = pArgs.length > 1 ? pArgs : [null, pArgs[0]]

				if (typeof fn !== 'function') {
					throw new Error('addOrders fn argument not valid')
				}

				const config = {
					type: 'order',
					fn
				}

				if (commandName) {
					if (typeof commandName !== 'string') {
						throw new Error('addOrders commandName argument not valid')
					}

					config.commandName = commandName
				}
				return captain([...pScopedConfigs, config])
			},
			command(pCommand) {
				if (!commandIsValid(pCommand)) {
					throw new Error('command called with invalid command argument')
				}

				const command = typeof pCommand === 'string' ? shellQuote.parse(pCommand) : pCommand
				const commandName = command[0]

				const orders = buildConfig(pScopedConfigs, scopedObject)
				const order = getOrders(commandName, orders)
				if (!order) {
					throw new Error('no default orders found')
				}

				return order(command)
			},
		}
		return scopedObject
	}
	return captain().addConfigs(pDefaultConfig)
})(defaultConfig)

module.exports = captain

if (require.main === module) {
	process.on('warning', pWarning => {
		if (process.env.NODE_ENV === 'development') {
			console.warn(pWarning)
		}
	})

	captain.command(process.argv.slice(2))
}