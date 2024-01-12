import idl from "@webref/idl";

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

const baseDefinitions = {
	interface: [],
	"interface mixin": [],
	namespace: [],
	dictionary: [],
	"callback interface": [],
};

baseDefinitions["interface"] = asts.filter((ast) => {
	return ast.type === "interface" && !ast.partial;
});

baseDefinitions["interface mixin"] = asts.filter((ast) => {
	return ast.type === "interface mixin" && !ast.partial;
});

baseDefinitions["namespace"] = asts.filter((ast) => {
	return ast.type === "namespace" && !ast.partial;
});

baseDefinitions["dictionary"] = asts.filter((ast) => {
	return ast.type === "dictionary" && !ast.partial;
});

baseDefinitions["callback interface"] = asts.filter((ast) => {
	return ast.type === "callback interface" && !ast.partial;
});

// all mixins including partials
const allMixins = asts.filter((ast) => {
	return ast.type === "interface mixin";
});

// Check for SecureContext in an item's extAttrs
function checkSecureContext(extAttrs) {
	return (
		extAttrs.find((extAttr) => {
			return extAttr.name === "SecureContext";
		}) !== undefined
	);
}

// Make member representation match MDN's
function normalizeMemberNameForMDN(parent, member) {
	// patch constructor name to match MDN names
	if (member.type === "constructor") {
		return parent.name;
	}
	// patch static attributes to match MDN names
	else if (member.special === "static") {
		return `${member.name}_static`;
	} else if (parent.type === "namespace") {
		return `${member.name}_static`;
	}
	// patch events to match MDN names
	else if (
		member.type === "attribute" &&
		member.idlType.idlType === "EventHandler"
	) {
		return `${member.name.substring(2)}_event`;
	}
	// nothing to change
	else {
		return member.name;
	}
}

function checkMembers(item, features) {
	for (const member of item.members) {
		const memberName = normalizeMemberNameForMDN(item, member);
		if (checkSecureContext(member.extAttrs)) {
			features.secure.push(`${item.name}.${memberName}`);
		} else {
			features.notSecure.push(`${item.name}.${memberName}`);
		}
	}
}

function setAllMembersSecure(item, features) {
	for (const member of item.members) {
		const memberName = normalizeMemberNameForMDN(item, member);
		features.secure.push(`${item.name}.${memberName}`);
	}
}

// Include statements map a mixin to an interface it is mixed into.
//
// Because MDN doesn't represent mixins, we do this mapping here
// and list secure features as belonging to the concrete interface,
// not the mixin.
//
// A mixin can be defined as a "base" mixin plus one or more partial
// mixins that extend it.
function checkIncludes(includes, features) {
	// Get all the mixins matching this include. That is, a base and
	// zero or more partials.
	const mixins = allMixins.filter((mixin) => mixin.name === includes.includes);
	const baseMixin = mixins.find((mixin) => !mixin.partial);
	const target = baseDefinitions["interface"].find(
		(i) => i.name === includes.target
	);

	// If the target is secure context or the base mixin is secure context,
	// then all the members of all mixins are also secure context
	if (
		checkSecureContext(baseMixin.extAttrs) ||
		checkSecureContext(target.extAttrs)
	) {
		for (const mixin of mixins) {
			const item = {
				name: target.name,
				members: mixin.members,
			};
			setAllMembersSecure(item, features);
		}
	}
	// Otherwise, check each mixin
	else {
		for (const mixin of mixins) {
			const item = {
				name: target.name,
				members: mixin.members,
				extAttrs: mixin.extAttrs,
			};
			// If this mixin is secure context, then all its members are
			if (checkSecureContext(target.extAttrs)) {
				setAllMembersSecure(item, features);
			}
			// Otherwise, check each member
			else {
				checkMembers(item, features);
			}
		}
	}
}

function checkItem(item, features) {
	if (item.partial) {
		const baseDefinition = baseDefinitions[item.type].find(
			(i) => i.name === item.name
		);
		// If the base definition or this partial require secure context,
		// then all the members do
		if (
			checkSecureContext(baseDefinition.extAttrs) ||
			checkSecureContext(item.extAttrs)
		) {
			setAllMembersSecure(item, features);
		}
		// Otherwise, check each member
		else {
			checkMembers(item, features);
		}
	} else {
		// If an interface requires secure context, all its members do
		if (checkSecureContext(item.extAttrs)) {
			features.secure.push(item.name);
			setAllMembersSecure(item, features);
		}
		// Otherwise the interface itself is non-secure
		else {
			features.notSecure.push(item.name);
			// But we need to test every member individually
			checkMembers(item, features);
		}
	}
}

// Iterate through every relevant item in every specification,
// trying to decide if it requires secure context or not.
export async function queryWebref() {
	const features = {
		secure: [],
		notSecure: [],
	};

	const includes = asts.filter((ast) => {
		return ast.type === "includes";
	});

	for (const include of includes) {
		checkIncludes(include, features);
	}

	const typesToCheck = [
		"interface",
		"namespace",
		"callback interface",
		"dictionary",
	];

	const itemsToCheck = asts.filter((ast) => typesToCheck.includes(ast.type));

	for (const item of itemsToCheck) {
		checkItem(item, features);
	}

	return features;
}

/*
WebIDL types:
-------------

have members, can be partial
- interface
- interface mixin
- namespace
- callback interface: EventListener, NodeFilter, XPathNSResolver
- dictionary

don't have members
- callback
- enum
- typedef
- includes
- operation
- constructors
- attribute
- const
- arguments
- extattrs
*/
