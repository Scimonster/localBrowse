/**
 * @file Exports info functions
 * @author Scimonster
 * @license {@link LICENSE} (AGPL)
 * @require fs-extra
 * @require ./File.js
 * @require path
 * @module info
 */

var fs     = require('fs-extra'),
	LBFile = require('./File.js'),
	path   = require('path'),
	spawn  = require('child_process').spawn,
	prefex = require('preffy-extend'),
	obj    = require('./Object.js');

/**
 * List of actions to run 
 */
var actions = exports.actions = {};

/**
 * Check if file exists
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
actions.exists = function(req, res) {
	fs.exists(req.file, function(e) {
		res.send(e);
	});
};

/**
 * Check if a file is readable, writable, or executable
 * @param {(string|fs.Stats)} file The filename to check, or a stat to use to check
 * @param {number} type 0 - read, 1 - write, 2 - exec
 * @param {function} cb Callback to execute upon finish. Takes 1 parameter: return value {boolean}
 */
exports.perms = function(file, type, cb) {
	if (typeof file === 'string') { // filename
		fs.stat(file, function (err, stat) {
			if (err) {cb(false)}
			run(stat);
		});
	} else { // stat
		run(file);
	}
	function pad(strNum, count) {
		// pad a number to a specified length
		strNum = strNum.toString();
		if (strNum.length==count) {return strNum}
		else {return pad('0'+strNum, count)}
	}
	function run(stat) {
		var mode = stat.mode.toString(8).split('').map(function(m){return pad(parseInt(m).toString(2), 3)}); // create padded binary representations of perms
		cb(!!(
			parseInt(mode[4][type]) || // other
			(parseInt(mode[2][type]) && process.getuid() === stat.uid) || // user
			(parseInt(mode[3][type]) && process.getgid() === stat.gid))); // group
	}
}

/**
 * Check if file is writable
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
actions.writable = function(req, res) {
	exports.perms(req.file, 1, function(w) {
		res.send(w);
	});
};

/**
 * Check if file is readable
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
actions.readable = function(req, res) {
	exports.perms(req.file, 0, function(r) {
		res.send(r);
	});
};

/**
 * Gets info about a file
 * @param {string} file Filename to get info for
 * @param {function} cb Callback function executed on finish. Takes 1 parameter: return value {object}
 * @param {boolean} [content=false] Add {@code cont} property to returned object with file contents
 * @param {fs.Stats} [stat=false] Add {@code stat} property to returned object with stat results
 */
exports.info = function(file, cb, content, stat) {
	var i = {path: path.resolve(file)}, sent = false;
	fs.exists(file, function(e) { // check existence
		i.exists = e;
		if (!e) {
			cb(new LBFile(i));
			return; // doesn't exist, so quit
		}
		fs.stat(file, function(e, s) { // get stat
			if (stat) {
				i.stat = s; // add the stat in if we want it
			}
			function passwd_err() {
				if (!i.owner) {
					i.owner = {
						id: s.uid,
						name: '',
						full: '',
						is: process.getuid() === s.uid
					};
					finished();	
				}
			}
			function group_err() {
				if (!i.group) {
					i.group = i.group || {
						id: s.gid,
						name: '',
						is: process.getgid() === s.gid
					};
					finished();
				}
			}
			try {
				var passwd = spawn('getent', ['passwd', s.uid]);
				passwd.stdout.on('data', function(data) {
					data = data.toString().split(':');
					i.owner = {
						id: s.uid,
						name: data[0],
						full: data[4],
						is: process.getuid() === s.uid
					};
					finished();
				});
				passwd.stderr.on('data', passwd_err);
				passwd.on('close', passwd_err);
			} catch(e) {
				passwd_err();
			}
			try {
				var group = spawn('getent', ['group', s.gid]);
				group.stdout.on('data', function(data) {
					data = data.toString().split(':');
					i.group = {
						id: s.gid,
						name: data[0],
						is: process.getgid() === s.gid
					};
					finished();
				});
				group.stderr.on('data', group_err);
				passwd.on('close', group_err);
			} catch(e) {
				group_err();
			}
			exports.perms(s, 1, function(w) { // writable?
				i.writable = w;
				finished();
			});
			exports.perms(s, 2, function(e) { // writable?
				i.executable = e;
				finished();
			});
			exports.perms(s, 0, function(r) { // readable?
				i.readable = r;
				fs.lstat(file, function(e, ls) { // check if it's a link
					i.isLink = ls.isSymbolicLink();
					if (i.isLink) {
						fs.readlink(file, function(e, l) {
							i.link = l;
							finished();
						});
					} else {
						finished();
					}
				});
				i.type = s.isDirectory()?'directory':'';
				if (!i.type) { // is file
					if (r && !s.isDirectory() && content) {
						fs.readFile(file,'utf8',function(f_e, f){
							i.cont = f_e?null:f;
							finished();
						});
					}
					var mmm = require('mmmagic'), magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE); // MIME checking dependencies
					magic.detectFile(file, function(m_e, m_type) {
						if (m_e || m_type=='regular file, no read permission') { // Magic error, use lazy checking
							i.type = require('mime').lookup(file);
						} else {
							i.type = m_type;
						}
						finished();
					});
					i.size = s.size;
				} else if (r) { // is dir
					fs.readdir(file, function(d_e, d) {
						i.size = s.size;
						i.items = d_e?0:d.length;
						finished();
					});
				} else {
					i.size = null;
					i.items = null;
					if (content) {
						i.cont = null;
					}
					finished();
				}
				finished();
			});
			i.date = s.mtime;
			i.perm = parseInt(s.mode.toString(8), 10).toString(10).substr(2);
			// get the value as an octal number, turn it to decimal, turn it to string, and chop off the first couple characters
			finished();
		});
		fs.realpath(file, function(rp_e, rp) {
			i.realpath = rp;
			finished();
		});
	});
	/**
	 * Executes the callback function if all asynchronous actions have completed
	 */
	function finished(){
		if (
			!sent &&
			typeof i.writable !== 'undefined' &&
			typeof i.readable !== 'undefined' &&
			typeof i.executable !== 'undefined' &&
			typeof i.date !== 'undefined' &&
			typeof i.size !== 'undefined' &&
			(i.type=='directory'?typeof i.items !== 'undefined':true) &&
			typeof i.perm !== 'undefined' &&
			typeof i.owner !== 'undefined' &&
			typeof i.group !== 'undefined' &&
			typeof i.type !== 'undefined' && i.type !== '' &&
			typeof i.isLink !== 'undefined' && (!i.isLink || typeof i.link !== 'undefined') &&
			typeof i.realpath !== 'undefined' &&
			(content && i.type!='directory'?typeof i.cont !== 'undefined':true) &&
			(stat?typeof i.stat !== 'undefined':true)
		) {
			cb(new LBFile(i));
			sent = true;
		}
	}
}

