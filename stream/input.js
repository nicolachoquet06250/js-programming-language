/**
 * @param {string} input
 * @return {{ next: (function(): string), peek: (function(): string), eof: (function(): boolean), croak: (function(msg: string): void) }}
 */
export const InputStream = input => {
	let pos = 0;
	let line = 1;
	let col = 0;

	/**
	 * returns the next value and also discards it from the stream.
	 * @returns {string}
	 */
	const next = () => {
		const ch = input.charAt(pos++);

		if (ch === "\n" || ch === "\r" || ch === "\r\n" || ch === "\n\r") {
			line++;
			col = 0;
		} else col++;

		return ch;
	};

	/**
	 * returns the next value but without removing it from the stream.
	 * @returns {string}
	 */
	const peek = () => input.charAt(pos);

	/**
	 * returns true if and only if there are no more values in the stream.
	 * @returns {boolean}
	 */
	const eof = () => peek() === "";

	/**
	 * does throw new Error(msg).
	 * @param {string} msg
	 * @throws Error
	 * @return void
	 */
	const croak = msg => {
		throw new Error(msg + " (" + line + ":" + col + ")");
	};

	return { next, peek, eof, croak };
};
