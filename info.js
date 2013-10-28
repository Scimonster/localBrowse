// info functions

var fs = require('fs');

exports.master = function(req, res, next){
	req.file = req.path.substr(req.path.indexOf('/',6));
	//res.send('you want to check "'+req.params.action+'" of '+req.path.substr(req.path.indexOf('/',6)))
	next();
};

exports.exists = function(req, res){
	fs.exists(req.file,function(e){
		res.send(e);
	});
};