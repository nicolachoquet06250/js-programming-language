export class Stream {
	/**
	 * @param {Stream|string} input
	 */
	constructor(input) {
		if (typeof input === "string") {
			input = input.trim();
		}
		this.input = input;
	}

	next() {}

	peek() {}

	eof() {}

	croak() {}
}
