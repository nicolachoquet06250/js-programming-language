import { Tester } from "./tester.js";

export class Skipper {
	/**
	 * @param {Parser} parser
	 * @param {any|undefined} input
	 */
	constructor(parser, input = undefined) {
		this.parser = parser;
		this.stream = parser.stream;
		this.input = input;
	}

	keyword(kw) {
		if (new Tester(this.parser, this.input).keyword(kw)) {
			this.stream.next();
		} else {
			this.stream.croak(`Expect keyword "${kw}"`);
		}
	}

	operator(op) {
		if (new Tester(this.parser, this.input).operator(op)) {
			this.stream.next();
		} else {
			this.stream.croak(`Expect operator "${op}"`);
		}
	}

	punctuation(ch) {
		if (new Tester(this.parser, this.input).punctuation(ch)) {
			this.stream.next();
		} else {
			this.stream.croak(`Expect punctuation "${ch}"`);
		}
	}
}
