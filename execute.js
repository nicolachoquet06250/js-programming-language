import { globalEnv } from "./environment.js";
import { InputStream, TokenStream } from "./stream/index.js";
import { Parser } from "./parser/index.js";
import { evaluate } from "./evaluation.js";
import { is_cli } from "./helpers.js";
import { DEBUG, DEBUG_TIME } from "./constants.js";

/**
 * @param {string} code
 */
export const weblang = code => {
	if (is_cli()) process.stdin.setEncoding("utf8");

	const start = DEBUG_TIME ? Date.now() : 0;

	try {
		const input = new InputStream(code);
		const token = new TokenStream(input);
		const ast = new Parser(token).ast;

		if (DEBUG) {
			console.log('|- Parsed Program ---------------------------------------------------------------------|');
			console.log(ast);
		}

		const r = evaluate(ast, globalEnv);

		if (DEBUG && r) {
			console.log('|- Final step -------------------------------------------------------------------------|');
			console.log(r);
		}
	} catch (e) {
		console.error(`\x1b[31mError: ${e.message}\x1b[0m`);
	}

	if (DEBUG_TIME) {
		const stop = Date.now();

		console.log();
		console.log('|--------------------------------------------------------------------------------------|');
		console.log('|- Program time -----------------------------------------------------------------------|');
		console.log('|- Time: ', (stop - start) + 'ms', '------------------------------------------------------------------------|');
		console.log('|--------------------------------------------------------------------------------------|');
	}
};
