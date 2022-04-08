import util from 'util';

/**
 * @param {string} input
 * @return {{ next: (function(): string), peek: (function(): string), eof: (function(): boolean), croak: (function(msg: string): void) }}
 */
export const InputStream = input => {
    let pos = 0;
    let line = 1;
    let col = 0;

    /**
     * returns the next value and also discards it from the stream.
     * @returns {string}
     */
    const next = () => {
        const ch = input.charAt(pos++);

        if (ch === "\n") {
            line++;
            col = 0;
        } else col++;

        return ch;
    };

    /**
     * returns the next value but without removing it from the stream.
     * @returns {string}
     */
    const peek = () => input.charAt(pos);

    /**
     * returns true if and only if there are no more values in the stream.
     * @returns {boolean}
     */
    const eof = () => peek() === "";

    /**
     * does throw new Error(msg).
     * @param {string} msg
     * @throws Error
     * @return void
     */
    const croak = msg => {
        throw new Error(msg + " (" + line + ":" + col + ")");
    };

    return { next, peek, eof, croak };
};

/**
 * @param {typeof ReturnType<InputStream>} input
 * @return {{ next: (function(): string), peek: (function(): string), eof: (function(): boolean), croak: (function(msg: string): void) }}
 */
export const TokenStream = input => {
    let current = null;
    const keywords = " if then else lambda λ true false ";

    const peek = ()  => current || (current = read_next());
    const eof = () => peek() == null;
    const next = () => {
        const tok = current;
        current = null;
        return tok || read_next();
    };

    const is_keyword = x => keywords.indexOf(` ${x} `) >= 0;
    const is_digit = ch => /[0-9]/i.test(ch);
    const is_id_start = ch => /[a-zλ_]/i.test(ch);
    const is_id = ch => is_id_start(ch) || "?!-<>=0123456789".indexOf(ch) >= 0;
    const is_op_char = ch => "+-*/%=&|<>!".indexOf(ch) >= 0;
    const is_punc = ch => ",;(){}[]".indexOf(ch) >= 0;
    const is_whitespace = ch => " \t\n".indexOf(ch) >= 0;
    const read_while = predicate => {
        let str = '';

        while (!input.eof() && predicate(input.peek()))
            str += input.next();

        return str;
    };
    const read_number = () => {
        let has_dot = false;

        const number = read_while(function(ch){
            if (ch === '.') {
                if (has_dot) return false;
                has_dot = true;
                return true;
            }
            return is_digit(ch);
        });

        return { type: "num", value: parseFloat(number) };
    };
    const read_ident = () => {
        const id = read_while(is_id);

        return {
            type  : is_keyword(id) ? 'kw' : 'var',
            value : id
        };
    };
    const read_escaped = end => {
        let escaped = false;
        let str = "";

        input.next();

        while (!input.eof()) {
            const ch = input.next();

            if (escaped) {
                str += ch;
                escaped = false;
            }
            else if (ch === "\\") escaped = true;
            else if (ch === end) break;
            else str += ch;
        }
        return str;
    };
    const read_string = () =>  ({ type: "str", value: read_escaped('"') });
    const skip_comment = () => {
        read_while(ch => ch !== '\n');
        input.next();
    };
    const read_next = () => {
        read_while(is_whitespace);

        if (input.eof()) return null;

        const ch = input.peek();

        if (ch === "#") {
            skip_comment();
            return read_next();
        }

        if (ch === '"') return read_string();

        if (is_digit(ch)) return read_number();

        if (is_id_start(ch)) return read_ident();

        if (is_punc(ch)) return {
            type  : "punc",
            value : input.next()
        };

        if (is_op_char(ch)) return {
            type  : "op",
            value : read_while(is_op_char)
        };

        input.croak(`Can't handle character: ${ch}`);
    };

    const { croak } = input;

    return { next, peek, eof, croak };
};

export const FALSE = { type: "bool", value: false };

