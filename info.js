/**
 * @file Exports info functions
 * @author Scimonster
 * @license {@link LICENSE} (MIT)
 * @require fs-extra
 * @require public/js/fileOps.js
 * @module info
 */

var fs = require('fs-extra'),
	fileOps = require('./public/js/fileOps.js');

/** @var {object} info.master */
exports.master = {
	/**
	 * Intercepts GET requests
	 * @param {Object} req Express request object
	 * @param {Object} res Express response object
	 */
	get: function(req, res){
		req.file = req.path.substr(req.path.indexOf('/',6));
		exports.master.all(req,res);
	},
	/**
	 * Intercepts POST requests
	 * @param {Object} req Express request object
	 * @param {Object} res Express response object
	 */
	post: function(req, res){
		req.file = req.body.file;
		exports.master.all(req,res);
	},
	/**
	 * Run action after pre-parsing
	 * @param {Object} req Express request object
	 * @param {Object} res Express response object
	 */
	all: function(req, res) {
		req.file = decodeURIComponent(req.file);
		exports[req.params.action](req, res);
	}
};

/**
 * Check if file exists
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.exists = function(req, res) {
	fs.exists(req.file,function(e) {
		res.send(e);
	});
};

/**
 * Check if a file is readable, writable, or executable
 * @param {string} file The filename to check
 * @param {number} type 0 - read, 1 - write, 2 - exec
 * @param {function} cb Callback to execute upon finish. Takes 1 parameter: return value {boolean}
 * @param {fs.Stats} [s] Optional stat to used; defaults to stat of file
 */
function perms(file, type, cb, s) {
	// type is 0 - read, 1 - write, 2 - exec
	if (s) {
		run(s);
	} else {
		fs.stat(file, function (err, stat) {
			if (err) {cb(false)}
			run(stat);
		});
	}
	function pad(strNum, count) {
		// pad a number to a specified length
		strNum = strNum.toString();
		if (strNum.length==count) {return strNum}
		else {return pad('0'+strNum,count)}
	}
	function run(stat) {
		var mode = stat.mode.toString(8).split('').map(function(m){return pad(parseInt(m).toString(2),3)});
		cb(!!(
			parseInt(mode[4][type])
			|| (parseInt(mode[2][type]) && process.getuid() === stat.uid)
			|| (parseInt(mode[3][type]) && process.getgid() === stat.gid)));
	}
}

/**
 * Check if file is writable
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.writable = function(req, res) {
	perms(req.file,1,function(w) {
		res.send(w);
	});
};

/**
 * Check if file is readable
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.readable = function(req, res) {
	perms(req.file,0,function(r){
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
function info(file,cb,content,stat){
	var i = {name: file};
	fs.exists(file,function(e){
		i.exists = e;
		if (!e) {
			cb(i);
			return;
		}
		fs.stat(file,function(e,s){
			if (stat) {
				i.stat = s;
			}
			perms(file,1,function(w){
				i.writable = w;
				finished();
			},s);
			perms(file,0,function(r){
				i.readable = r;
				fs.lstat(file,function(e,ls){
					i.isLink = ls.isSymbolicLink();
					if (i.isLink) {
						fs.readlink(file,function(e,l){
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
						fs.readFile(file,'utf8',function(f_e,f){
							i.cont = e?null:f;
							finished();
						});
					}
					var mmm = require('mmmagic'), magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE);
					magic.detectFile(file,function(m_e,m_type){
						if (m_e) { // Magic error, use lazy checking
							i.type = require('mime').lookup(file);
						} else {
							i.type = m_type;
						}
						finished();
					});
					i.size = s.size;
				} else if (r) { // is dir
					fs.readdir(file,function(d_e,d){
						i.size = d.length;
						finished();
					});
				} else {
					i.size = null;
				}
				finished();
			},s);
			i.date = s.mtime;
			i.perm = parseInt(s.mode.toString(8),10).toString(10).substr(2);
			finished();
		});
	});
	/**
	 * Executes the callback function if all asynchronous actions have completed
	 */
	function finished(){
		if (
			typeof i.writable !== 'undefined' &&
			typeof i.readable !== 'undefined' &&
			typeof i.date !== 'undefined' &&
			typeof i.size !== 'undefined' &&
			typeof i.date !== 'undefined' &&
			typeof i.perm !== 'undefined' &&
			typeof i.type !== 'undefined' && i.type !== '' &&
			typeof i.isLink !== 'undefined' && (!i.isLink || typeof i.link !== 'undefined') &&
			(content && i.type!='directory'?typeof i.cont !== 'undefined':true) &&
			(stat?typeof i.stat !== 'undefined':true)) {
			cb(i);
		}
	}
}

