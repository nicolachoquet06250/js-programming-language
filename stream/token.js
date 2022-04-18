import { Stream } from "./stream.js";
import { generateNumber, generateOperation, generatePunc, getDynamicType } from "../types/index.js";
import { generateString } from "../types/string.js";
import { keywords, operators, symbols } from "../constants.js";

class Parent {
	/**
	 * @type {Stream|TokenStream} stream
	 */
	stream = null;
	/**
	 * @param {Stream|TokenStream} stream
	 */
	constructor(stream) {
		this.stream = stream;
	}
}

class Tester extends Parent {
	is_keyword(x) {
		return keywords.indexOf(x) !== -1;
	}
	is_digit(ch) {
		return /[0-9]/i.test(ch);
	}
	is_id_start(ch) {
		return /[a-z_]/i.test(ch);
	}
	is_id(ch) {
		return this.is_id_start(ch) || '?!-<>0123456789'.indexOf(ch) !== -1;
	}
	is_op_char(ch) {
		return operators.indexOf(ch) !== -1;
	}
	is_punctuation(ch) {
		return symbols.indexOf(ch) !== -1;
	}
	is_whitespace(ch) {
		return ' \t\n\r'.indexOf(ch) !== -1;
	}
	is_simple_quote(ch) {
		return ch === "'";
	}
	is_double_quote(ch) {
		return ch === '"';
	}
	is_quote(ch) {
		return this.is_simple_quote(ch) || this.is_double_quote(ch);
	}
	is_open_hook(ch) {
		return this.is_punctuation(ch) && ch === '[';
	}
}

/**
 * @param {Stream} stream
 */
function skip_comment(stream) {
	new Reader(stream)
		.while(ch => ch !== '\n' && ch !== '\r');
	stream.input.next();
}

class Reader extends Parent {
	while(predicate) {
		let str = '';

		while (
			!this.stream.input.eof() &&
			predicate(this.stream.input.peek())
		) {
			str += this.stream.input.next();
		}

		return str;
	}

	get number() {
		let hasDot = false;

		const number = this.while(ch => {
			if (ch === '.') {
				return hasDot ? false : (() => {
					hasDot = true;
					return true
				})();
			}
			return new Tester(this.stream).is_digit(ch);
		});

		return generateNumber(number);
	}

	get array() {
		const value = [];
		this.while(ch => {
			if (ch !== '[' && ch !== ']' && ch !== ' '  && ch !== "," && ch !== ';') {
				if (new Tester(this.stream).is_quote(ch)) {
					value.push(this.string(ch))
				} else if (!Number.isNaN(Number(ch))) {
					value.push(this.number);
				}
				const v = this.ident;
				if (v.value !== '') {
					value.push(v);
				}
			}
			return true;
		});

		return { type: 'array', value };
	}

	get ident() {
		const tester = new Tester(this.stream);

		const value = this.while((...a) =>
			tester.is_id(...a));

		return getDynamicType(
			(tester
				.is_keyword(value)
					? 'keyword' : 'var'),
			value
		);
	}

	escaped(end) {
		let escaped = false;
		let str = '';

		this.stream.input.next();

		while (!this.stream.input.eof()) {
			const ch = this.stream.input.next();

			if (escaped) {
				str += ch;
				escaped = false;
			}
			else if (ch === '\\') escaped = true;
			else if (ch === end) break;
			else str += ch;
		}

		return str;
	}

	string(separator) {
		return generateString(separator, this);
	}

	next(nbTry = 1) {
		const tester = new Tester(this.stream);

		this.while((...a) =>
			tester.is_whitespace(...a));

		if (this.stream.input.eof()) {
			this.stream.input.next();

			if (nbTry > 3) return null;
			return this.next(nbTry + 1);
		}

		const ch = this.stream.input.peek();

		if (ch === '#') {
			skip_comment(this.stream);
			return this.next();
		}

		if (tester.is_quote(ch)) {
			return this.string(ch);
		}
		if (tester.is_digit(ch)) {
			return this.number;
		}
		if (tester.is_open_hook(ch)) {
			return this.array;
		}
		if (tester.is_id_start(ch)) {
			return this.ident;
		}
		if (tester.is_punctuation(ch)) {
			const next = this.stream.input.next();
			return generatePunc(next);
		}
		if (tester.is_op_char(ch)) {
			return generateOperation(
				this.while((...a) => {
					return tester.is_op_char(...a);
				})
			);
		}

		this.stream.input
			.croak(`Can't handle character: ${ch}`);
	}
}

export class TokenStream extends Stream {
	current = null;

	peek() {
		return this.current || (this.current = new Reader(this).next());
	}

	eof() {
		return this.peek() === null;
	}

	next() {
		const tok = this.current;
		this.current = null;
		return tok || new Reader(this).next();
	}

	croak(msg) {
		this.input.croak(msg);
	}
}
