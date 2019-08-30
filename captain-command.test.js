const captainCommand = require('captain-command')
const {ChildProcess} = require('child_process')

function arraysAreEqual(pArrayA, pArrayB) {
	if (pArrayA.length !== pArrayB.length) {
		return false
	}
	for (const i in pArrayA) {
		if (pArrayA[i] !== pArrayB[i]) {
			return false
		}
	}
	return true
}

expect.extend({
	toBeACloneOf(pValue, pArg) {
		if (!(pValue instanceof Object)) {
			return {
				pass: false,
				message: 'expected value to be an Object'
			}
		}
		const keysA = Object.keys(pValue).sort()
		const keysB = Object.keys(pArg).sort()
		if (!arraysAreEqual(keysA, keysB)) {
			return {
				pass: false,
				message: 'expected object keys to match'
			}
		}
		if (pValue === pArg) {
			return {
				pass: false,
				message: 'expected argument not to be a reference to value object'
			}
		}
		return {
			pass: true,
			message: 'expected argument to be a clone of value'
		}
	}
})

describe('configure using addOrders', () => {
	let fn
	beforeEach(() => {
		fn = jest.fn()
	})

	test('add an order with no command name', () => {
		const captain = captainCommand.addOrders(fn)
		expect(captain).toBeACloneOf(captainCommand)
	})
	test('add an order with a command name', () => {
		const captain = captainCommand.addOrders('echo', fn)
		expect(captain).toBeACloneOf(captainCommand)
	})
	test('add an order with invalid arguments', () => {
		const captain1 = () => {captainCommand.addOrders(true, fn)}
		expect(captain1).toThrow()
		const captain2 = () => {captainCommand.addOrders(true)}
		expect(captain2).toThrow()
		const captain3 = () => {captainCommand.addOrders('echo', true)}
		expect(captain3).toThrow()
	})
})

describe('configuring using addConfigs', () => {
	let fn
	beforeEach(() => {
		fn = jest.fn()
	})

	test('add an order with no command name', () => {
		const config = {fn}
		const captain = captainCommand.addConfigs(config)
		expect(captain).toBeACloneOf(captainCommand)
	})
	
	test('add an order with a comman name', () => {
		const config = {commandName: 'echo', fn}
		const captain = captainCommand.addConfigs(config)
		expect(captain).toBeACloneOf(captainCommand)
	})

	test('use a config object to add an order', () => {
		const config = {commandName: 'echo', fn}
		const captain = captainCommand.addConfigs(config)
		expect(captain).toBeACloneOf(captainCommand)
	})

	test('use a config function to add an order', () => {
		const config = () => {return {commandName: 'echo', fn}}
		const captain = captainCommand.addConfigs(config)
		expect(captain).toBeACloneOf(captainCommand)
	})

	test('use an array of config objects to add multiple orders', () => {
		const config = [
			{commandName: 'echo', fn},
			{commandName: 'pwd', fn}
		]
		const captain = captainCommand.addConfigs(config)
		expect(captain).toBeACloneOf(captainCommand)
	})

	test('use array of config functions to add multiple orders', () => {
		const config = [
			() => {return {commandName: 'echo', fn}},
			() => {return {commandName: 'pwd', fn}},
		]
		const captain = captainCommand.addConfigs(config)
		expect(captain).toBeACloneOf(captainCommand)
	})

	test('use a function to add multiple orders', () => {
		const config = () => {
			return [
				{commandName: 'echo', fn},
				{commandName: 'pwd', fn}
			]
		}
		const captain = captainCommand.addConfigs(config)
		expect(captain).toBeACloneOf(captainCommand)
	})
})

describe('calling command without any configuration', () => {
	test('without a command argument', () => {
		const captain = () => {captainCommand.command()}
		expect(captain).toThrow()
	})
	test('with command as a string', () => {
		expect(captainCommand.command('echo')).toBeInstanceOf(ChildProcess)
	})
	test('with command as an array', () => {
		expect(captainCommand.command(['echo'])).toBeInstanceOf(ChildProcess)
	})
	test('with invalid command arguments', () => {
		const captain1 = () => {captainCommand.command([])}
		expect(captain1).toThrow()
		const captain2 = () => {captainCommand.command([null])}
		expect(captain2).toThrow()
		const captain3 = () => {captainCommand.command(null)}
		expect(captain3).toThrow()
	})
})

describe('resolving configs functions', () => {
	test('a config with no fn property', () => {
		const config = {}
		const captain = () => {captainCommand.addConfigs(config).command('echo')}
		expect(captain).toThrow()
	})
})

describe('resolving order functions', () => {
	let fn
	beforeEach(() => {
		fn = jest.fn()
	})

	test('an order with no command name', () => {
		const config = {fn}
		captainCommand.addConfigs(config).command('echo')
		expect(fn).toHaveBeenCalled()
	})
	test('an order in a config object', () => {
		const config = {commandName: 'echo', fn}
		captainCommand.addConfigs(config).command('echo')
		expect(fn).toHaveBeenCalled()
	})
	test('an order in a config function', () => {
		const config = () => {return {commandName: 'echo', fn}}
		captainCommand.addConfigs(config).command('echo')
		expect(fn).toHaveBeenCalled()
	})
	test('an order in a config function passes context as argument', () => {
		const config = (pContext) => {
			return {
				commandName: 'echo',
				fn: () => {return pContext},
			}
		}
		const captain = captainCommand.addConfigs(config)
		expect(captain.command('echo')).toBe(captain)
	})
	test('an order in an array of config objects', () => {
		const fn2 = jest.fn()
		const config = [
			{commandName: 'echo', fn},
			{commandName: 'pwd', fn: fn2}
		]
		captainCommand.addConfigs(config).command('echo')
		expect(fn).toHaveBeenCalled()
		expect(fn2).not.toHaveBeenCalled()
	})
	test('an order in an array of config functions', () => {
		const fn2 = jest.fn()
		const config = [
			() => {return {commandName: 'echo', fn}},
			() => {return {commandName: 'pwd', fn: fn2}},
		]
		captainCommand.addConfigs(config).command('echo')
		expect(fn).toHaveBeenCalled()
		expect(fn2).not.toHaveBeenCalled()
	})
	test('an order in a function returning an array of config objects', () => {
		const fn2 = jest.fn()
		const config = () => {
			return [
				{commandName: 'echo', fn},
				{commandName: 'pwd', fn: fn2}
			]
		}
		captainCommand.addConfigs(config).command('echo')
		expect(fn).toHaveBeenCalled()
		expect(fn2).not.toHaveBeenCalled()
	})
})

describe('handling order functions', () => {
	test('command as a string', () => {
		const config = {
			fn(pCommand) {return pCommand}
		}
		const captain = captainCommand.addConfigs(config)
		expect(captain.command('echo hello world')).toEqual(['echo', 'hello', 'world'])
	})
	test('command as an array', () => {
		const config = {
			fn(pCommand) {return pCommand}
		}
		const captain = captainCommand.addConfigs(config)
		expect(captain.command(['echo', 'hello', 'world'])).toEqual(['echo', 'hello', 'world'])
	})
})
