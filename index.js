import { queryWebref } from "./query-webref.js";
import { queryMDN } from "./query-mdn.js";

const secureOnlyInWebref = [];
const secureOnlyInMDN = [];
const onlyExistsInMDN = [];

const mdnItems = await queryMDN();
console.log(mdnItems.secure.length);
console.log(mdnItems.notSecure.length);

const webrefItems = await queryWebref();
console.log(webrefItems.secure.length);
console.log(webrefItems.notSecure.length);

console.log("\nSecure in MDN, not in webref:");
for (const mdnSecureItem of mdnItems.secure) {
	if (webrefItems.notSecure.includes(mdnSecureItem)) {
		console.log(mdnSecureItem);
	}
}

console.log("\nSecure in webref, not in MDN:");
for (const webrefSecureItem of webrefItems.secure) {
	if (mdnItems.notSecure.includes(webrefSecureItem)) {
		console.log(webrefSecureItem);
	}
}

console.log("\nSecure in MDN, not present at all in webref:");
const allWebref = webrefItems.secure.concat(webrefItems.notSecure);
for (const mdnSecureItem of mdnItems.secure) {
	if (!allWebref.includes(mdnSecureItem)) {
		console.log(mdnSecureItem);
	}
}
