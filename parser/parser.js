import { Skipper } from "./skipper.js";
import { Tester } from "./tester.js";
import { generateBool, generateFalse, generateOperation } from "../types/index.js";
import { maybe_binary, maybe_call } from "./maybe.js";
import { operators } from "../constants.js";

export class Parser {
	/**
	 * @param {TokenStream} stream
	 */
	constructor(stream) {
		this.stream = stream;
	}

	delimited(start, stop, separator, parser) {
		const a = [];
		let first = true;
		new Skipper(this).punctuation(start);

		while (!this.stream.eof()) {
			if (new Tester(this).punctuation(stop)) break;

			if (first) first = false;
			else if (operators.reduce((r, op) =>
				!r && new Tester(this).operator(op) ? generateOperation(op) : r, false))
				a.push(this.stream.next());
			else new Skipper(this).punctuation(separator);

			if (new Tester(this).punctuation(stop)) break;

			a.push(parser());
		}

		new Skipper(this).punctuation(stop);

		return a;
	}

	get let() {
		if (new Tester(this).keyword('let')) {
			new Skipper(this).keyword('let');
		}

		const name = this.stream.next();

		if (new Tester(this).operator('=')) {
			new Skipper(this).operator('=');
		}

		let value = this.stream.next();

		if (new Tester(this, value).keyword('fn')) {
			const defs = this.delimited('(', ')', ',', () => this.expression());

			return {
				type: 'let',
				name: name.value,
				value: {
					type: "lambda",
					name: name,
					vars: defs.map(def => def),
					body: this.expression()
				}
			};
		}

		return {
			type: 'let',
			name: name.value,
			value
		};
	}

	get bool() {
		return generateBool(this.stream.next().value === 'true');
	}

	get if() {
		const skipper = new Skipper(this);
		const tester = new Tester(this);

		skipper.keyword('if');

		const cond = this.delimited('(', ')', ',', () => this.expression());

		skipper.punctuation('{');

		const then = this.expression();
		this.stream.next();

		const _return = {
			type: 'if',
			cond,
			then
		};

		skipper.punctuation('}');

		if (tester.keyword('else')) {
			skipper.keyword('else');

			if (tester.keyword('if')) {
				_return.elseif = this.if;
			} else {
				skipper.punctuation('{');

				_return.else = this.expression();
				this.stream.next();

				skipper.punctuation('}');
			}
		}

		return _return;
	}

	get lambda() {
		return {
			type: "lambda",
			name: this.stream.peek().type === 'var' ? this.stream.next().value : null,
			vars: this.delimited('(', ')', ',', () => this.var_name),
			body: this.expression()
		};
	}

	method(input) {
		this.stream.next();

		return {
			type: 'methodCall',
			input,
			name: this.stream.next(),
			args: this.delimited('(', ')', ',', () => this.expression())
		};
	}

	call(func) {
		return {
			type: 'call',
			func,
			args: this.delimited('(', ')', ',', () => this.expression())
		}
	}

	get var_name() {
		const name = this.stream.next();
		console.log(name)

		if (name.type !== 'var')
			this.stream.croak('Expecting variable name');

		return name.value;
	}

	expression() {
		return maybe_call(() =>
			maybe_binary(this.atom(), 0, this), this);
	}

	atom() {
		return maybe_call(() => {
			if (new Tester(this).punctuation('(')) {
				this.stream.next();
				const exp = this.expression();
				new Skipper(this).punctuation(')');

				return exp;
			}
			if (new Tester(this).punctuation('{')) return this.prog();
			if (new Tester(this).keyword('let')) return this.let;
			if (new Tester(this).keyword('if')) return this.if;
			if (new Tester(this).bool()) return this.bool;
			if (new Tester(this).keyword('fn')) {
				this.stream.next();
				return this.lambda;
			}

			const tok = this.stream.next();
			const next = this.stream.peek();

			if (tok.type === 'var' && next.type === 'punc' && next.value === '.') {
				return this.method(tok);
			}

			if (
				tok.type === 'var' ||
				tok.type === 'num' ||
				tok.type === 'str'
			) return tok;

			this.stream.croak(`Unexpected token: ${JSON.stringify(next)}`);
		}, this);
	}

	prog() {
		const prog = this.delimited('{', '}', ';', () => this.expression());

		if (prog.length === 0)
			return generateFalse();
		if (prog.length === 1)
			return prog[0];

		return { type: "prog", prog: prog };
	}

	programLoop() {
		const prog = [];
		while (!this.stream.eof()) {
			prog.push(this.expression());

			if (new Tester(this).punctuation(';')) {
				new Skipper(this).punctuation(';');
			}
		}
		return { type: "prog", prog: prog };
	}

	get ast() {
		return this.programLoop();
	}
}
