import idl from "@webref/idl";

const treatAsInterface = [
	"interface",
	"namespace",
	"callback interface",
	"dictionary",
];

const files = await idl.listAll();
const asts = await getAsts(files);

async function getAsts(files) {
	let result = [];
	for (const file of Object.values(files)) {
		const ast = await file.parse();
		result = result.concat(ast);
	}
	return result;
}

const interfaces = asts.filter((ast) => {
	return ast.type === "interface";
});

const mixins = asts.filter((ast) => {
	return ast.type === "interface mixin";
});

// We're going to defer processing partial
// interfaces until last, because we need
// the main interface to decide what to do.
//
// So when we encounter them we will just
// keep them here for now.
const partialInterfaces = [];

// Check for SecureContext in an item's extAttrs
function checkSecureContext(extAttrs) {
	return (
		extAttrs.find((extAttr) => {
			return extAttr.name === "SecureContext";
		}) !== undefined
	);
}

function checkMembers(item, features) {
	for (const member of item.members) {
		// patch constructor name to match MDN names
		if (member.type === "constructor") {
			member.name = item.name;
		}
		// patch static attributes to match MDN names
		let memberName = member.name;
		if (member.special === "static") {
			memberName = `${memberName}_static`;
		}
		if (checkSecureContext(member.extAttrs)) {
			features.secure.push(`${item.name}.${memberName}`);
		} else {
			features.notSecure.push(`${item.name}.${memberName}`);
		}
	}
}

function setAllMembersSecure(item, features) {
	for (const member of item.members) {
		// patch constructor name to match MDN names
		if (member.type === "constructor") {
			member.name = item.name;
		}
		// patch static attributes to match MDN names
		let memberName = member.name;
		if (member.special === "static") {
			memberName = `${memberName}_static`;
		}
		features.secure.push(`${item.name}.${memberName}`);
	}
}

// Include statements map a mixin to an interface it is mixed into.
//
// Because MDN doesn't represent mixins any more, we do this mapping here
// and list secure features as belonging to the concrete interface,
// not the mixin.
function checkIncludes(includes, features) {
	const mixin = mixins.find((item) => item.name === includes.includes);
	const target = interfaces.find((item) => item.name === includes.target);

	// Note we use target for the interface name, not the mixin
	const item = {
		name: target.name,
		members: mixin.members,
		extAttrs: mixin.extAttrs,
	};
	// If a mixin requires secure context, all its members do
	if (checkSecureContext(item.extAttrs)) {
		setAllMembersSecure(item, features);
	} else {
		// Otherwise, test every member
		checkMembers(item, features);
	}
}

function checkInterface(item, features) {
	// We will process partial interfaces later, because we
	// need the main interface for this.
	if (item.partial) {
		partialInterfaces.push(item);
		return;
	}
	if (checkSecureContext(item.extAttrs)) {
		features.secure.push(item.name);
		// If an interface requires secure context, all its members do
		setAllMembersSecure(item, features);
	} else {
		// Otherwise the interface itself is non-secure
		features.notSecure.push(item.name);
		// But we need to test every member individually
		checkMembers(item, features);
	}
}

function checkPartials(features) {
	for (const item of partialInterfaces) {
		if (
			checkSecureContext(item.extAttrs) ||
			features.secure.includes(item.name)
		) {
			// If this partial is marked secure
			// or this partial's main interface is marked secure,
			// then all this partial's members are secure
			setAllMembersSecure(item, features);
		} else {
			// Otherwise, test every member
			checkMembers(item, features);
		}
	}
}

// Iterate through every item in every specification,
// trying to decide if it requires secure context or not.
export async function queryWebref() {
	const features = {
		secure: [],
		notSecure: [],
	};
	for (const [shortname, file] of Object.entries(files)) {
		const ast = await file.parse();
		for (const item of ast) {
			if (item.type === "includes") {
				checkIncludes(item, features);
			} else if (treatAsInterface.includes(item.type)) {
				checkInterface(item, features);
			} else if (item.type === "interface-mixin") {
				// we deal with mixins under "includes"
				continue;
			} else {
				// this includes typedefs, callbacks, enums, which AFAICT
				// never have SecureContext set or MDN pages
				continue;
			}
		}
	}
	// Finally, process any partial interfaces we encountered.
	checkPartials(features);
	return features;
}

/*
have members
- interface
- interface mixin (fold)
- namespace (treat as interface)
- callback interface: EventListener, NodeFilter, XPathNSResolver (treat as interface)
- dictionary (treat as interface)

don't have members
- callback
- enum
- typedef
- includes
- operation
- constructor
- attribute
- const
- arguments
- extattrs
*/
