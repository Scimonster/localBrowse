/**
 * @file Modify the file system
 * @author Scimonster
 * @license {@link LICENSE} (AGPL)
 * @module mod
 * @requre fs-extra
 */

var fs = require('fs-extra'), http = require('http'), obj = require('./Object');

/**
 * POST requests to /mod
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.master = function(req, res) {
	req.body.file = decodeURIComponent(req.body.file); // set up
	exports[req.body.action](req, res); // and do it
};

/**
 * Create a directory
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.mkdir = function(req, res) {
	fs.mkdirs(req.body.file, function(e) { // make parent dirs too, just in case
		res.send(!!e);
	});
};

/**
 * Create a file
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.mkfile = function(req, res) {
	fs.open(req.body.file, 'wx', function(e, fd) { // open the file for writing if it doesn't exist
		if (fd && req.body.content) { // write the content to it
			fs.write(fd, new Buffer(req.body.content), 0, req.body.content.length, null, function(err, written) {
				res.send(!!written);
			});
		} else {
			res.send(!e); // send success
		}
	});
};

/**
 * Download a file from a remote server
 */
 // http://stackoverflow.com/a/17676794/3187556
exports.download = function(req, res) {
	var request = http.get(req.body.url, function(response){
		var file = fs.createWriteStream(req.body.dest);
		response.pipe(file);
		file.on('finish', function(){
			file.close();
			res.send(true);
		});
		file.on('error', function(e){
			res.send(false);
			console.log('error writing file '+req.body.dest+' having downloaded from url '+req.body.url);
			console.log(e);
		});
	}).on('error', function(e){
		res.send(false);
		console.log('error downloading from url '+req.body.url);
		console.log(e);
	});
}

/**
 * Create a symlink
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.link = function(req, res) {
	fs.symlink(req.body.src, req.body.dest, function(e) {
		res.send(!e);
	});
};

/**
 * Save a file
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.save = function(req, res) {
	if (req.body.content !== undefined) { // content MUST be set
		var info = require('./info');
		fs.stat(req.body.file, function(e, stat) {
			if (e) {
				res.send({err:'could not stat'});
				return;
			}
			info.perms(stat, 1, function(w) {
				if (w) { // if writable
					var done = 1; // files written to (starts at one in case it is empty, in which case we don't backup)
					if (stat.size) { // currently not an empty file
						done--;
						fs.readFile(req.body.file, function(e, oldcont) { // get old contents to write to backup
							if (e) {
								res.send({err:'could not read'});
								return;
							}
							write(); // only write after old contents are read
							fs.writeFile(req.body.file+'~', oldcont, fin); // write old content to backup, ignore errors
						});
					} else {
						write();
					}
					function write() {
						fs.writeFile(req.body.file, req.body.content, function(e) { // write actual file
							if (e) {
								res.send({err:'could not write'});
								return;
							}
							fin();
						});
					}
					function fin() {
						done++;
						if (done===2) {
							fs.stat(req.body.file,function(e,i){
								if (e) {
									res.send({err:'could not stat after saving'});
									return;
								}
								res.send({date:i.mtime.getTime()});
							});
						}
					}
				} else {
					res.send({err:'not writable'});
				}
			});
		});
	} else {
		res.send({err:'no content'});
	}
};

/**
 * Move or copy a list of files/directories
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {boolean} copy Copy or move?
 */
exports.move = function(req, res, copy) {
	var pasted = []; // list of pasted files
	for (f in req.body.files) {
		f = decodeURIComponent(f);
		fs[copy?'copy':'rename'](f, req.body.files[f], function(e) { // do correct operation on file
			pasted.push(e?null:req.body.files[f]); // when done, add to list of pasted
			done();
		});
	}
	function done() {
		if (pasted.length===Object.keys(req.body.files).length) {
			res.send(obj.filter(pasted,true)); // remove null entries
		}
	}
};

exports.copy = function(req, res) {
	exports.move(req, res, true);
};

/**
 * chmod a file
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.chmod = function(req, res) {
	fs.chmod(req.body.file, req.body.mode, function(e) {
		res.send(!e);
	});
};