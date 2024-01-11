# SecureContext checker

Some web platform features are only usable in a secure context. This is communicated in WebIDL by a `SecureContext`flag, and in MDN pages by the inclusion of a `SecureContext_Header` macro. This program compares the information in each of these two sources, with a view to understanding whether and how we might use the IDL in MDN, via the webref/idl package, instead of the macro.

It consists of three main pieces:

- `query-mdn.js`: this sorts Web/API features into two arrays, `secure` and `notSecure`, based on the presence of the macro in the MDN page source
- `query-webref.js`: this sorts Web/API features into two arrays, `secure` and `notSecure`, based on the presence of the `SecureContext` flag in the IDL.
- `index.js`: this compares the two sets of results for anomalies.

The whole program expects as an argument the path to the Web/API MDN sources (e.g. path/to/content/files/en-us/web/api).

## query-mdn.js

This script finds every index.md files under the given path. It ignores all flies that don't match a given set of page types (for instance, ignoring gudes and overview pages, that have no corresponding IDL).

For the remainder, it looks for the `{{SecureContext_Header}}` macro call. If it finds one, it adds a modified version of the page slug to the `secure` array. Otherwise it adds a modified version of the page slug to the `notSecure` array.

The modification of the page slug is: it strips off "Web/API/" and converts "/" to ".".

## query-webref.js

This script looks through the IDL exposed by webref/idl to determine whether web platform features have the `SecureContext` attribute set.

There are various IDL features that need different handling:

- `interface`: in the most basic form:
  - if an interface is marked `SecureContext`, then it is added to `secure`, and so are all its members.
  - if an interface is not marked `SecureContext`, then it is added to `notSecure`, and we check each of its members to see if they are marked `SecureContext`
- Mixins: some interfaces are "mixins": because MDN doesn't represent mixins, this script folds them into all the interface that they are mixed into (known as the `target` interface). If the target is marked `SecureContext`, then we add entries for all the mixin members to the `secure` array. If the target is not marked `SecureContext`, then we check each mixin member.
- Partials: some interfaces are "partial": this means they extend an interface. We treat these pretty similarly to mixins.

Some other IDL types have members: `dictionary`, `namespace`, `callback-interface`. We treat these just like interfaces (because MDN treats them the same way).

Some other IDL objects that can be found at the top level neither have members nor are members, like `enum` and `typedef`. We just ignore these because they don't have a representation in MDN.

We do some mangling of names to make them match MDN:

- constructor members are given the name of the interface, like `DOMPoint.DOMPoint`
- static members get a `_static` suffix.

## index.js

The main index.js script calls each of the `query-mdn` and `query-webref` scripts to get the two sets of arrays, then compares them:

- items that are marked secure in MDN, but marked not secure in webref
- items that are marked secure in webref, but marked not secure in MDN
- items that are marked secure in MDN, but not listed at all in webref
