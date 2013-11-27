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
	var cwd = req.body.cwd?decodeURIComponent(req.body.cwd):process.env.HOME, // the cwd to search in
	find = spawn('find', // UNIX `find` command
		[
			'-path', // path is:
			'~/.local/share/Trash', // trash/...
			'-prune', // ...is excluded
			'-o', // OR
			'-iname', // check for case insensitive filename...
			'*'+req.body.term+'*' // ...like the term
		],
		{cwd: cwd}); // in the current directory
	function onfind(found){
		info.fileListInfo( // get info on the...
			found.toString().split('\n').filter(function(f){return f}), // ...non-blank items of the list, which has been split by newline from stdout...
			function(i){ // ...and...
				i.forEach(function(f){
					f.name = f.name.substr(2); // ...remove leading `./`
				});
				res.send(i);
			},
		false);
	}
	find.stdout.on('data', onfind);
};
