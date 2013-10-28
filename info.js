// info functions

var fs = require('fs')//, process = require('process');

exports.master = function(req, res){
	req.file = req.path.substr(req.path.indexOf('/',6));
	//res.send('you want to check "'+req.params.action+'" of '+req.path.substr(req.path.indexOf('/',6)))
	exports[req.params.action](req, res);
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
