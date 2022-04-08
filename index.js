import { InputStream, TokenStream } from "./stream/index.js";
import { parse } from "./parser/index.js";
import { Environment } from "./environement/index.js";
import { evaluate } from "./evaluation/index.js";
import * as fs from "fs";

export const FALSE = { type: "bool", value: false };

/* -----[ entry point for NodeJS ]----- */

const globalEnv = new Environment();

globalEnv.def("time", func => {
    try {
        console.time("time");

        return func();
    } finally {
        console.timeEnd("time");
    }
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
