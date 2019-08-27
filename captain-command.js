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
	const inspections = []
	for (const resolvedConfig of resolvedConfigs) {
		const {type, fn} = resolvedConfig
		if (typeof fn !== 'function') {
			throw new Error('invalid fn property in config')
		}

		if (type === 'order') {
			const {commandName} = resolvedConfig
			const key = commandName || DEFAULT_COMMAND_NAME
			orders[key] = fn
		} else if (type === 'inspection') {
			const inspection = {fn}
			const {commandSelector} = resolvedConfig
			if (commandSelector) {
				inspection.commandSelector = commandSelector
			}
			inspections.push(inspection)
		} else {
			throw new Error('invalid config type in config')
		}
	}
	return {orders, inspections}
}

function getOrders(pCommandName, pOrders) {
	const command = pOrders[pCommandName]
	if (command) {
		return command
	}
	return pOrders[DEFAULT_COMMAND_NAME]
}

function getInspections(pCommandName, pInspections) {
	return pInspections.reduce((pReduced, pInspection) => {
		const {commandSelector, fn} = pInspection
		if (!commandSelector) {
			pReduced.push(fn)
		} else if (commandSelector instanceof RegExp) {
			if (commandSelector.test(pCommandName)) {
				pReduced.push(fn)
			}
		} else if (typeof commandSelector === 'string') {
			if (commandSelector === pCommandName) {
				pReduced.push(fn)
			}
		}
		return pReduced
	}, [])
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
			addInspection(...pArgs) {
				const [commandSelector, fn] = pArgs.length > 1 ? pArgs : [null, pArgs[0]]
				const config = {
					type: 'inspection',
					fn
				}

				if (typeof fn !== 'function') {
					throw new Error('addInspection fn argument not valid')
				}

				if (commandSelector) {
					if (typeof commandSelector !== 'string' && !(commandSelector instanceof RegExp)) {
						throw new Error('addInspection commandSelector argument not valid')
					}

					config.commandSelector = commandSelector
				}
				return captain([...pScopedConfigs, config])
			},
			command(pCommand) {
				if (!commandIsValid(pCommand)) {
					throw new Error('command called with invalid command argument')
				}

				const command = typeof pCommand === 'string' ? shellQuote.parse(pCommand) : pCommand
				const commandName = command[0]

				const config = buildConfig(pScopedConfigs, scopedObject)
				const order = getOrders(commandName, config.orders)
				if (!order) {
					throw new Error('no default orders found')
				}

				const response = order(command, scopedObject)

				const inspections = getInspections(commandName, config.inspections)
				return inspections.reduce((pResponse, pInspection) => {
					return pInspection(pResponse)
				}, response)
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