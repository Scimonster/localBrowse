// info functions

var fs = require('fs-extra'),
	fileOps = require('./public/js/fileOps.js');

exports.master = {
	get: function(req, res){
		req.file = req.path.substr(req.path.indexOf('/',6));
		exports.master.all(req,res);
	},
	post: function(req, res){
		req.file = req.body.file;
		exports.master.all(req,res);
	},
	all: function(req, res) {
		req.file = decodeURIComponent(req.file);
		exports[req.params.action](req, res);
	}
};

exports.exists = function(req, res){
	fs.exists(req.file,function(e){
		res.send(e);
	});
};

function canReadWrite(file, read, cb, s){
	if (s) {
		run(s);
	} else {
		fs.stat(file, function (err, stat) {
			if (err) {cb(false)}
			run(stat);
		});
	}
	function run(stat) {
		var mode = stat.mode.toString(8).split('').map(function(m){return parseInt(m).toString(2)});
		if (read) {
			cb(!!((mode[4]&100) || ((mode[2]&100) && process.getuid() === stat.uid) || ((mode[3]&100) && process.getgid() === stat.gid)));
		} else {
			cb(!!((mode[4]&010) || ((mode[2]&010) && process.getuid() === stat.uid) || ((mode[3]&010) && process.getgid() === stat.gid)));
		}
	}
}

exports.writable = function(req, res) {
	canReadWrite(req.file,false,function(w){
		res.send(w);
	});
};

exports.readable = function(req, res) {
	canReadWrite(req.file,true,function(r){
		res.send(r);
	});
};

function info(file,cb,content,stat){
	var i = {name: file};
	fs.exists(file,function(e){
		i.exists = e;
		if (!e) {
			cb(i);
			return;
		}
		fs.stat(file,function(e,s){
			if (stat) {
				i.stat = s;
			}
			canReadWrite(file,false,function(w){
				i.writable = w;
				finished();
			},s);
			canReadWrite(file,true,function(r){
				i.readable = r;
				fs.lstat(file,function(e,ls){
					i.isLink = ls.isSymbolicLink();
					if (i.isLink) {
						fs.readlink(file,function(e,l){
							i.link = l;
							finished();
						});
					} else {
						finished();
					}
				});
				i.type = s.isDirectory()?'directory':'';
				if (!i.type) { // is file
					if (r && !s.isDirectory() && content) {
						fs.readFile(file,'utf8',function(f_e,f){
							i.cont = e?null:f;
							finished();
						});
					}
					var mmm = require('mmmagic'), magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE);
					magic.detectFile(file,function(m_e,m_type){
						if (m_e) { // Magic error, use lazy checking
							i.type = require('mime').lookup(file);
						} else {
							i.type = m_type;
						}
						finished();
					});
					i.size = s.size;
				} else if (r) { // is dir
					fs.readdir(file,function(d_e,d){
						i.size = d.length;
						finished();
					});
				} else {
					i.size = null;
				}
				finished();
			},s);
			i.date = s.mtime;
			i.perm = parseInt(s.mode.toString(8),10).toString(10).substr(2);
			finished();
		});
	});
	function finished(){
		if (
			typeof i.writable !== 'undefined' &&
			typeof i.readable !== 'undefined' &&
			typeof i.date !== 'undefined' &&
			typeof i.size !== 'undefined' &&
			typeof i.date !== 'undefined' &&
			typeof i.perm !== 'undefined' &&
			typeof i.type !== 'undefined' && i.type !== '' &&
			typeof i.isLink !== 'undefined' && (!i.isLink || typeof i.link !== 'undefined') &&
			(content && i.type!='directory'?typeof i.cont !== 'undefined':true) &&
			(stat?typeof i.stat !== 'undefined':true)) {
			cb(i);
		}
	}
}

exports.info = function(req, res) {
	var content = req.body && req.body.content, stat = req.body && req.body.stat;
	info(
		req.file,
		function(i){res.send(i)},
		content,
		stat
	);
};

exports['info.date'] = function(req, res) {
	fs.stat(req.file,function(e,s){
		res.send((e?0:s.mtime.getTime()/1000).toString(10));
	});
};

exports.echo = function(req, res) {
	res.sendfile(req.file);
};

exports.isDir = function(req, res) {
	fs.stat(req.file,function(e,s){
		res.send(e?false:s.isDirectory());
	});
};

function fileListInfo(files,cb,content) {
	var fileList = [];
	files.forEach(function(f){
		info(f,function(i){
			fileList.push(i);
			finished();
		},content);
	});
	function finished(){
		if (files.length===fileList.length) {
			cb(fileList);
		}
	}
}

function dir(files,cb,cont) {
	if (typeof files==='string') {
		fs.readdir(files,function(e,d){
			if (e) {
				cb({error: e.code==='EACCES'?'perms':'exist'});
			} else {
				files = d.map(function(f){return fileOps.addSlashIfNeeded(files)+f});
				run();
			}
		});
	} else {
		run();
	}
	function run() {
		fileListInfo(files,function(files){
			files.forEach(function(i){
				i.name = fileOps.getFileName(i.name);
			});
			cb(files);
		},cont);
	}
}

exports.dir = function(req, res) {
	var content = req.body.cont=="true", simple = req.body.simple=="true";
	fs.readdir(req.file,function(e,d){
		if (e) {
			res.send({error: e.code==='EACCES'?'perms':'exist'});
		} else if (simple) {
			res.send(d);
		} else {
			dir(d.map(function(f){return fileOps.addSlashIfNeeded(req.file)+f}),function(files){res.send(files)},content);
		}
	});
};

function fullDirSize(dir,cb) {
	var size = require('child_process').spawn('du', ['-sb','--apparent-size', dir]);
	size.stdout.on('data', function (data) {
		cb(parseInt(data).toString());
	});
}

// http://procbits.com/2011/10/29/a-node-js-experiment-thinking-asynchronously-recursion-calculate-file-size-directory
function dirSize(dir, depth, cb) {
	var async_running = 0, file_counter = 1, total = 0;
	function again(current_dir, depth) {
		return fs.lstat(current_dir, function(err, stat) {
			if (err) {
				file_counter--;
				return;
			}
			if (stat.isFile()) {
				file_counter--;
				total += stat.size;
			} else if (stat.isDirectory() && depth) {
				file_counter--;
				async_running++;
				fs.readdir(current_dir, function(err, files) {
					var file, _i, _len, _results;
					async_running--;
					if (err) {
						return;
					}
					file_counter += files.length;
					_results = [];
					for (_i = 0, _len = files.length; _i < _len; _i++) {
						file = files[_i];
						_results.push(again(fileOps.addSlashIfNeeded(current_dir)+file,depth-1));
					}
					return _results;
				});
			} else {
				file_counter--;
			}
			if (file_counter === 0 && async_running === 0) {
				cb(total);
			}
		});
	};
	again(dir,depth);
};

exports.dirSize = function(req, res) {
	var depth = (req.body && req.body.depth) || 3;
	dirSize(req.file,depth===0?Infinity:depth,function(s){res.send(s.toString())})
};

exports.localbrowseCWD = function(req, res){
	res.send(process.env.PWD);
};

exports.funcs = {
	info: info,
	dirSize: dirSize,
	fileListInfo: fileListInfo,
	canReadWrite: canReadWrite,
	dir: dir
};
