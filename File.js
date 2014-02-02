/**
 * @file The LBFile class, containing information and methods about a localBrowse file
 * @author Scimonster
 * @license {@link LICENSE} (AGPL)
 * @require path
 * @require extend
 */

var pathMod = require('path'),
	extend = require('extend');

if (!Array.of) {
	Array.of = function () {
		return Array.prototype.slice.call(arguments);
	};
}
/**
 * Constructor for LBFile class, containing information about a file
 * @constructor
 * @param {(String|Object)} path
 */
function LBFile(path) {
	// default values are all null
	this.cont = null;
	this.date = null;
	this.executable = false;
	this.exists = false;
	this.group = {
		is: false
	};
	this.isLink = false;
	this.items = null;
	this.link = null;
	this.owner = {
		is: false
	};
	this.parentWritable = false;
	this.path = path; // except path
	this.perm = '0000',
	this.readable = false;
	this.realpath = path.path || path;
	this.size = 0;
	this.stat = {};
	this.type = null;
	this.writable = false;

	// if we were passed an object, so give us its info
	if (typeof path === 'object') {
		extend(this, path);
	}
	if (typeof this.path !== 'string') {
		this.path = '/';
	}

	// some path info
	this.path = pathMod.normalize(this.path);
	this.name = pathMod.basename(this.path);
	this.dir = LBFile.addSlashIfNeeded(pathMod.dirname(this.path));
	this.ext = pathMod.extname(this.path).substr(1);

	// make this.date a proper Date object
	this.date = new Date(this.date);
}

LBFile.prototype.update = function (path) {
	this.path = pathMod.normalize(path);
	this.name = pathMod.basename(this.path);
	this.dir = LBFile.addSlashIfNeeded(pathMod.dirname(this.path));
	this.ext = pathMod.extname(this.path);
};

/**
 * Return the full path with a slash at the end
 * @return {string}
 */
LBFile.prototype.addSlashIfNeeded = function () {
	return LBFile.addSlashIfNeeded(this.path);
};

/**
 * Return the human-readable filesize
 * @return {string}
 */
LBFile.prototype.filesizeFormatted = function () {
	var size = this.size,
		units = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'],
		power = size > 0 ? Math.floor(Math.log(size) / Math.log(1024)) : 0;
	return (numberFormat(size / Math.pow(1024, power), 2, '.', ',') + ' ' + units[power] + 'B').replace('.00 B', ' B');

	// http://phpjs.org/functions/number_format/
	function numberFormat(number, decimals, dec_point, thousands_sep) {
		number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
		var n = !isFinite(+number) ? 0 : +number,
			prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
			sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
			dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
			s = '',
			toFixedFix = function (n, prec) {
				var k = Math.pow(10, prec);
				return '' + Math.round(n * k) / k;
			};
		s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
		if (s[0].length > 3) {
			s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
		}
		if ((s[1] || '').length < prec) {
			s[1] = s[1] || '';
			s[1] += new Array(prec - s[1].length + 1).join('0');
		}
		return s.join(dec);
	}
};

/**
 * Return the UNIX-hacker-readable permission string
 * @return {string}
 */
LBFile.prototype.permsFormatted = function () {
	var perms = this.perm.split('');
	if (perms.length == 4) {
		perms.shift();
	}
	return perms.map(function (p) {
		var permsBin = parseInt(p, 8).toString(2);
		return (permsBin[0] == '1' ? 'r' : '-') + (permsBin[1] == '1' ? 'w' : '-') + (permsBin[2] == '1' ? 'x' : '-');
	}).join('');
};

/**
 * Message name of our access level
 * Should be passed to message function
 * @return {string}
 */
LBFile.prototype.permsMessage = function () {
	var perms = this.perm.split('');
	if (perms.length == 4) {
		perms.shift();
	}
	return 'perms-' + (this.type == 'directory' ? 'dir-' : '') + perms[this.owner.is ? 0 : this.group.is ? 1 : 2];
};

/**
 * Return the modification date after formatting
 * @param {boolean} long Use the long form?
 * @return {string}
 */
