import { is_cli } from "./helpers.js";

class Environment {
	vars = {};
	types = {};

	constructor(parent) {
		this.parent = parent;
		this.vars = Object.create(parent ? parent.vars : null);
	}

	/**
	 * @returns {Environment}
	 */
	get extanded() {
		return new Environment(this);
	}

	/**
	 * @param {string} name
	 */
	lookup(name) {
		let scope = this;

		while (scope) {
			if (Object.prototype.hasOwnProperty.call(scope.vars, name)) {
				return scope;
			}
			scope = scope.parent;
		}
	}

	/**
	 * @param {string} name
	 */
	getVar(name) {
		if (name in this.vars) {
			return this.vars[name];
		}
		throw new Error(`Undefined variable ${name}`);
	}

	/**
	 * @param {string} name
	 * @param {any} value
	 */
	setVar(name, value) {
		const scope = this.lookup(name);

		if (!scope && this.parent) {
			throw new Error(`Undefined variable ${name}`);
		}

		return (scope || this).vars[name] = value;
	}

	/**
	 * @param {string} name
	 * @param {any} value
	 */
	defVar(name, value) {
		this.vars[name] = value;
	}

	/**
	 * @param {string} name
	 * @param {Record<string, Function>} value
	 */
	defType(name, value) {
		this.types[name] = value;
	}

	typeIncludeMethod(type, method) {
		return type in this.types && method in this.types[type];
	}
}

export const globalEnv = new Environment();

let fibJS;
globalEnv.defVar("fibJS", (fibJS = n => n < 2 ? n : fibJS(n - 1) + fibJS(n - 2)));

globalEnv.defVar("time", fn => {
	const t1 = Date.now();
	const ret = fn();
	const t2 = Date.now();
	const message = `Time: ${(t2 - t1)}ms`;

	if (!is_cli()) console.log(message);
	else process.stdout.write(message);

	return ret;
});

globalEnv.defType('array', {
	add(arr, ...args) {
		return [...arr, ...args];
	}
})

if (is_cli()) {
	globalEnv.defVar('print', v => {
		if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'object') {
			v = v.toString();
		}
		console.log(v)
	});

	globalEnv.defVar('println', v => {
		process.stdout.write(v.toString())
	});
}
