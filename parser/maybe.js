import { Tester } from "./tester.js";
import { PRECEDENCE } from "./index.js";

export const maybe_call = (expr, parser) => {
	expr = expr();
	return new Tester(parser).punctuation("(") ? parser.call(expr) : expr;
};

export const maybe_binary = (left, my_prec, parser) => {
	const tok = new Tester(parser).operator();

	if (tok) {
		const his_prec = PRECEDENCE[tok.value];

		if (his_prec > my_prec) {
			parser.stream.next();
			return maybe_binary({
				type     : tok.value === "=" ? "assign" : "binary",
				operator : tok.value,
				left     : left,
				right    : maybe_binary(parser.atom(), his_prec, parser)
			}, my_prec, parser);
		}
	}
	return left;
}
