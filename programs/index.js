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
    arr      = [],
    programs = fs.readdirSync(__dirname);
programs.forEach(function(p) {
	if (fs.statSync(path.join(__dirname,p)).isDirectory()) { // find subdirectories of here
		all[p] = require(path.join(__dirname,p));
		arr.push(all[p]);
	}
});
exports.all = all;
exports.arr = arr;

exports.messages = arr.reduce(function(prev, cur){return extend(true, prev, cur.messages)}, {});

exports.routes = arr.reduce(function(prev, cur){
	var a = {};
	a[cur.modName] = cur.routes;
	return extend(true, prev, a);
}, {});

exports.editorsForFile = function(file, showAll) {
	return arr.filter(function(p){
		return p.mimetypes.filter(function(regex){
			if (file instanceof Array) {
				return file.every(function(f){
					return regex.test(f.type);
				});
			}
			return regex.test(file.type);
		}).length && (showAll || !p.noShow);
	}).map(function(p){
		return {modName: p.modName, name: p.name, desc: p.desc};
	});
};

exports.allEditors = arr.map(function(ed){return {modName: ed.modName, name: ed.name, desc: ed.desc}});

exports.generateButtons = function(buttonFunction, file, cb) {
	var _ = require('../text').load();
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
