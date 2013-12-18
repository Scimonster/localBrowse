/**
 * @file HTML responses
 * @author Scimonster
 * @license {@link LICENSE} (AGPL)
 * @module routes
 */
var
	_        = require('./text')(require('./lang').code),
	programs = require('./programs'),
	info     = require('./info'),
	LBFile   = require('./File.js'),
	jade     = require('jade');

/**
 * GET homepage
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.index = function(req, res) {
	var scripts = ['jquery','jquery-ui.min','plugins','main','viewfile','trash','keypress'].map(function(f){return '/js/'+f+'.js'});
	scripts.unshift('/browserify/File.js','/browserify/text.js');
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
 * @require browserify
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

var iconset = require('fs').readdirSync('./public/img/fatcow/16x16');
// so that it's ready; ok to sync during setup
/**
 * GET directory listing; pre-render list or tiles
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @require fs
 */
exports.dir = function(req, res) {
	if (req.body.files) { // we have a list of files through POST
		send(req.body.files.map(function(i){return new LBFile(i)}));
	} else { // just a dirname
		info.dir(req.body.dir, function(files) {
			if (req.body.s.dirFirst) {
				var TAFFY = require('taffy');
				files = TAFFY(files);
				files = files({type:'directory'}).order(req.body.s.sortby).get(). // dirs
					map(function(i){return new LBFile(i)}).concat( // turn back into LBFiles
					files({type:{'!is':'directory'}}).order(req.body.s.sortby).get().map(function(i){return new LBFile(i)}) // non-dirs
				);
			}
			send(files);
		});
	}
	function send(files) { // send them
		res.render('dir.'+req.query.type+'.jade', { // list or tiles
			imageForFile: imageForFile,
			files: files,
			base: req.body.base||req.body.dir,
			'_': _
		});
	}
};
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
 * GET context menu pre-rendering
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.ctxMenu = function(req, res) {
	switch (req.query.type) {
		case 'seledFiles': // some files were selected
			info.fileListInfo(req.body.files, function(i) {
				res.render('ctxMenu.seledFiles.jade', {
					list: req.body.l=="true"?[ // just one
						{r:req.body.r,id:'open'},
						null,
						{r:req.body.r,id:'cut'},
						{r:req.body.r,id:'copy'},
						null,
						{r:req.body.r,id:'moveTo'},
						{r:req.body.r,id:'copyTo'},
						{r:false,id:'makeLink',params:['']},
						{r:req.body.r,id:'rename'},
						null,
						{r:req.body.r,id:'trash'},
						null,
						{r:false,id:'props'},
					]:[ // more than one
						{r:req.body.r,id:'open'},
						null,
						{r:req.body.r,id:'newFolder'},
						null,
						{r:req.body.r,id:'cut'},
						{r:req.body.r,id:'copy'},
						null,
						{r:req.body.r,id:'moveTo'},
						{r:req.body.r,id:'copyTo'},
						{r:false,id:'makeLink',params:['s']},
						null,
						{r:req.body.r,id:'trash'},
						null,
						{r:false,id:'props'},
					],
					'_': _,
					programs: programs.editorsForFile(i, true)
				});
			});
			break;
		default:
			res.send(404);
	}
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
	}, true, true);
};

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
						info.info(req.query.file, function(i) {
							res.send(programs.editorsForFile(i, req.path.split('/')[2][0]=='a'));
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
