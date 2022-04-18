import fs from 'fs';
import { weblang } from "./execute.js";

const fileContent = fs.readFileSync(process.cwd() + '/test.wl').toString();

weblang(fileContent);
