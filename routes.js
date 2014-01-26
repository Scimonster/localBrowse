/**
 * @file HTML responses
 * @author Scimonster
 * @license {@link LICENSE} (AGPL)
 * @module routes
 */
var _ = require('./text').load(),
	programs = require('./programs'),
	info = require('./info'),
	search = require('./search'),
	LBFile = require('./File.js'),
	obj = require('./Object.js'),
	jade = require('jade'),
	path = require('path'),
	fs = require('fs-extra'),
	config = require('./config');

/**
 * GET homepage
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.index = function (req, res) {
	var scripts = ['File', 'Object', 'text', 'jade'].
	map(function (f) {
		return '/browserify/' + f + '.js';
	}).concat(
	['jquery', 'jquery-ui.min', 'chosen.jquery.min', 'plugins', 'main', 'viewfile', 'trash', 'keypress', 'filesel'].
	map(function (f) {
		return '/js/' + f + '.js';
	})).
	concat(['/browserify/programs.js']);
	var sidebar = [{
		name: _('places-home'),
		icon: 'home',
		url: '~/'
	}, {
		name: _('places-docs'),
		icon: 'document',
		url: '~/Document/'
	}, {
		name: _('places-downloads'),
		icon: 'arrowthick-1-s',
		url: '~/Downloads/'
	}, {
		name: _('places-music'),
		icon: null,
		url: '~/Music/',
		span: '<span style="display: inline-block;">♫</span>'
	}, {
		name: _('places-pix'),
		icon: 'image',
		url: '~/Pictures/'
	}, {
		name: _('places-vids'),
		icon: 'video',
		url: '~/Videos/'
	}, {
		name: _('places-root'),
		icon: 'disk',
		url: '/'
	}, {
		name: _('places-recent'),
		icon: 'clock',
		url: '~/.local/share/recently-used.xbel'
	}, {
		name: _('places-trash'),
		icon: 'trash',
		url: 'trash'
	}];
	res.render('index', {
		sidebar: sidebar,
		scripts: scripts,
		username: process.env.USERNAME,
		homeroot: process.env.HOME,
			'_': _
	});
};

// not using
// set it up. unfortunately you have to reset Node each time you change any of the JS files
var UglifyJS = require("uglify-js"),
	browserify = require('browserify'),
	code;
var b = {};
b.File = browserify([]);
b.File.require('./File.js');
b.File.bundle(function (e, src) {
	code = '/* Uglified js/(jquery, jquery-ui.min, plugins, main).js, and browserified File.js */';
	code += UglifyJS.minify(src, {
		fromString: true
	}).code;
	code += UglifyJS.minify(['jquery', 'jquery-ui.min', 'plugins', 'main'].map(function (f) {
		return 'public/js/' + f + '.js';
	})).code;
});
/**
 * GET single bundled JavaScript file
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @require uglify-js
 * @require browserify
 */