exports.info.type = function(file, cb) {
	var mmm = require('mmmagic'), magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE); // MIME checking dependencies
	magic.detectFile(file, function(m_e, m_type) {
		if (m_e || m_type=='regular file, no read permission') { // Magic error, use lazy checking
			cb(require('mime').lookup(file));
		} else {
			cb(m_type);
		}
	});
};

/**
 * Web abstraction for {@link module:info.funcs~info info}
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
actions.info = function(req, res) {
	var content = req.body && req.body.content, stat = req.body && req.body.stat;
	exports.info(
		req.file,
		function(i){res.send(i)},
		content,
		stat
	);
};

/**
 * Print modification date of file
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
actions.infoDate = function(req, res) {
	fs.stat(req.file, function(e, s){
		res.send((e?0:s.mtime.getTime()).toString(10)); // UNIX epoch offset time in ms as string, so as not to send some crazy status
	});
};
actions['info.date'] = actions.infoDate;

/**
 * Send a file with correct headers
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
actions.echo = function(req, res) {
	res.sendfile(req.file);
};

/**
 * Does a filepath refer to a directory?
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
actions.isDir = function(req, res) {
	fs.stat(req.file, function(e, s){
		res.send(e?false:s.isDirectory());
	});
};

/**
 * List info for files in array
 * @param {Array} files Files to get info for
 * @param {function} cb Callback function. Takes 1 parameter: Array of info
 * @param {boolean} [content=false] Same as {@code cont} parameter to {@link module:info~info info}
 * @todo Add CWD option to avoid hacks like used in {@link module:info~dir dir}
 */
exports.fileListInfo = function(files, cb, content, cwd) {
	cwd = cwd||'/';
	cwd = cwd.toString();
	var fileList = []; // final list, will be passed to cb once populated
	if (files.length==0) {finished()}
	files.forEach(function(f) {
		exports.info(path.join(cwd, f), function(i) { // get info on current one
			fileList.push(i);
			finished();
		},content);
	});
	function finished(){
		if (files.length===fileList.length) { // all present
			cb(fileList);
		}
	}
}

/**
 * Loads files from a directory and applies {@link module:info~fileListInfo fileListInfo} to the list
 * @param {(string|Array)} files Filename to resolve, or list of files to run on
 * @param {function} cb Callback function; takes 1 parameter: array of file infos
 * @param {boolean} [cont=false] Same as {@code cont} parameter to {@link module:info~info info}
 */
exports.dir = function(files, cb, cont, cwd) {
	if (typeof files==='string') { // filepath
		cwd = files;
		fs.readdir(cwd, function(e, d){
			if (e) {
				cb({error: e.code==='EACCES'?'perms':'exist'}); // send correct error
			} else {
				run(d);
			}
		});
	} else {
		run(files);
	}
	function run(f) {
		exports.fileListInfo(f, cb, cont, cwd);
	}
}

