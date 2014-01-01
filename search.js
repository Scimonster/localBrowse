/**
 * @file Search for a term
 * @author Scimonster
 * @license {@link LICENSE} (AGPL)
 * @module search
 * @requre child_process
 * @require ./info
 */
var spawn = require('child_process').spawn, info = require('./info'), obj = require('./Object');
/**
 * Search for a term
 * @param term {string} Term to search for
 * @param cb {function} Callback, called with one parameter - info (from info.info) on all items
 * @param [cwd=home directory] Directory to search in
 */
exports.search = function(term, cb, cwd) {
	cwd = cwd||process.env.HOME;
	find = spawn('find', // UNIX `find` command
		[
			'-path', // path is:
			'~/.local/share/Trash', // trash/...
			'-prune', // ...is excluded
			'-o', // OR
			'-iname', // check for case insensitive filename...
			'*'+term+'*' // ...like the term
		],
		{cwd: cwd}); // in the current directory
	function onfind(found){
		info.fileListInfo( // get info on the...
			obj.filter(found.toString().split('\n'), true), // ...non-blank items of the list, which has been split by newline from stdout...
			function(i){ // ...and...
				i.forEach(function(f){
					f.name = f.name.substr(2); // ...remove leading `./`
				});
				cb(i);
			},
		false,
		cwd);
	}
	find.stdout.on('data', onfind);
};
