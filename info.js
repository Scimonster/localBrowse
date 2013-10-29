// info functions

var fs = require('fs-extra'), mmm = require('mmmagic'), mimeLazy = require('mime');

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
		exports[req.params.action](req, res);
	}
};

exports.exists = function(req, res){
	fs.exists(req.file,function(e){
		res.send(e);
	});
};

function canReadWrite(file, read, cb){ // based on https://groups.google.com/d/msg/nodejs/qmZtIwDRSYo/N7xOioUnwjsJ
	fs.stat(file, function (err, stat) {
		if (err) {cb(false)}
		cb(!!((stat.mode & (read?00004:00002)) || (stat.mode & (read?00400:00200)) && process.uid === stat.uid || (stat.mode & (read?00040:00020)) && process.gid === stat.gid));
	});
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

function info(file,cb){
	var i = {name: file};
	fs.exists(file,function(e){
		i.exists = e;
		if (!e) {
			cb(i);
			return;
		}
		canReadWrite(file,false,function(w){
			i.writable = w;
			finished();
		});
		canReadWrite(file,true,function(r){
			i.readable = r;
			fs.stat(file,function(e,s){
				i.date = s.mtime.getTime()/1000;
				i.perm = parseInt(parseInt(s.mode.toString(8),10).toString(10).substr(2),8);
				i.type = s.isDirectory()?'directory':'';
				if (!i.type) { // is file
					var magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE);
					magic.detectFile(file,function(m_e,m_type){
						if (m_e) { // Magic error, use lazy checking
							i.type = mimeLazy.lookup(file);
						} else {
							i.type = m_type;
						}
						finished();
					});
					i.size = s.size;
				} else {
					fs.readdir(file,function(d_e,d){
						i.size = d.length;
						finished();
					});
				}
				finished();
			});
			fs.lstat(file,function(e,s){
				i.isLink = s.isSymbolicLink();
				if (i.isLink) {
					fs.readlink(file,function(e,l){
						i.link = l;
						finished();
					});
				} else {
					finished();
				}
			});
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
			typeof i.isLink !== 'undefined' && (!i.isLink || typeof i.link !== 'undefined')) {
			cb(i);
		}
	}
}

exports.info = function(req, res, content) {
	info(req.file,function(i){res.send(i)});
};
