/**
 * @file Program -- Text editor
 * @author Scimonster
 * @license {@link LICENSE} (AGPL)
 */
var info = require('../../info'), escHTML = require('escape-html'), path = require('path');
var name = exports.modName = path.basename(__dirname);
exports.html = function(file, cb) {
	cb('<textarea id="file" autofocus="autofocus">' + escHTML(file.cont) + '</textarea>');
};

exports.messages = {en: {}};
exports.messages.en["program-"+name] = "text editor";
exports.messages.en["program-"+name+"-name"] = "Text editor";
exports.messages.en["program-"+name+"-desc"] = "Super-simple text editor";

exports.mimetypes = [/text\/.*/,/inode\/x-empty/,/image\/svg/,/application\/json/];

exports.desc = 'Super-simple text editor';
exports.name = 'Text editor';

exports.routes = {};
exports.routes['index.js'] = function(req, res) {
	res.sendfile(path.join(__dirname,'scripts.index.js'));
};

exports.tabs = true;

exports.buttons = function(f, cb) {
	var buttons = [[]], done = false;
	if (f.writable) {
		buttons[0].push({elem: '#save', message: 'fileview-button-save'});
	}
	info.perms(f.dir, 1, function(pw) { // can we write in parent directory
		if (pw) {
			buttons[0].push({elem: '#saveAs', message: 'fileview-button-saveas'});
		}
		cb(buttons);
	});
};
