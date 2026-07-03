import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
const { version } = pkg;
const repo = "Tomperez98/tomperez98.github.io";

const url = new URL(`https://github.com/${repo}/releases/new`);
url.searchParams.set("title", `v${version}`);
url.searchParams.set("tag", `v${version}`);

console.log(`Release v${version}:`);
console.log(url.toString());
