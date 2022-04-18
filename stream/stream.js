export class Stream {
	/**
	 * @param {Stream|string} input
	 */
	constructor(input) {
		if (typeof input === "string") {
			input = input.trim()
				.replace(/\r\n/g, '\n')
				.replace(/\r/g, '\n');
		}
		this.input = input;
	}

	next() {}

	peek() {}

	eof() {}

	croak() {}
}