exports.uglify = function (req, res) {
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
exports.browserify.File = function (req, res) {
	b.File.bundle(function (e, src) {
		res.header('Content-Type', 'text/javascript');
		res.send(src);
	});
};

b.Object = browserify([]);
b.Object.require('./Object.js');
/**
 * GET browserified Object.js
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @require browserify
 */
exports.browserify.Object = function (req, res) {
	b.Object.bundle(function (e, src) {
		res.header('Content-Type', 'text/javascript');
		res.send(src);
	});
};

/**
 * GET list of messages
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.browserify.text = function (req, res) {
	res.header('Content-Type', 'text/javascript');
	res.send(
		'var messages = ' + JSON.stringify(_(), null, '\t') + ';\n\nf' + _.toString().split('\n').map(function (line, i, str) {
		return line.substr(str[1].lastIndexOf('\t'));
	}).join('\n') // normalize lines
	);
};

/**
 * GET Jade functions
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.browserify.jade = function (req, res) {
	res.header('Content-Type', 'text/javascript');
	info.tree('views', 1000, function (tree) {
		fs.readFile('node_modules/jade/runtime.js', 'utf8', function (e, js) {
			js += '\n\njade.files = {};\n';
			res.send(js + gen(tree, 'views'));
		});

		function gen(obj, dir) {
			var js = '';
			for (var i in obj) {
				if (obj[i]) { // truthy - dir
					if (typeof obj[i] == 'object') {
						js += gen(obj[i], path.join(dir, i));
					}
				} else if (/\.jade$/.test(i)) {
					js += 'jade.files[' + JSON.stringify(path.join(dir, i)) + '] = ';
					js += jade.compileFileClient(path.join(dir, i));
					js += ';\n';
				}
			}
			return js;
		}
	});
};

/**
 * GET local programs
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.browserify.programs = function (req, res) {
	res.header('Content-Type', 'text/javascript');
	res.send(require('./programs/client'));
};

/**
 * GET programs files
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.programs = function (req, res) {
	switch (req.params.action) {
		case undefined:
			// a base program URL
			switch (req.path.split('/')[2]) {
				case 'editors':
					// programs available to open the file
				case 'alleditors':
					// even hidden ones
					if (req.query.file) {
						if (typeof req.query.file == 'string') {
							req.query.file = [req.query.file];
						}
						var types = [];
						req.query.file.forEach(function (f) {
							info.info.type(f, function (t) {
								types.push({
									type: t
								});
								if (types.length == req.query.file.length) {
									res.send(programs.editorsForFile(types, req.path.split('/')[2][0] == 'a'));
								}
							});
						});
					} else { // all editors
						res.send(programs.allEditors);
					}
					break;
				default:
					res.send(404);
					break;
			}
			break;
		case 'html':
			info.info(req.query.file, function (i) {
				programs.all[req.params.program].html(i, function (html) {
					res.send(html);
				});
			}, true, true);
			break;
		case 'buttons':
			info.info(req.query.file, function (i) {
				programs.generateButtons(programs.all[req.params.program].buttons, i, function (buttons) {
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

exports.info = {};

/**
 * @property {function} get
 * Intercepts GET requests
 * @property {function} post
 * Intercepts POST requests
 * @property {function} all
 * Run action after pre-parsing
 * */
exports.info.routes = {
	/**
	 * Intercepts GET requests
	 * @param {Object} req Express request object
	 * @param {Object} res Express response object
	 */
	get: function (req, res) {
		req.file = req.path.substr(req.path.indexOf('/', 6)); // the filename is everything after the first slash after /info/
		exports.info.routes.all(req, res);
	},
	/**
	 * Intercepts POST requests
	 * @param {Object} req Express request object
	 * @param {Object} res Express response object
	 */
	post: function (req, res) {
		req.file = req.body.file;
		exports.info.routes.all(req, res);
	},
	/**
	 * Run action after pre-parsing
	 * @param {Object} req Express request object
	 * @param {Object} res Express response object
	 */
	all: function (req, res) {
		if (typeof req.file == 'string') {
			req.file = path.normalize(decodeURIComponent(req.file)); // fix it up
		} else {
			req.file = obj.map(req.file, function (f) {
				return path.normalize(decodeURIComponent(f));
			}); // fix it up
		}
		info.actions[req.params.action](req, res); // and do whatever we asked
	}
};

/**
 * Send current work directory
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.info.cwd = function (req, res) {
	res.send(process.env.PWD);
};

/**
 * POST search listing
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.search = function (req, res) {
	search(req.body.term, function (i) {
		res.send(i);
	}, req.body.cwd ? decodeURIComponent(req.body.cwd) : null);
};

/**
 * GET/POST configuration items
 */
fs.jsonfile.spaces = '\t';
exports.config = {};
exports.config.get = function (req, res) {
	res.send(req.query.item ? req.query.item.split('.').reduce(function (o, n) {
		return o[n];
	}, config) : config);
};
exports.config.post = function (req, res) {
	req.body.newVal = parseFloat(req.body.newVal) == req.body.newVal ? parseFloat(req.body.newVal) : req.body.newVal; // turn to num
	var tree = req.body.item.split('.'),
		last = tree.pop(),
		item = tree.reduce(function (o, n) {
			return o[n];
		}, config);
	item[last] = req.body.newVal;
	fs.writeJSON('config.json', config, function (e) {
		res.send(config);
	});
};