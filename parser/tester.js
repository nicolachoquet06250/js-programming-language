export class Tester {
	/**
	 * @param {Parser} parser
	 * @param {any|undefined} input
	 */
	constructor(parser, input = undefined) {
		this.stream = parser.stream;
		this.input = input;
	}

	keyword(kw) {
		const tok = this.input ?? this.stream.peek();
		return tok && (!kw || kw === tok.value) && tok;
	}

	operator(op) {
		const tok = this.input ?? this.stream.peek();
		return tok && (!op || op === tok.value) && tok;
	}

	punctuation(ch) {
		const tok = this.input ?? this.stream.peek();
		return tok && (!ch || ch === tok.value) && tok;
	}

	bool() {
		return this.keyword('true') || this.keyword('false');
	}

	space(ch) {

	}
}
