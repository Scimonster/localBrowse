
/*
 * Router catch-all for info pages
 */

exports.master = function(req, res){
	req.file = req.path.substr(req.path.indexOf('/',6));
	res.send('you want to check "'+req.params.action+'" of '+req.path.substr(req.path.indexOf('/',6)))
};