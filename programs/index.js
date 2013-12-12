/**
 * @file Editor/viewer interface
 * @author Scimonster
 * @license {@link LICENSE} (AGPL)
 */
var fs = require('fs'), path = require('path'), extend = require('extend'), all = {};
var programs = fs.readdirSync(__dirname);
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

exports.editorsForFile = function(file) {
	var editors = [];
	for (var program in all) {
		if (all[program].mimetypes.filter(function(regex){return regex.test(file.type)}).length) {
			// one of the accepted regexes matches this file
			editors.push(program); // add the program to the list
		}
	}
	return editors;
};