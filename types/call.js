import { generateLambda } from "./lambda.js";
import { generateFalse } from "./false.js";

export const generateCall = (name, defs, parser) => ({
	type: 'call',
	func: generateLambda(
		name,
		defs.map(d => d.name),
		parser.expression()
	),
	args: defs.map(d => (d.def || generateFalse()))
});
