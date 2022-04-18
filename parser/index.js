export *  from "./maybe.js";
export * from "./skipper.js";
export * from "./tester.js";
export * from './parser.js';

export const PRECEDENCE = {
	"=": 1,
	"||": 2,
	"&&": 3,
	"<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7, '!==': 7, '===': 7,
	"+": 10, "-": 10,
	"*": 20, "/": 20, "%": 20,
};
