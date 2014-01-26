var programs = require('./.'), jsonfn = require('json-fn'), obj = require('../Object');
function map(val) {
	return JSON.stringify(jsonfn.stringify(obj.map(val, function(p){
		return obj.filter(p, function(v,key){
			return ['html','messages','routes'].indexOf(key)==-1;
		});
	})));
}
module.exports = "var programs = {};\n\
programs.all = JSONfn.parse("+map(programs.all)+");\n\
programs.arr = JSONfn.parse("+map(programs.arr)+");\n\
\n\
programs.editorsForFile = function(file, showAll) {\n\
	return programs.arr.filter(function(p){\n\
		return p.mimetypes.filter(function(regex){\n\
			if (file instanceof Array) {\n\
				return file.every(function(f){\n\
					return regex.test(f.type);\n\
				});\n\
			}\n\
			return regex.test(file.type);\n\
		}).length && (showAll || !p.noShow);\n\
	}).map(function(p){\n\
		return p.modName;//{modName: p.modName, name: p.name, desc: p.desc};\n\
	});\n\
};\n\
\n\
programs.allEditors = programs.arr.map(function(ed){return {modName: ed.modName, name: ed.name, desc: ed.desc}});\n\
\n\
programs.generateButtons = function(buttonFunction, file, cb) {\n\
	put.defaultTag = 'button';\n\
	buttonFunction(file, function(buttons) {\n\
		cb(buttons.map(function(b){\n\
			if (b instanceof Array) { // a buttonset\n\
				return b.map(function(bsetB){return buttonFromObject(bsetB)});\n\
			}\n\
			return buttonFromObject(b);\n\
		}));\n\
	});\n\
	function buttonFromObject(button) {\n\
		var b = {elem: '', icons: {}};\n\
		if (button.elem.trim()[0] == '<') { // button.elem is an HTML string\n\
			b.elem = button.elem;\n\
		} else {\n\
			if (button.message) {\n\
				b.elem = put(button.elem, _(button.message));\n\
			} else {\n\
				b.elem = put(button.elem);\n\
			}\n\
			b.elem = b.elem.outerHTML;\n\
		}\n\
		if (button.icons) {\n\
			b.icons = button.icons;\n\
		}\n\
		b.elem = b.elem.trim();\n\
		return b;\n\
	}\n\
};";