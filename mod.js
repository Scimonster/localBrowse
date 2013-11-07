// modify the file system

var fs = require('fs-extra');

exports.master = function(req, res) {
	req.body.file = decodeURIComponent(req.body.file);
	exports[req.body.action](req, res);
};

exports.mkdir = function(req, res) {
	fs.mkdirs(req.body.file,function(e){
		res.send(!!e);
	});
};

exports.mkfile = function(req, res) {
	fs.open(req.body.file,'wx',function(e,fd){
		if (fd && req.body.content) {
			fs.write(fd, new Buffer(req.body.content), 0, req.body.content, null, function(err, written){
				res.send(written);
			});
		} else {
			res.send(!!e);
		}
	});
};

exports.link = function(req, res) {
	fs.link(req.body.src,req.body.dest,function(e){
		res.send(!!e);
	});
};

exports.copy = function(req, res) {
	fs.link(req.body.src,req.body.dest,function(e){
		res.send(!!e);
	});
};

exports.save = function(req, res) {
	if (req.body.content) {
		var info = require('./info').funcs;
		info.canReadWrite(req.body.file,false,function(w){
			
		});
	}
};
