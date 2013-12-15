/**
 * @file Editor/viewer interface
 * @author Scimonster
 * @license {@link LICENSE} (AGPL)
 */
var fs       = require('fs'),
    path     = require('path'),
    extend   = require('extend'),
    put      = require('put-selector'),
    all      = {},
    programs = fs.readdirSync(__dirname);
programs.forEach(function(p) {
	if (fs.statSync(path.join(__dirname,p)).isDirectory()) { // find subdirectories of here
		all[p] = require(path.join(__dirname,p));
	}
});
exports.all = all;

exports.messages = {};
for (var program in all) {
	extend(true, exports.messages, all[program].messages);
}

exports.routes = {};
for (var program in all) {
	exports.routes[program] = all[program].routes;
}

exports.editorsForFile = function(file, showAll) {
	return Object.keys(all).
		filter(function(p){
			return all[p].mimetypes.filter(function(regex){
				if (file instanceof Array) {
					return file.every(function(f){
						return regex.test(f.type);
					});
				}
				return regex.test(file.type);
			}).length && (showAll || !all[p].noShow);
		}).
		map(function(p){
			return {modName: all[p].modName, name: all[p].name, desc: all[p].desc};
		});
};

exports.allEditors = Object.keys(all).map(function(ed){return {modName: all[ed].modName, name: all[ed].name, desc: all[ed].desc}});

exports.generateButtons = function(buttonFunction, file, cb) {
	var _ = require('../text')(require('../lang').code);
	put.defaultTag = 'button';
	buttonFunction(file, function(buttons) {
		cb(buttons.map(function(b){
			if (b instanceof Array) { // a buttonset
				return b.map(function(bsetB){return buttonFromObject(bsetB)});
			}
			return buttonFromObject(b);
		}));
	});
	function buttonFromObject(button) {
		var b = {elem: '', icons: {}};
		if (button.elem.trim()[0] == '<') { // button.elem is an HTML string
			b.elem = button.elem;
		} else {
			if (button.message) {
				b.elem = put(button.elem, _(button.message));
			} else {
				b.elem = put(button.elem);
			}
			if (button.icons) {
				b.icons = button.icons;
			}
		}
		b.elem = b.elem.toString().trim();
		return b;
	}
};
