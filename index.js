import { InputStream, TokenStream } from "./stream/index.js";
import { parse } from "./parser/index.js";
import { Environment } from "./environement/index.js";
import { evaluate } from "./evaluation/index.js";
import * as fs from "fs";

export const FALSE = { type: "bool", value: false };

/* -----[ entry point for NodeJS ]----- */

const globalEnv = new Environment();

let fibJS;
globalEnv.def("fibJS", (fibJS = n => n < 2 ? n : fibJS(n - 1) + fibJS(n - 2)));

globalEnv.def("time", fn => {
    const t1 = Date.now();
    const ret = fn();
    const t2 = Date.now();
    process.stdout.write(`Time: ${(t2 - t1)}ms`);
    return ret;
});

if (typeof process !== "undefined") (() => {
    globalEnv.def("println", val => console.log(val));
    globalEnv.def("print", val => process.stdout.write(val.toString()));

    let code = fs.readFileSync(process.cwd() + '/test.lang').toString();

    process.stdin.setEncoding("utf8");

    const input = InputStream(code);
    const token = TokenStream(input);
    const ast = parse(token);

    evaluate(ast, globalEnv);
})();
