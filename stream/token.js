
/**
 * @param {typeof ReturnType<InputStream>} input
 * @return {{ next: (function(): string), peek: (function(): string), eof: (function(): boolean), croak: (function(msg: string): void) }}
 */
export const TokenStream = input => {
	let current = null;
	const keywords = " if then else lambda λ true false ";

	const peek = ()  => current || (current = read_next());
	const eof = () => peek() == null;
	const next = () => {
		const tok = current;
		current = null;
		return tok || read_next();
	};

	const is_keyword = x => keywords.indexOf(` ${x} `) >= 0;
	const is_digit = ch => /[0-9]/i.test(ch);
	const is_id_start = ch => /[a-zλ_]/i.test(ch);
	const is_id = ch => is_id_start(ch) || "?!-<>=0123456789".indexOf(ch) >= 0;
	const is_op_char = ch => "+-*/%=&|<>!".indexOf(ch) >= 0;
	const is_punc = ch => ",;(){}[]".indexOf(ch) >= 0;
	const is_whitespace = ch => " \t\n\r".indexOf(ch) >= 0;
	const read_while = predicate => {
		let str = '';

		while (!input.eof() && predicate(input.peek()))
			str += input.next();

		return str;
	};
	const read_number = () => {
		let has_dot = false;

		const number = read_while(function(ch){
			if (ch === '.') {
				if (has_dot) return false;
				has_dot = true;
				return true;
			}
			return is_digit(ch);
		});

		return { type: "num", value: parseFloat(number) };
	};
	const read_ident = () => {
		const id = read_while(is_id);

		return {
			type  : is_keyword(id) ? 'kw' : 'var',
			value : id
		};
	};
	const read_escaped = end => {
		let escaped = false;
		let str = "";

		input.next();

		while (!input.eof()) {
			const ch = input.next();

			if (escaped) {
				str += ch;
				escaped = false;
			}
			else if (ch === "\\") escaped = true;
			else if (ch === end) break;
			else str += ch;
		}
		return str;
	};
	const read_string = () =>  ({ type: "str", value: read_escaped('"') });
	const skip_comment = () => {
		read_while(ch => ch !== '\n' && ch !== '\r' && ch !== '\n\r' && ch !== '\r\n');
		input.next();
	};
	const read_next = () => {
		read_while(is_whitespace);

		if (input.eof()) return null;

		const ch = input.peek();

		if (ch === "#") {
			skip_comment();
			return read_next();
		}

		if (ch === '"') return read_string();

		if (is_digit(ch)) return read_number();

		if (is_id_start(ch)) return read_ident();

		if (is_punc(ch)) return {
			type  : "punc",
			value : input.next()
		};

		if (is_op_char(ch)) return {
			type  : "op",
			value : read_while(is_op_char)
		};

		input.croak(`Can't handle character: ${ch}`);
	};

	const { croak } = input;

	return { next, peek, eof, croak };
};
