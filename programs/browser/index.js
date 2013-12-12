/**
 * @file Program -- View with browser
 * @author Scimonster
 * @license {@link LICENSE} (AGPL)
 */
var path = require('path');
var name = exports.name = __dirname;
exports.html = function(file, cb) {
	cb('<iframe id="file" src="/programs/browser/file?file='+file.path+'"></iframe>');
};

exports.messages = {en: {"editor-browser": "default browser viewing"}};

exports.mimetypes = [/.*/];

exports.desc = 'View the file with the browser\'s default program';
exports.name = 'Browser viewer';

exports.routes = {};
exports.routes.file = function(req, res) {
	res.sendfile(req.body.file);
};

exports.buttons = function(f, cb) {
	cb([]);
};