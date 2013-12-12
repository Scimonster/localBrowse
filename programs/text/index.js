/**
 * @file Text editor
 * @author Scimonster
 * @license {@link LICENSE} (AGPL)
 */
var info = require('../../info'), escHTML = require('escape-html');
exports.html = function(file, cb) {
	cb('<textarea id="file" autofocus="autofocus">' + escHTML(file.cont) + '</textarea>');
};

exports.messages = {en: {"editor-text": "text editor"}};

exports.mimetypes = [/text\/.*/,/inode\/x-empty/,/image\/svg/,/application\/json/];

exports.desc = 'Super-simple text editor';
exports.name = 'Text editor';

exports.routes = {};

exports.buttons = function(f, cb) {
	var buttons = [[]], done = false;
	if (f.writable) {
		buttons[0].push({elem: 'button#save', message: 'fileview-button-save'});
	}
	info.perms(f.dir, 1, function(pw) { // can we write in parent directory
		if (pw) {
			buttons[0].push({elem: 'button#saveAs', message: 'fileview-button-saveas'});
		}
		cb(buttons);
	});
};
