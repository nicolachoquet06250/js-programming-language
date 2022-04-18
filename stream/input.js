import { Stream } from "./stream.js";
import { DEBUG, keywords, operators, spaces, symbols } from "../constants.js";

export class InputStream extends Stream {
	line = 0;
	pos = 0;

	constructor(input) {
		super(input);

		this.parsedCode = this.generateAnalysedTable(keywords, symbols, operators, spaces);

		if (DEBUG) {
			console.log('|- Program ----------------------------------------------------------------------------|');
			console.log(this.input.split('\n')
					.map((l, i) =>
						`${i + 1}. ${l}`).join('\n'),
				'\n'
			);
			console.log('|- Parsing ----------------------------------------------------------------------------|');
			console.log(this.parsedCode);
		}
	}

	generateAnalysedTable(keywords, symbols, operators, spaces) {
		const analysedCode = [];

		for (const line of this.input.split('\n')) {
			const analysedCodeLine = [];

			let id = 0;
			for (const word of line.split(' ')) {
				if (operators.indexOf(word) !== -1) {
					analysedCodeLine.push(word);
				} else if (keywords.indexOf(word) === -1) {
					const wordArray = word.split('');
					let tmpWord = '';

					for (const ch of wordArray) {
						if (
							symbols.indexOf(ch) !== -1 ||
							spaces.indexOf(ch) !== -1
						) {
							if (tmpWord) {
								analysedCodeLine.push(tmpWord);
							}
							analysedCodeLine.push(ch);
							tmpWord = '';
							continue;
						}

						if (
							symbols.indexOf(tmpWord + ch) !== -1 ||
							keywords.indexOf(tmpWord + ch) !== -1
						) {
							analysedCodeLine.push(tmpWord + ch);
							tmpWord = '';
							continue;
						}

						if (/[0-9.]/i.test(ch)) {
							if (/[0-9.]/i.test(analysedCodeLine[analysedCodeLine.length - 1])) {
								analysedCodeLine[analysedCodeLine.length - 1] += ch;
							} else {
								analysedCodeLine.push(ch);
							}
							tmpWord = '';
							continue;
						}

						tmpWord += ch;

						if (analysedCodeLine.length > 0) {
							if (
								keywords.indexOf(analysedCodeLine[analysedCodeLine.length - 1]) === -1 &&
								spaces.indexOf(analysedCodeLine[analysedCodeLine.length - 1]) === -1 &&
								symbols.indexOf(analysedCodeLine[analysedCodeLine.length - 1]) === -1
							) {
								analysedCodeLine[analysedCodeLine.length - 1] += ch;
							} else {
								analysedCodeLine[analysedCodeLine.length] = ch;
							}
							tmpWord = '';
						} else {
							analysedCodeLine[0] = ch;
							tmpWord = '';
						}
					}
				} else {
					analysedCodeLine.push(word);
				}

				if (id < line.split(' ').length - 1) {
					analysedCodeLine.push(' ');
				}

				id++;
			}

			analysedCode.push(analysedCodeLine);
		}

		return analysedCode;
	}

	calculatePosition(line, id) {
		return {
			line,
			column:  this.parsedCode[line - 1].reduce((r, c, i) => {
				if (i <= id) {
					r.part.push(c);
				} else if (i === id + 1) {
					r.part.map((w, index) => {
						if (w === '\t') {
							r.col++;
						} else if (index < r.part.length - 2) {
							r.part[index]
								.replace('\t', '-')
								.replace('\n', '-')
								.replace('\r', '-')
								.split('')
								.map(() => r.col++);
						}
					});
				}
				return r;
			}, { col: 1, part: [] }).col
		};
	}

	next() {
		let ch = this.parsedCode[this.line]?.[this.pos++];

		if (!ch) {
			this.pos = 0;
			ch = this.parsedCode[this.line++]?.[this.pos];
		}

		return ch;
	}

	peek() {
		return this.parsedCode[this.line]?.[this.pos] ?? '';
	}

	eof() {
		return this.peek() === '';
	}

	croak(msg) {
		const { line, column } = this.calculatePosition(this.line + 1, this.pos);
		throw new Error(`${msg} (${line}:${column})`);
	}
}