/**
 * Print results of {@link module:info.funcs~info info}
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.info = function(req, res) {
	var content = req.body && req.body.content, stat = req.body && req.body.stat;
	info(
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
exports.infoDate = function(req, res) {
	fs.stat(req.file,function(e,s){
		res.send((e?0:s.mtime.getTime()/1000).toString(10));
	});
};
exports['info.date'] = exports.infoDate;

/**
 * Send a file with correct headers
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.echo = function(req, res) {
	res.sendfile(req.file);
};

/**
 * Does a filepath refer to a directory?
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.isDir = function(req, res) {
	fs.stat(req.file,function(e,s){
		res.send(e?false:s.isDirectory());
	});
};

/**
 * List info for files in array
 * @param {Array} files Files to get info for
 * @param {function} cb Callback function. Takes 1 parameter: Array of info
 * @param {boolean} [content=false] Same as {@code cont} parameter to {@link module:info~info info}
 */
function fileListInfo(files,cb,content) {
	var fileList = [];
	files.forEach(function(f){
		info(f,function(i){
			fileList.push(i);
			finished();
		},content);
	});
	function finished(){
		if (files.length===fileList.length) {
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
function dir(files,cb,cont) {
	if (typeof files==='string') {
		fs.readdir(files,function(e,d){
			if (e) {
				cb({error: e.code==='EACCES'?'perms':'exist'});
			} else {
				files = d.map(function(f){return fileOps.addSlashIfNeeded(files)+f});
				run();
			}
		});
	} else {
		run();
	}
	function run() {
		fileListInfo(files,function(files){
			files.forEach(function(i){
				i.name = fileOps.getFileName(i.name);
			});
			cb(files);
		},cont);
	}
}

/**
 * Web abstraction to {@link module:info~dir dir} function
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.dir = function(req, res) {
	var content = req.body.cont=="true", simple = req.body.simple=="true";
	fs.readdir(req.file,function(e,d){
		if (e) {
			res.send({error: e.code==='EACCES'?'perms':'exist'});
		} else if (simple) {
			res.send(d);
		} else {
			dir(d.map(function(f){return fileOps.addSlashIfNeeded(req.file)+f}),function(files){res.send(files)},content);
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
function dirSize(dir, depth, cb) {
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
					_results = [];
					for (_i = 0, _len = files.length; _i < _len; _i++) {
						file = files[_i];
						_results.push(again(fileOps.addSlashIfNeeded(current_dir)+file,depth-1));
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
	};
	again(dir,depth);
};

/**
 * Web abstraction of {@link module:info~dirSize dirSize}
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.dirSize = function(req, res) {
	var depth = (req.body && req.body.depth) || 3;
	dirSize(req.file,depth===0?Infinity:depth,function(s){res.send(s.toString())})
};

/**
 * Send current work directory
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
exports.localbrowseCWD = function(req, res){
	res.send(process.env.PWD);
};

/**
 * A way to access internals
 * @property {function} info         Internal {@link module:info~info info} function
 * @property {function} dirSize      Internal {@link module:info~dirSize dirSize} function
 * @property {function} fileListInfo Internal {@link module:info~fileListInfo fileListInfo} function
 * @property {function} perms        Internal {@link module:info~perms perms} function
 * @property {function} dir          Internal {@link module:info~dir dir} function
 */
exports.funcs = {
	info: info,
	dirSize: dirSize,
	fileListInfo: fileListInfo,
	perms: perms,
	dir: dir
};
