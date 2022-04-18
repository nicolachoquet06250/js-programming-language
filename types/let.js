export const generateLet = (vars, parser) => ({
	type: 'let',
	vars,
	body: parser.expression()
});
