/**
 * @file HTML responses
 * @author Scimonster
 * @license {@link LICENSE} (MIT)
 * @module routes
 */
var _ = require('./text')(require('./lang').code)

/**
 * GET homepage
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.index = function(req, res) {
	var scripts = ['jquery','jquery-ui.min','plugins','main','viewfile','trash','keypress'].map(function(f){return 'js/'+f+'.js'});
	scripts.unshift('browserify/File.js');
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
var b = browserify([]);
b.require('./File.js');
b.bundle(function(e,src){
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

exports.browserify  =  {};
/**
 * GET browserified File.js
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @require browserify
 */
exports.browserify.File = function(req, res) {
	b.bundle(function(e,src){
		res.header('Content-Type', 'text/javascript');
		res.send(src);
	});
};

var iconset = require('fs').readdirSync('./public/img/fatcow/16x16'), // so that it's ready; ok to sync during setup
LBFile = require('./File.js'), info = require('./info'); // dependencies for file operations
/**
 * GET directory listing; pre-render list or tiles
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @require fs
 */
exports.dir = function(req, res) {
	function imageForFile(f, big) { // get an image for a file
		if (f.type=='directory') {return 'img/fatcow/'+(big?'32x32':'16x16')+'/folder.png'}
		else {
			if (iconset.indexOf('file_extension_'+f.ext+'.png')>-1) { // there is an icon
				return 'img/fatcow/'+(big?'32x32':'16x16')+'/file_extension_'+f.ext+'.png';
			}
			else {return 'img/fatcow/'+(big?'32x32':'16x16')+'/document_empty.png'} // no icon
		}
	};
	if (req.body.files) { // we have a list of files through POST
		send(req.body.files);
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

/**
 * GET context menu pre-rendering
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.ctxMenu = function(req, res) {
	switch (req.query.type) {
		case 'seledFiles': // some files were selected
			res.render('ctxMenu.seledFiles.jade', {
				list: req.body.l?[ // just one
					{r:req.body.r,id:'open',text:'Open'},
					null,
					{r:req.body.r,id:'cut',text:'Cut'},
					{r:req.body.r,id:'copy',text:'Copy'},
					null,
					{r:req.body.r,id:'moveTo',text:'Move to...'},
					{r:req.body.r,id:'copyTo',text:'Copy to...'},
					{r:false,id:'makeLink',text:'Make link...'},
					{r:req.body.r,id:'rename',text:'Rename'},
					null,
					{r:req.body.r,id:'trash',text:'Move to Trash'},
					null,
					{r:false,id:'props',text:'Properties'},
				]:[ // more than one
					{r:req.body.r,id:'newFolder',text:'New folder with selection'},
					null,
					{r:req.body.r,id:'cut',text:'Cut'},
					{r:req.body.r,id:'copy',text:'Copy'},
					null,
					{r:req.body.r,id:'moveTo',text:'Move to...'},
					{r:req.body.r,id:'copyTo',text:'Copy to...'},
					{r:false,id:'makeLink',text:'Make links...'},
					null,
					{r:req.body.r,id:'trash',text:'Move to Trash'},
					null,
					{r:false,id:'props',text:'Properties'},
				]
			});
			break;
		default:
			res.send('<h2>Improper "type" GET variable set.</h2>');
	}
};