export const parse = input => {
    const PRECEDENCE = {
        "=": 1,
        "||": 2,
        "&&": 3,
        "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
        "+": 10, "-": 10,
        "*": 20, "/": 20, "%": 20,
    };

    const is_punc = ch => {
        const tok = input.peek();

        return tok && tok.type === "punc" && (!ch || tok.value === ch) && tok;
    };
    const is_kw = kw => {
        const tok = input.peek();
        return tok && tok.type == "kw" && (!kw || tok.value == kw) && tok;
    };
    const is_op = op => {
        const tok = input.peek();
        return tok && tok.type == "op" && (!op || tok.value == op) && tok;
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
        vars: delimited("(", ")", ",", parse_varname),
        body: parse_expression()
    });
    const parse_bool = () => ({
        type  : "bool",
        value : input.next().value == "true"
    });
    const maybe_call = expr => {
        expr = expr();
        return is_punc("(") ? parse_call(expr) : expr;
    };
    const parse_atom = () => maybe_call(function(){
        if (is_punc("(")) {
            input.next();
            const exp = parse_expression();
            skip_punc(")");
            return exp;
        }

        if (is_punc("{")) return parse_prog();

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

    return parse_toplevel();
};

export class Environment {
    constructor(parent) {
        this.parent = parent;
        this.vars = Object.create(parent ? parent.vars : null);
    }

    extend() {
        return new Environment(this);
    }

    lookup(name) {
        let scope = this;

        while (scope) {
            if (Object.prototype.hasOwnProperty.call(scope.vars, name)) return scope;
            scope = scope.parent;
        }
    }

    get(name) {
        if (name in this.vars) return this.vars[name];
        throw new Error(`Undefined variable ${name}`);
    }

    set(name, value) {
        const scope = this.lookup(name);

        if (!scope && this.parent) {
            throw new Error(`Undefined variable ${name}`);
        }

        return (scope || this).vars[name] = value;
    }

    def(name, value) {
        return this.vars[name] = value;
    }
}

const evaluate = (exp, env) => {
    switch (exp.type) {
        case "num":
        case "str":
        case "bool": return exp.value;
        case "var": return env.get(exp.value);
        case "assign":
            if (exp.left.type !== "var")
                throw new Error("Cannot assign to " + JSON.stringify(exp.left));
            return env.set(exp.left.value, evaluate(exp.right, env));
        case "binary":
            return apply_op(
                exp.operator,
                evaluate(exp.left, env),
                evaluate(exp.right, env)
            );
        case "lambda": return make_lambda(env, exp);
        case "if":
            const cond = evaluate(exp.cond, env);

            if (cond !== false)
                return evaluate(exp.then, env);
            return exp.else ? evaluate(exp.else, env) : false;
        case "prog":
            let val = false;
            exp.prog.forEach(exp => val = evaluate(exp, env));

            return val;
        case "call": return evaluate(exp.func, env).apply(null, exp.args.map(arg => evaluate(arg, env)));
        default: throw new Error(`I don't know how to evaluate ${exp.type}`);
    }
};

const apply_op = (op, a, b) => {
    const num = x => {
        if (typeof x != "number") throw new Error(`Expected number but got ${x}`);
        return x;
    };
    const div = x => {
        if (num(x) === 0) throw new Error("Divide by zero");
        return x;
    };

    switch (op) {
        case "+": return num(a) + num(b);
        case "-": return num(a) - num(b);
        case "*": return num(a) * num(b);
        case "/": return num(a) / div(b);
        case "%": return num(a) % div(b);
        case "&&": return a !== false && b;
        case "||": return a !== false ? a : b;
        case "<": return num(a) < num(b);
        case ">": return num(a) > num(b);
        case "<=": return num(a) <= num(b);
        case ">=": return num(a) >= num(b);
        case "==": return a === b;
        case "!=": return a !== b;
        default: throw new Error("Can't apply operator " + op);
    }
};

const make_lambda = (env, exp) => () => {
    const names = exp.vars;
    const scope = env.extend();

    for (let i = 0; i < names.length; ++i)
        scope.def(names[i], i < arguments.length ? arguments[i] : false);
    return evaluate(exp.body, scope);
};

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
    globalEnv.def("println", val => util.puts(val));
    globalEnv.def("print", val => util.print(val));
    let code = '';

    process.stdin.setEncoding("utf8");
    process.stdin.on("readable", () => {
        const chunk = process.stdin.read();

        if (chunk) code += chunk;
    });
    process.stdin.on("end", () => {
        const ast = parse(TokenStream(InputStream(code)));

        evaluate(ast, globalEnv);
    });
})();