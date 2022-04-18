import { DEBUG } from "./constants.js";

export const evaluate = (exp, env, s = 1) => {
	if (exp && exp.type === 'prog' && s === 1 && DEBUG) {
		console.log('|- Parsed Program Items ---------------------------------------------------------------|');

		for (const scope of exp.prog) {
			console.log(scope);
		}
	}

	if (exp && exp.type === 'prog' && s === 1 && DEBUG) {
		console.log('|- Program run ------------------------------------------------------------------------|');
	}

	const make_lambda = (env, exp) => {
		if (exp.name) {
			env = env.extanded;
			env.defVar(exp.name.value, lambda);
		}

		function lambda() {
			const names = exp.vars.map(v => v.value);
			const scope = env.extanded;

			for (let i = 0; i < names.length; ++i) {
				scope.defVar(names[i], i < arguments.length ? arguments[i] : false);
			}

			return evaluate(exp.body, scope, s + 1);
		}

		return lambda;
	};

	const apply_op = (op, a, b) => {
		const num = x => {
			if (typeof x !== "number") throw new Error(`Expected number but got ${x}`);
			return x;
		};

		const div = x => {
			if (num(x) === 0) throw new Error(`Divide by zero`);
			return x;
		};

		switch (op) {
			case '+'  : return num(a) + num(b);
			case '-'  : return num(a) - num(b);
			case '*'  : return num(a) * num(b);
			case '/'  : return num(a) / div(b);
			case '%'  : return num(a) % div(b);
			case '&&' : return a !== false && b;
			case '||' : return a !== false ? a : b;
			case '<'  : return num(a) < num(b);
			case '>'  : return num(a) > num(b);
			case '<=' : return num(a) <= num(b);
			case '>=' : return num(a) >= num(b);
			case '==' : return a == b;
			case '!=' : return a != b;
			case '===' : return a === b;
			case '!==' : return a !== b;
		}
		throw new Error(`Can't apply operator ${op}`);
	}

	switch (exp.type) {
		case undefined: break;
		case 'num':
		case 'bool':
		case 'str': return exp;
		case 'array': return {
			...exp,
			value: exp.value.map(e => {
				return e.value
			})
		};
		case 'var': return env.getVar(exp.value);
		case 'methodCall':
			const input = env.getVar(exp.input.value);

			if (env.typeIncludeMethod(input.type, exp.name.value)) {
				const method = env.types[input.type][exp.name.value];
				env.setVar(exp.input.value, method(input.value, ...(exp.args.map(v => {
					if (v.type === 'var') return env.getVar(v.value).value;
					else return v.value;
				}))));
			} else {
				throw new Error(`${exp.input.value}.${exp.name.value}() not exists!`);
			}
			break;
		case 'let':
			env.defVar(exp.name, exp.value ? evaluate(exp.value, env, s + 1) : false);
			return evaluate(exp.value, env, s + 1);
		case 'assign':
			if (exp.left.type !== 'var') {
				throw new Error(`Can't assign to ${JSON.stringify(exp.left)}`);
			}
			return env.setVar(exp.left.value, evaluate(exp.right, env, s + 1));
		case "binary":
			return apply_op(
				exp.operator,
				evaluate(exp.left, env, s + 1),
				evaluate(exp.right, env, s + 1)
			);
		case 'lambda': return make_lambda(env, exp);
		case "call":
			const func = evaluate(exp.func, env, s + 1);
			return func.apply(
				null,
				exp.args.map(arg => {
					const evaluation = evaluate(arg, env, s + 1);
					return evaluation['type'] !== undefined && evaluation['value'] !== undefined
						? evaluation.value : evaluation;
				})
			);
		case 'if':
			const cond = evaluate(exp.cond, env, s + 1);
			if (cond !== false) return evaluate(exp.then, env, s + 1);
			if (exp.elseif) return evaluate(exp.elseif, env, s + 1);
			return exp.else ? evaluate(exp.else, env, s + 1) : false;
		case "prog": return exp.prog.reduce((r, expr) => {
			const evaluation = evaluate(expr, env, s + 1);
			// console.log(evaluation, expr, 'prog')
			return evaluation && evaluation['type'] !== undefined && evaluation['value'] !== undefined
				? evaluation['value'] : evaluation;
		}, false);
		default: throw new Error(`I don't know how to evaluate ${exp.type}`);
	}
};
