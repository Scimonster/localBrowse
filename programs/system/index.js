/**
 * @file Program -- Open with system program
 * @author Scimonster
 * @license {@link LICENSE} (AGPL)
 */
var path = require('path'), spawn = require('child_process').spawn;
var name = exports.modName = path.basename(__dirname);
exports.html = function(file, cb) {
	spawn('xdg-open', [file.path]);
	cb('');
};

exports.messages = {en: {}};
exports.messages.en["program-"+name] = "system program";

exports.mimetypes = [/.*/];

exports.desc = 'Open the file with the system\'s default program';
exports.name = 'System program';

exports.noShow = true;

exports.routes = {};
exports.routes['index.js'] = function(req, res) {
	res.sendfile(path.join(__dirname,'scripts.index.js'));
};

exports.buttons = function(f, cb) {
	cb([]);
};