LBFile.prototype.dateFormatted = function (l) {
	function getFullMonthName(date) {
		if (date instanceof Date) {
			switch (date.getMonth()) {
				case 0:
					return "January";
				case 1:
					return "February";
				case 2:
					return "March";
				case 3:
					return "April";
				case 4:
					return "May";
				case 5:
					return "June";
				case 6:
					return "July";
				case 7:
					return "August";
				case 8:
					return "September";
				case 9:
					return "October";
				case 10:
					return "November";
				case 11:
					return "December";
			}
		}
		return null;
	}

	function padNum(n) {
		n = n.toString();
		return n.length == 1 ? '0' + n : n;
	}
	return l ? getFullMonthName(this.date) + ' ' + this.date.getDate() + ' ' + this.date.getFullYear() + ' ' + padNum(this.date.getHours()) + ':' + padNum(this.date.getMinutes()) + ':' + padNum(this.date.getSeconds()) : padNum(this.date.getMonth() + 1) + '-' + this.date.getDate() + '-' + this.date.getFullYear().toString(10).slice(2) + ' ' + padNum(this.date.getHours()) + ':' + padNum(this.date.getMinutes());
};

/**
 * Add a slash to a directory name if necessary
 * @param {string} f Directory name
 * @return {string}
 */
LBFile.addSlashIfNeeded = function (f) {
	return f.substr(-1) == '/' ? f : f + '/';
};

/**
 * Remove a trailing slash from a path
 * @param {string} f Directory name
 * @return {string}
 */
LBFile.removeSlashIfNeeded = function (f) {
	return f.substr(-1) == '/' ? f.slice(0, -1) : f;
};

LBFile.path = pathMod;

LBFile.FileList = function (list) {
	list = list.map(function (f) {
		return new LBFile(f);
	});
	extend(this, list);
	this.length = list.length;

	LBFile.call(this, {
		exists: list.every(function (f) {
			return f.exists;
		}),
		executable: list.every(function (f) {
			return f.executable;
		}),
		readable: list.every(function (f) {
			return f.readable;
		}),
		writable: list.every(function (f) {
			return f.writable;
		}),
		parentWritable: list.every(function (f) {
			return f.parentWritable;
		}),

		path: list.map(function (f) {
			return f.path;
		}).join(pathMod.delimiter),
		realpath: list.map(function (f) {
			return f.realpath;
		}).join(pathMod.delimiter),

		date: list.reduce(function (one, two) {
			return one.date < two.date ? two.date : one.date;
		}),
		perm: list.reduce(function (one, two) {
			return '0' + (one.perm[1] < two.perm[1] ? one : two).perm[1] + (one.perm[2] < two.perm[2] ? one : two).perm[2] + (one.perm[3] < two.perm[3] ? one : two).perm[3];
		}),

		owner: list.every(function (f) {
			return f.owner.name == list[0].owner.name;
		}) ? list[0].owner : undefined,
		group: list.every(function (f) {
			return f.group.name == list[0].group.name;
		}) ? list[0].group : undefined,

		type: list.every(function (f) {
			return f.type == list[0].type;
		}) ? list[0].type : list.every(function (f) {
			return f.type.split('/')[0] == list[0].type.split('/')[0];
		}) ? list[0].type.split('/')[0] + '/*' : undefined,

		size: list.reduce(function (one, two) {
			return one.size + two.size;
		})
	});

	this.name = this.ext = '';
	this.dir = LBFile.FileList.deepestCommonParent(this.path.split(pathMod.delimiter));
};

LBFile.FileList.deepestCommonParent = function dcp() {
	var paths = prepare(Array.of.apply(null, Array.isArray(arguments[0]) ? arguments[0] : arguments).map(function (p) {
		return LBFile.removeSlashIfNeeded(p).split(pathMod.sep);
	}));

	function prepare(paths) {
		var least = paths.reduce(function (sh, val) {
			return val.length < sh ? val.length : sh;
		}, paths[0].length);

		return paths.map(function (p) {
			return p.slice(0, least);
		});
	}

	return paths.every(function (p) {
		return p[p.length - 1] == paths[0][paths[0].length - 1];
	}) ? LBFile.addSlashIfNeeded(paths[0].join(pathMod.sep)) : dcp.apply(null, paths.map(function (p) {
		return p.slice(0, -1).join(pathMod.sep);
	}));
};

LBFile.FileList.prototype = Object.create(LBFile.prototype);

LBFile.FileList.prototype.map = Array.prototype.map;
LBFile.FileList.prototype.filter = Array.prototype.filter;
LBFile.FileList.prototype.forEach = Array.prototype.forEach;

LBFile.FileList.prototype.array = function () {
	return this.map(function (f) {
		return f;
	});
};

LBFile.FileList.prototype.paths = function () {
	return this.map(function (f) {
		return f.path;
	});
};

module.exports = LBFile;