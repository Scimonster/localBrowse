/**
 * @file HTML responses
 * @author Scimonster
 * @license {@link LICENSE} (AGPL)
 * @module routes
 */
var
	_        = require('./text').load(),
	programs = require('./programs'),
	info     = require('./info'),
	LBFile   = require('./File.js'),
	jade     = require('jade'),
	path     = require('path'),
	fs       = require('fs');

/**
 * GET homepage
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.index = function(req, res) {
	var scripts = ['/browserify/File.js','/browserify/text.js','/browserify/jade.js'].concat(['jquery','jquery-ui.min','plugins','main','viewfile','trash','keypress'].map(function(f){return '/js/'+f+'.js'}));
	var sidebar = [
		{name:_('places-home'), icon:'home', url:'~/'},
		{name:_('places-docs'), icon:'document', url:'~/Document/'},
		{name:_('places-downloads'), icon:'arrowthick-1-s', url:'~/Downloads/'},
		{name:_('places-music'), icon:null, url:'~/Music/', span:'<span style="display: inline-block;">♫</span>'},
		{name:_('places-pix'), icon:'image', url:'~/Pictures/'},
		{name:_('places-vids'), icon:'video', url:'~/Videos/'},
		{name:_('places-root'), icon:'disk', url:'/'},
		{name:_('places-recent'), icon:'clock', url:'~/.local/share/recently-used.xbel'},
		{name:_('places-trash'), icon:'trash', url:'trash'}
	];
	res.render('index', {
		sidebar: sidebar,
		scripts: scripts,
		username: process.env.USERNAME,
		homeroot: process.env.HOME,
		'_': _
	});
};

// set it up. unfortunately you have to reset Node each time you change any of the JS files
var UglifyJS = require("uglify-js"), browserify = require('browserify'), code;
var b = {};
b.File = browserify([]);
b.File.require('./File.js');
b.File.bundle(function(e,src){
	code = '/* Uglified js/(jquery, jquery-ui.min, plugins, main).js, and browserified File.js */';
	code += UglifyJS.minify(src,{fromString: true}).code;
	code += UglifyJS.minify(['jquery','jquery-ui.min','plugins','main'].map(function(f){return 'public/js/'+f+'.js'})).code;
});
/**
 * GET single bundled JavaScript file
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @require uglify-js
 * @require browserify
 */
exports.uglify = function(req, res) {
	res.header('Content-Type', 'text/javascript');
	res.send(code);
};

exports.browserify = {};
/**
 * GET browserified File.js
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @require browserify
 */
exports.browserify.File = function(req, res) {
	b.File.bundle(function(e, src){
		res.header('Content-Type', 'text/javascript');
		res.send(src);
	});
};

/**
 * GET list of messages
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.browserify.text = function(req, res) {
	res.header('Content-Type', 'text/javascript');
	res.send(
		'var messages = ' + JSON.stringify(_(), null, '\t') + ';\n\nf' +
		_.toString().split('\n').map(function(line, i, str){
			return line.substr(str[1].lastIndexOf('\t'));
		}).join('\n') // normalize lines
	);
};

/**
 * GET Jade functions
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.browserify.jade = function(req, res) {
	res.header('Content-Type', 'text/javascript');
	info.tree('views', 1000, function(tree) {
		fs.readFile('node_modules/jade/runtime.js', 'utf8', function(e, js) {
			js += '\n\njade.files = {};\n';
			res.send(js+gen(tree, 'views'));
		});
		function gen(obj, dir) {
			var js = '';
			for (var i in obj) {
				if (obj[i]) { // truthy - dir
					if (typeof obj[i]=='object') {
						js += gen(obj[i], path.join(dir, i));
					}
				} else {
					js += 'jade.files['+JSON.stringify(path.join(dir, i))+'] = '
					js += jade.compileFileClient(path.join(dir, i));
					js += ';\n';
				}
			}
			return js;
		}
	});
};

/**
 * GET properties dialog pre-rendering
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.props = function(req, res) {
	info.info(req.query.file, function(i) {
		var tabs = [
			{title: 'Basic', file: 'basic', locals: {imageForFile: imageForFile, _: _, i: i}},
			{title: 'Permissions', file: 'perms', locals: {_: _, i: i}},
			{title: 'Open With', file: 'openwith', locals: {_: _, i: i, programs: programs}},
		], compiled = [];
		tabs.forEach(function(tab) {
			try {
				jade.renderFile('views/properties/'+tab.file+'.jade', tab.locals, function(err, html) {
					compiled.push(html);
					if (compiled.length==tabs.length) {
						res.render('properties/index.jade', {
							tabs: tabs.map(function(t){return {title: t.title, short: t.file}}),
							file: i,
							compiled: compiled,
							_: _
						});
					}
				});
			} catch(e) {
				console.log(e)
				compiled.push('');
			}
		});
	}, false, true);
};

var iconset = require('fs').readdirSync('./public/img/fatcow/16x16');
function imageForFile(f, big) { // get an image for a file
	if (f.type=='directory') {return '/img/fatcow/'+(big?'32x32':'16x16')+'/folder.png'}
	else {
		if (iconset.indexOf('file_extension_'+f.ext+'.png')>-1) { // there is an icon
			return '/img/fatcow/'+(big?'32x32':'16x16')+'/file_extension_'+f.ext+'.png';
		}
		else {return '/img/fatcow/'+(big?'32x32':'16x16')+'/document_empty.png'} // no icon
	}
}

/**
 * GET programs files
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.programs = function(req, res) {
	switch(req.params.action) {
		case undefined: // a base program URL
			switch(req.path.split('/')[2]) {
				case 'editors': // programs available to open the file
				case 'alleditors': // even hidden ones
					if (req.query.file) {
						if (typeof req.query.file=='string') {req.query.file = [req.query.file]}
						var types = [];
						req.query.file.forEach(function(f) {
							info.info.type(f, function(t) {
								types.push({type:t});
								if (types.length == req.query.file.length) {
									res.send(programs.editorsForFile(types, req.path.split('/')[2][0]=='a'));
								}
							});
						});
					} else { // all editors
						res.send(programs.allEditors)
					}
					break;
				default:
					res.send(404);
					break;
			}
			break;
		case 'html':
			info.info(req.query.file, function(i) {
				programs.all[req.params.program].html(i, function(html) {
					res.send(html);
				});
			}, true, true);
			break;
		case 'buttons':
			info.info(req.query.file, function(i) {
				programs.generateButtons(programs.all[req.params.program].buttons, i, function(buttons) {
					res.send(buttons);
				});
			}, true, true);
			break;
		default:
			if (typeof programs.all[req.params.program].routes[req.params.action] == 'function') {
				programs.all[req.params.program].routes[req.params.action](req, res);
			} else {
				res.send(404);
			}
	}
};
