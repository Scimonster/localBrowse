/**
 * @file Search for a term
 * @author Scimonster
 * @license {@link LICENSE} (MIT)
 * @module search
 * @requre child_process
 * @require ./info
 */
var spawn = require('child_process').spawn, info = require('./info');
/**
 * Run the requests
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.search = function(req, res) {
	var cwd = req.body.cwd?decodeURIComponent(req.body.cwd):process.env.HOME,
	find = spawn('find',
		['-path','~/.local/share/Trash','-prune','-o','-iname','*'+req.body.term+'*'],
		{cwd: cwd});
	function onfind(found){
		info.funcs.fileListInfo(found.toString().split('\n').filter(function(f){return f}),function(i){
			i.forEach(function(f){
				f.name = f.name.substr(2);
			});
			res.send(i);
		},false);
	}
	find.stdout.on('data', onfind);
};