/**
 * Web abstraction to {@link module:info~dir dir} function
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
actions.dir = function(req, res) {
	var content = req.body.cont=="true", simple = req.body.simple=="true", dirsOnly = req.body.dirsOnly=="true";
	fs.readdir(req.file, function(e, d) {
		if (e) { // can't leave this up to dir() because then we'd have an unresolved error
			res.send({error: e.code==='EACCES'?'perms':'exist'});
		} else if (simple) {
			if (dirsOnly) {
				var files = [];
				d.forEach(function(f) {
					if (f[0]=='.') {
						files.push({name:f,dir:false});
						fin();
					} else {
						fs.stat(path.join(req.file, f), function(e, s) {
							files.push({name:f,dir:e?false:s.isDirectory()});
							fin();
						});	
					}
				});
				function fin() {
					if (files.length==d.length) {
						res.send(files.filter(function(f){return f.dir}));
					}
				}
			} else {
				res.send(d);
			}
		} else {
			exports.dir(
				d,
				function(files){res.send(files)}, // unfortunately, res.send doesn't like to be passed
				content,
				req.file);
		}
	});
};

/**
 * Get directory size to a specific depth. Source:
 * {@link http://procbits.com/2011/10/29/a-node-js-experiment-thinking-asynchronously-recursion-calculate-file-size-directory}
 * @param {string} dir Directory path
 * @param {number} depth Depth to search for
 * @param {function} cb Callback function, taking 1 parameter: size (in bytes) of the directory
 */
exports.dirSize = function(dir, depth, cb) {
	var async_running = 0, file_counter = 1, total = 0;
	function again(current_dir, depth) {
		return fs.lstat(current_dir, function(err, stat) {
			if (err) {
				file_counter--;
				return;
			}
			if (stat.isFile()) {
				file_counter--;
				total += stat.size;
			} else if (stat.isDirectory() && depth) {
				file_counter--;
				async_running++;
				fs.readdir(current_dir, function(err, files) {
					var file, _i, _len, _results;
					async_running--;
					if (err) {
						return;
					}
					file_counter += files.length;
					if (file_counter === 0 && async_running === 0) {
						cb(total);
					}
					_results = [];
					for (_i = 0, _len = files.length; _i < _len; _i++) {
						file = files[_i];
						_results.push(again(path.join(current_dir,file),depth-1));
					}
					return _results;
				});
			} else {
				file_counter--;
			}
			if (file_counter === 0 && async_running === 0) {
				cb(total);
			}
		});
	}
	again(dir,depth);
};

/**
 * Web abstraction of {@link module:info.dirSize dirSize}
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
actions.dirSize = function(req, res) {
	var depth = (req.body && req.body.depth) || 3; // get depth from POST, otherwise 3
	exports.dirSize(
		req.file,
		depth===0?Infinity:depth, // a depth of 0 means infinite depth
		function(s){res.send(s.toString())}); // again to prevent a crazy HTTP status being sent
};

/**
 * Create an object tree of current directory and children to a certain level
 * @param {string} dir Directory to search
 * @param {number} depth How far down to search (defaults to 3)
 * @param {function} cb Callback taking 1 parameter, the tree object
 */
exports.tree = function tree(dir, depth, cb) {
	if (typeof depth == 'function') {
		cb = depth;
		depth = 3;
	}
	fs.readdir(dir, function(e, d) {
		if (e) {
			cb({});
			return;
		}
		var files = {}, async = d.length;
		function stat(f, i) {
			fs.stat(path.join(dir, f), function(e, s) {
				files[f] = e?false:s.isDirectory();
				if (files[f] && depth-1) {
					tree(path.join(dir, f), depth-1, function(t) {
						files[f] = t;
						async--;
						fin();
					});
				} else {
					async--;
					fin();
				}
			});
		}
		function fin() {
			if (!async) {
				cb(files);
			}
		}
		d.forEach(stat);
	});
};

/**
 * Web abstraction of {@link module:info.tree tree}
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
actions.tree = function(req, res) {
	var depth = (req.body && req.body.depth) || 3; // get depth from POST, otherwise 3
	exports.tree(
		req.file,
		depth===0?Infinity:depth, // a depth of 0 means infinite depth
		function(s){res.send(s)});
};

/**
 * Create an object tree of current directories and parents
 * @param {string,array} dir Director(y/ies) to search
 * @param {function} cb Callback taking 1 parameter, the tree object
 */
exports.treeParents = function treeParents(dir, cb) {
	if (typeof dir == 'string') {
		dir = [dir];
	}
	if (!Array.isArray(dir)) {
		throw new Error('non-array given to info.tree');
	}
	dir = dir.map(function(d){return path.resolve(d)});
	var ret = [];
	dir.forEach(function(d){
		exports.tree(d, 1, function(t) {
			if (d=='/') {
				cb(t);
			} else {
				treeParents(path.dirname(d), function(tp) {
					obj.filter(path.dirname(d).split('/'), true).reduce(function(o,n){return o[n]},tp)[path.basename(d)] = t;
					ret.push(tp);
					if (ret.length==dir.length) {
						cb(prefex.apply(null, [['object'], true, {}].concat(ret)));
					}
				});	
			}
		});
	});
};

/**
 * Web abstraction of {@link module:info.treeParents treeParents}
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
actions.treeParents = function(req, res) {
	exports.treeParents(
		req.file,
		function(s){res.send(s)});
};