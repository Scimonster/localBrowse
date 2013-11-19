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
var fs = require('fs'), iconset = fs.readdirSync('./public/img/fatcow/16x16'); // so that it's ready; ok to sync during setup
exports.dir = function(req, res) {
	var ops = require('./public/js/fileOps.js'), info = require('./info').funcs;
	ops.imageForFile = function(f,big) {
		if (f.type=='directory') {return 'img/fatcow/'+(big?'32x32':'16x16')+'/folder.png'}
		else {
			var ext = f.name.split('.');
			ext = ext.length?ext[ext.length-1]:'';
			if (iconset.indexOf('file_extension_'+ext+'.png')>-1) {return 'img/fatcow/'+(big?'32x32':'16x16')+'/file_extension_'+ext+'.png'}
			else {return 'img/fatcow/'+(big?'32x32':'16x16')+'/document_empty.png'}
		}
	};
	if (req.body.files) {
		send(req.body.files);
	} else {
		info.dir(req.body.dir,function(files){
			var TAFFY = require('taffy');
			files = TAFFY(files);
			send((req.body.s.dirFirst?files({type:'directory'}).order(req.body.s.sortby).get().concat(files({type:{'!is':'directory'}}).order(req.body.s.sortby).get()):files().order(req.body.s.sortby).get()));
		});
	}
	function send(files) {
		res.render('dir.'+req.query.type+'.jade', {
			ops: ops,
			files: files,// req.body.files||info.dir(req.body.dir),
			base: req.body.base||req.body.dir
		});
	}
};

exports.ctxMenu = function(req, res) {
	switch (req.query.type) {
		case 'seledFiles':
			res.render('ctxMenu.seledFiles.jade', {
				list: req.body.l?[
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
				]:[
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
