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
	if (req.body.content !== undefined) {
		var info = require('./info').funcs;
		fs.stat(req.body.file,function(e,stat){
			if (e) {
				res.send({err:'could not stat'});
				return;
			}
			info.canReadWrite(req.body.file,false,function(w){
				if (w) {
					var done = 1;
					if (stat.size) { // currently not an empty file
						done--;
						fs.readFile(req.body.file,function(e,oldcont){ // get old contents to write to backup
							if (e) {
								res.send({err:'could not read'});
								return;
							}
							fs.writeFile(req.body.file+'~',oldcont,function(e){
								done++;
								if (done===2) {
									fs.stat(req.body.file,function(e,i){
										if (e) {
											res.send({err:'could not stat after saving'});
											return;
										}
										res.send({date:(e?0:i.mtime.getTime()/1000).toString(10)});
									});
								}
							});
						});
					}
					fs.writeFile(req.body.file,req.body.content,function(e){
						if (e) {
							res.send({err:'could not write'});
							return;
						}
						done++;
						if (done===2) {
							fs.stat(req.body.file,function(e,i){
								if (e) {
									res.send({err:'could not stat after saving'});
									return;
								}
								res.send({date:(e?0:i.mtime.getTime()/1000).toString(10)});
							});
						}
					});
				} else {
					res.send({err:'not writable'});
				}
			},stat);
		});
	} else {
		res.send({err:'no content'});
	}
};
