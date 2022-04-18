import { generateKeyword } from './keyword.js';
import { generateVar } from './var.js';
import { generateNumber } from './number.js';
import { generateFalse } from './false.js';
import { generateString } from './string.js';
import { generatePunc } from './punctuation.js';
import { generateOperation } from './operation.js';
import { generateAssign } from './assign.js';
import { generateBinary } from "./binary.js";
import { generateFunc } from "./function.js";
import { generateIf } from "./if.js";
import { generateLambda } from "./lambda.js";
import { generateBool } from "./bool.js";
import { generateProg } from "./prog.js";
import { generateCall } from "./call.js";
import { generateLet } from "./let.js";

const types = {
	generateFalse,
	generateLambda,
	generateProg,
	generateCall,
	generateBool,
	generateLet,
	generateIf,
	generateBinary,
	generateFunc,
	generateKeyword,
	generateAssign,
	generateVar,
	generateNumber,
	generateString,
	generatePunc,
	generateOperation
};

export const generateMethodName = type =>
	`generate${type[0].toUpperCase()}${type.substring(1, type.length)}`;

export const getDynamicType = (type, ...args) => {
	if (Object.keys(types).indexOf(generateMethodName(type)) !== -1) {
		return types[generateMethodName(type)](...args);
	} else {
		throw new Error(`Unknown ${type} type !`);
	}
}

export * from './false.js';
export * from './number.js';
export * from './keyword.js';
export * from './var.js';
export * from './string.js';
export * from './punctuation.js';
export * from './operation.js';
export * from './assign.js';
export * from './binary.js';
export * from './function.js';
export * from './if.js';
export * from './lambda.js';
export * from './bool.js';
export * from './prog.js';
export * from './call.js';
export * from './let.js';

export const Type = {
	type: '',
	operator: '',
	left: {},
	right: {},
	value: '',
	func: {},
	args: [],
	cond: {},
	else: {},
	vars: [],
	body: '',
	prog: null
};
