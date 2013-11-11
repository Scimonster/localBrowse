// GET homepage
exports.index = function(req, res) {
	res.render('index', {
		sidebar: [ // for convenience
			{name:'Home',icon:'home',url:'~/'},
			{name:'Documents',icon:'document',url:'~/Document/'},
			{name:'Downloads',icon:'arrowthick-1-s',url:'~/Downloads/'},
			{name:'Music',icon:null,url:'~/Music/',span:'<span style="display: inline-block;">♫</span>'},
			{name:'Pictures',icon:'image',url:'~/Pictures/'},
			{name:'Videos',icon:'video',url:'~/Videos/'},
			{name:'Root',icon:'disk',url:'/'},
			{name:'Recent',icon:'clock',url:'~/.local/share/recently-used.xbel'},
			{name:'Trash',icon:'trash',url:'~/Trash/'}
		],
		username: process.env.USERNAME,
		homeroot: process.env.HOME,
	});
};

// GET directory listing
var iconset = require('fs').readdirSync('./public/img/fatcow/16x16'); // so that it's ready; ok to sync during setup
exports.dir = function(req, res) {
	var ops = require('./public/js/fileOps.js');
	ops.imageForFile = function(f,big) {
		if (f.type=='directory') {return 'img/fatcow/'+(big?'32x32':'16x16')+'/folder.png'}
		else {
			var ext = f.name.split('.');
			ext = ext.length?ext[ext.length-1]:'';
			if (iconset.indexOf('file_extension_'+ext+'.png')>-1) {return 'img/fatcow/'+(big?'32x32':'16x16')+'/file_extension_'+ext+'.png'}
			else {return 'img/fatcow/'+(big?'32x32':'16x16')+'/document_empty.png'}
		}
	};
	res.render('dir.'+req.query.type+'.jade', {
		ops: ops,
		files: req.body.files,
		base: req.body.base
	});
};