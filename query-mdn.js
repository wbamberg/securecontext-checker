import fsp from "node:fs/promises";
import os from "node:os";
import readline from "node:readline";
import fs from "node:fs";
import process from "node:process";

import fdir_pkg from "fdir";

import { Macro } from "./macros.js";

const { fdir, PathsOutput } = fdir_pkg;

const macroRegex = /(?<!\\){{.*?}}/g;

async function resolveDirectory(file) {
	const stats = await fsp.lstat(file);
	if (stats.isDirectory()) {
		const api = new fdir()
			.withErrors()
			.withFullPaths()
			.filter((filePath) => filePath.endsWith("index.md"))
			.crawl(file);
		return api.withPromise();
	} else if (stats.isFile() && file.endsWith("index.md")) {
		return [file];
	} else {
		return [];
	}
}

const relevantPageTypes = [
	"web-api-interface",
	"web-api-global-function",
	"web-api-global-property",
	"web-api-constructor",
	"web-api-instance-method",
	"web-api-instance-property",
	"web-api-static-method",
	"web-api-static-property",
	"web-api-event",
	"webgl-extension",
	"webgl-extension-method",
];

async function processFile(readInterface, items) {
	let pageType;
	let slug;

	for await (const line of readInterface) {
		if (!pageType && line.startsWith("page-type:")) {
			pageType = line.split(" ")[1];
			if (!relevantPageTypes.includes(pageType)) {
				return;
			}
		}

		if (!slug && line.startsWith("slug:")) {
			slug = line.split(" ")[1].substring(8).replaceAll("/", ".");
		}
		const matches = line.toLowerCase().matchAll(macroRegex);
		for (const match of matches) {
			const macro = new Macro(match);
			if (macro.name === "securecontext_header") {
				items.secure.push(slug);
				return;
			}
		}
	}
	items.notSecure.push(slug);
}

export async function queryMDN() {
	const root = process.argv[2];
	const items = {
		secure: [],
		notSecure: [],
	};
	const allFiles = await resolveDirectory(root);

	for (const file of allFiles) {
		const readInterface = readline.createInterface({
			input: fs.createReadStream(file),
		});
		await processFile(readInterface, items);
	}
	return items;
}
