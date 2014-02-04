/**
 * @file Program -- Combine files
 * @author Scimonster
 * @license {@link LICENSE} (AGPL)
 */
var fs = require('fs'), path = require('path');
var name = exports.modName = path.basename(__dirname);
exports.html = function (files, cb) {
	cb('<pre id="file">'+files.map(function(f){return f.cont}).join('')+'</pre>');
	return;
};

exports.messages = {
	en: {}
};
exports.messages.en["program-" + name] = "cat";
exports.messages.en["program-" + name + "-name"] = "cat";
exports.messages.en["program-" + name + "-desc"] = "Concatenate files";

exports.mimetypes = [/^text\/.*/];

exports.tabs = false;
exports.client = true;

exports.routes = {};
exports.routes['index.js'] = function (req, res) {
	res.sendfile(path.join(__dirname, 'scripts.index.js'));
};

exports.buttons = function (f, cb) {
	cb([{
		elem: '#saveAs',
		message: 'fileview-button-saveas'
	}]);
};