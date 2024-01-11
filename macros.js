const macroParser =
	/{{(?<macroname>[a-zA-Z\-_0-9\ ]*)(?<macroargs>\(.*?\))? ?}}/;

export class Macro {
	constructor(macroInit) {
		this.input = macroInit.input;
		this.index = macroInit.index;
		const parsed = macroInit[0].match(macroParser);
		this.name = parsed[1].trim();
		this.args = [];
		if (parsed[2]) {
			this.args = parsed[2]
				.slice(1, -1)
				.split(",")
				.map((s) => s.replaceAll(/[\"\']/g, "").trim());
		}
	}
	process() {}
}
