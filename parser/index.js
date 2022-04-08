import { FALSE } from "../index.js";

const PRECEDENCE = {
	"=": 1,
	"||": 2,
	"&&": 3,
	"<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
	"+": 10, "-": 10,
	"*": 20, "/": 20, "%": 20,
};

export const parse = input => {
	const is_punc = ch => {
		const tok = input.peek();

		return tok && tok.type === "punc" && (!ch || tok.value === ch) && tok;
	};
	const is_kw = kw => {
		const tok = input.peek();
		return tok && tok.type === "kw" && (!kw || tok.value === kw) && tok;
	};
	const is_op = op => {
		const tok = input.peek();
		return tok && tok.type === "op" && (!op || tok.value === op) && tok;
	};
	const skip_punc = ch => {
		if (is_punc(ch)) input.next();
		else input.croak(`Expecting punctuation: "${ch}"`);
	};
	const skip_kw = kw => {
		if (is_kw(kw)) input.next();
		else input.croak(`Expecting keyword: "${kw}"`);
	};
	const skip_op = op => {
		if (is_op(op)) input.next();
		else input.croak(`Expecting operator: "${op}"`);
	};
	const unexpected = () => {
		input.croak(`Unexpected token: ${JSON.stringify(input.peek())}`);
	};
	const maybe_binary = (left, my_prec) => {
		const tok = is_op();

		if (tok) {
			const his_prec = PRECEDENCE[tok.value];

			if (his_prec > my_prec) {
				input.next();

				return maybe_binary({
					type     : tok.value === "=" ? "assign" : "binary",
					operator : tok.value,
					left     : left,
					right    : maybe_binary(parse_atom(), his_prec)
				}, my_prec);
			}
		}

		return left;
	};
	const delimited = (start, stop, separator, parser) => {
		const a = [];
		let first = true;
		skip_punc(start);

		while (!input.eof()) {
			if (is_punc(stop)) break;

			if (first) first = false;
			else skip_punc(separator);

			if (is_punc(stop)) break;

			a.push(parser());
		}

		skip_punc(stop);
		return a;
	};
	const parse_call = func => ({
		type: "call",
		func: func,
		args: delimited("(", ")", ",", parse_expression),
	});
	const parse_varname = () => {
		const name = input.next();

		if (name.type !== "var") input.croak("Expecting variable name");

		return name.value;
	};
	const parse_if = () => {
		skip_kw("if");

		const cond = parse_expression();

		if (!is_punc("{")) skip_kw("then");

		const then = parse_expression();

		const ret = {
			type: "if",
			cond: cond,
			then: then,
		};

		if (is_kw("else")) {
			input.next();
			ret.else = parse_expression();
		}

		return ret;
	};
	const parse_lambda = () => ({
		type: "lambda",
		name: input.peek().type === 'var' ? input.next().value : null,
		vars: delimited("(", ")", ",", parse_varname),
		body: parse_expression()
	});
	const parse_bool = () => ({
		type  : "bool",
		value : input.next().value === "true"
	});
	const maybe_call = expr => {
		expr = expr();
		return is_punc("(") ? parse_call(expr) : expr;
	};
	const parse_atom = () => maybe_call(() => {
		if (is_punc("(")) {
			input.next();
			const exp = parse_expression();
			skip_punc(")");
			return exp;
		}

		if (is_punc("{")) return parse_prog();

		if (is_kw("let")) return parse_let();

		if (is_kw("if")) return parse_if();

		if (is_kw("true") || is_kw("false")) return parse_bool();

		if (is_kw("lambda") || is_kw("λ")) {
			input.next();
			return parse_lambda();
		}

		const tok = input.next();

		if (tok.type === "var" || tok.type === "num" || tok.type === "str") return tok;

		unexpected();
	});
	const parse_toplevel = () => {
		const prog = [];
		while (!input.eof()) {
			prog.push(parse_expression());
			if (!input.eof()) skip_punc(";");
		}
		return { type: "prog", prog: prog };
	};
	const parse_prog = () => {
		const prog = delimited("{", "}", ";", parse_expression);

		if (prog.length === 0) return FALSE;
		if (prog.length === 1) return prog[0];

		return { type: "prog", prog: prog };
	};
	const parse_expression = () => maybe_call(() => maybe_binary(parse_atom(), 0));
	const parse_vardef = () => {
		const name = parse_varname();
		let def;

		if (is_op('=')) {
			input.next();
			def = parse_expression();
		}

		return { name, def };
	};
	const parse_let = () => {
		skip_kw('let');

		if (input.peek().type === 'var') {
			const name = input.next().value;
			const defs = delimited('(', ')', ',', parse_vardef);

			return {
				type: 'call',
				func: {
					type: 'lambda',
					name,
					vars: defs.map(def => def.name),
					body: parse_expression()
				},
				args: defs.map(def => (def.def || FALSE))
			};
		}

		return {
			type: 'let',
			vars: delimited('(', ')', ',', parse_vardef),
			body: parse_expression()
		};
	};

	return parse_toplevel();
}
