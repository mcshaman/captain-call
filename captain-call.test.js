const captain = require('captain-call')
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

describe('adding handlers', () => {
	test('with no command path', () => {
		const newCaptain = captain.add(() => {})
		expect(newCaptain).toBeACloneOf(captain)
	})

	test('with a command path', () => {
		const newCaptain = captain.add('echo', () => {})
		expect(newCaptain).toBeACloneOf(captain)
	})

	test('with invalid arguments', () => {
		const callCaptain1 = () => {captain.add(true, () => {})}
		expect(callCaptain1).toThrow()
		const callCaptain2 = () => {captain.add(true)}
		expect(callCaptain2).toThrow()
		const callCaptain3 = () => {captain.add('echo', true)}
		expect(callCaptain3).toThrow()
	})

	test('multiple through chaining', () => {
		const newCaptain = captain.add('echo', () => {}).add('pwd', () => {})
		expect(newCaptain).toBeACloneOf(captain)
	})
})

describe('calling the default handler', () => {
	test('original default handler', () => {
		expect(captain.call('echo')).toBeInstanceOf(ChildProcess)
		expect(captain('echo')).toBeInstanceOf(ChildProcess)
	})

	test('user defined default handler', () => {
		const defaultHandler = jest.fn(() => true)
		const result = captain
			.add(defaultHandler)
			.call('echo')

		expect(defaultHandler).toHaveBeenCalled()
		expect(result).toEqual(true)
	})

	test('without passing any arguments', () => {
		const callCaptain = () => {captain.call()}
		expect(callCaptain).toThrow()
	})

	test('passing invalid command arguments', () => {
		const captain1 = () => {captain.call([])}
		expect(captain1).toThrow()
		const captain2 = () => {captain.call([null])}
		expect(captain2).toThrow()
		const captain3 = () => {captain.call(null)}
		expect(captain3).toThrow()
	})
})

describe('calling a regsitered handler', () => {
	test('through chaining', () => {
		const echoHandler = jest.fn()
		captain
			.add('echo', echoHandler)
			.call('echo')

		expect(echoHandler).toHaveBeenCalled()
	})

	test('only the registered handler is called', () => {
		const defaultHandler = jest.fn()
		const echoHandler = jest.fn()
		captain
			.add(defaultHandler)
			.add('echo', echoHandler)
			.call('echo')

		expect(echoHandler).toHaveBeenCalled()
		expect(defaultHandler).not.toHaveBeenCalled()
	})

	test('arguments are passed to handler', () => {
		const echoHandler = jest.fn()
		const command = ['echo', 'hello', 'world']
		captain
			.add('echo', echoHandler)
			.call(command)
		
		const firstArgument = echoHandler.mock.calls[0][0]
		expect(firstArgument).toBeACloneOf(command)
	})

	test('string command parsed to array format', () => {
		const echoHandler = jest.fn()
		captain
			.add('echo', echoHandler)
			.call('echo hello world')
		
		const firstArgument = echoHandler.mock.calls[0][0]
		expect(firstArgument).toEqual(['echo', 'hello', 'world'])
	})

	test('context is passed to handler', () => {
		const echoHandler = jest.fn()
		const newCaptain = captain.add('echo', echoHandler)
		newCaptain.call('echo')
		
		const secondArgument = echoHandler.mock.calls[0][1]
		expect(secondArgument).toBe(newCaptain)
	})
})
