import { FALSE } from "../index.js";

const PRECEDENCE = {
	"=": 1,
	"||": 2,
	"&&": 3,
	"<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
	"+": 10, "-": 10,
	"*": 20, "/": 20, "%": 20,
};

const is_punc = input => ch => {
	const tok = input.peek();

	return tok && tok.type === "punc" && (!ch || tok.value === ch) && tok;
};
const is_kw = input => kw => {
	const tok = input.peek();
	return tok && tok.type === "kw" && (!kw || tok.value === kw) && tok;
};
const is_op = input => op => {
	const tok = input.peek();
	return tok && tok.type === "op" && (!op || tok.value === op) && tok;
};
const skip_punc = input => ch => {
	if (is_punc(input)(ch)) input.next();
	else input.croak(`Expecting punctuation: "${ch}"`);
};
const skip_kw = input => kw => {
	if (is_kw(input)(kw)) input.next();
	else input.croak(`Expecting keyword: "${kw}"`);
};
const skip_op = input => op => {
	if (is_op(input)(op)) input.next();
	else input.croak(`Expecting operator: "${op}"`);
};
const unexpected = input => () => {
	input.croak(`Unexpected token: ${JSON.stringify(input.peek())}`);
};
const maybe_binary = input => (left, my_prec) => {
	const tok = is_op(input)();

	if (tok) {
		const his_prec = PRECEDENCE[tok.value];

		if (his_prec > my_prec) {
			input.next();

			return maybe_binary(input)({
				type     : tok.value === "=" ? "assign" : "binary",
				operator : tok.value,
				left     : left,
				right    : maybe_binary(input)(parse_atom(input)(), his_prec)
			}, my_prec);
		}
	}

	return left;
};
const delimited = input => (start, stop, separator, parser) => {
	const a = [];
	let first = true;
	skip_punc(input)(start);

	while (!input.eof()) {
		if (is_punc(input)(stop)) break;

		if (first) first = false;
		else skip_punc(input)(separator);

		if (is_punc(input)(stop)) break;

		a.push(parser());
	}

	skip_punc(input)(stop);
	return a;
};
const parse_call = input => func => ({
	type: "call",
	func: func,
	args: delimited(input)("(", ")", ",", parse_expression(input)),
});
const parse_varname = input => () => {
	const name = input.next();

	if (name.type !== "var") input.croak("Expecting variable name");

	return name.value;
};
const parse_if = input => () => {
	skip_kw(input)("if");

	const cond = parse_expression(input)();

	if (!is_punc(input)("{")) skip_kw(input)("then");

	const then = parse_expression(input)();

	const ret = {
		type: "if",
		cond: cond,
		then: then,
	};

	if (is_kw(input)("else")) {
		input.next();
		ret.else = parse_expression(input)();
	}

	return ret;
};
const parse_lambda = input => () => ({
	type: "lambda",
	vars: delimited(input)("(", ")", ",", parse_varname(input)),
	body: parse_expression(input)()
});
const parse_bool = input => () => ({
	type  : "bool",
	value : input.next().value === "true"
});
const maybe_call = input => expr => {
	expr = expr();
	return is_punc(input)("(") ? parse_call(input)(expr) : expr;
};
const parse_atom = input => () => maybe_call(input)(() => {
	if (is_punc(input)("(")) {
		input.next();
		const exp = parse_expression(input)();
		skip_punc(input)(")");
		return exp;
	}

	if (is_punc(input)("{")) return parse_prog(input)();

	if (is_kw(input)("if")) return parse_if(input)();

	if (is_kw(input)("true") || is_kw(input)("false")) return parse_bool(input)();

	if (is_kw(input)("lambda") || is_kw(input)("λ")) {
		input.next();
		return parse_lambda(input)();
	}

	const tok = input.next();

	if (tok.type === "var" || tok.type === "num" || tok.type === "str") return tok;

	unexpected(input)();
});
const parse_toplevel = input => () => {
	const prog = [];
	while (!input.eof()) {
		prog.push(parse_expression(input)());
		if (!input.eof()) skip_punc(input)(";");
	}
	return { type: "prog", prog: prog };
};
const parse_prog = input => () => {
	const prog = delimited(input)("{", "}", ";", parse_expression(input));

	if (prog.length === 0) return FALSE;
	if (prog.length === 1) return prog[0];

	return { type: "prog", prog: prog };
};
const parse_expression = input => () => maybe_call(input)(() => maybe_binary(input)(parse_atom(input)(), 0));

export const parse = input => parse_toplevel(input)();
