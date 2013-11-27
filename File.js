/**
 * @file the File class
 * @author Scimonster
 * @license {@link LICENSE} (MIT)
 * @require path
 */

var pathMod = require('path');
/**
 * Constructor for File class, containing information about a file
 * @constructor File
 * @param {Object} name
 */
function LBFile(path) {
	// default values are all null
	this.cont = null;
	this.date = null;
	this.exists = null;
	this.isLink = null;
	this.link = null;
	this.path = path; // except path
	this.perm = null;
	this.readable = null;
	this.size = null;
	this.stat = null;
	this.type = null;
	this.writable = null;

	// if we were passed an object, so give us its info
	if (typeof path==='object') {
		for (key in path) {
			this[key] = path[key];
		}
	}
	
	// some path info
	this.path = pathMod.normalize(this.path);
	this.name = pathMod.basename(this.path);
	this.dir = pathMod.dirname(this.path);
	this.ext = pathMod.extname(this.path);
	
	// make this.date a proper Date object
	this.date = new Date(this.date);
}

LBFile.prototype.addSlashIfNeeded = function() {
	return LBFile.addSlashIfNeeded(this.path);
};

LBFile.prototype.filesizeFormatted = function() {
	var size = this.size,
	units = ['','K','M','G','T','P','E','Z','Y'],
	power = size>0 ? Math.floor(Math.log(size)/Math.log(1024)) : 0;
	return (numberFormat(size/Math.pow(1024,power),2,'.',',')+' '+units[power]+'B').replace('.00 B',' B');

	// http://phpjs.org/functions/number_format/
	function numberFormat(number,decimals,dec_point,thousands_sep){number=(number+'').replace(/[^0-9+\-Ee.]/g,'');var n=!isFinite(+number)?0:+number,prec=!isFinite(+decimals)?0:Math.abs(decimals),sep=(typeof thousands_sep==='undefined')?',':thousands_sep,dec=(typeof dec_point==='undefined')?'.':dec_point,s='',toFixedFix=function(n,prec){var k=Math.pow(10,prec);return''+Math.round(n*k)/k;};s=(prec?toFixedFix(n,prec):''+Math.round(n)).split('.');if(s[0].length>3){s[0]=s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g,sep);}if((s[1]||'').length<prec){s[1]=s[1]||'';s[1]+=new Array(prec-s[1].length+1).join('0');}return s.join(dec);}
};

LBFile.prototype.permsFormatted = function() {
	var permsReadable = '';
	perms = this.perm.split('');
	if (perms.length==4) {perms.shift()}
	perms.forEach(function(p) {
		var permsBin = parseInt(p,8).toString(2).split('');
		permsReadable += (permsBin[0]=='1'?'r':'-') + (permsBin[1]=='1'?'w':'-') + (permsBin[2]=='1'?'x':'-');
	});
	return permsReadable;
};

LBFile.prototype.dateFormatted = function(table) {
	function getFullMonthName(date) {
		if (date instanceof Date) {
			switch (date.getMonth()) {
				case 0: return "January"; break;
				case 1: return "February"; break;
				case 2: return "March"; break;
				case 3: return "April"; break;
				case 4: return "May"; break;
				case 5: return "June"; break;
				case 6: return "July"; break;
				case 7: return "August"; break;
				case 8: return "September"; break;
				case 9: return "October"; break;
				case 10: return "November"; break;
				case 11: return "December"; break;
			}
		}
	}
	function padNum(n) {n=n.toString();return n.length==1?'0'+n:n}
	return table?
		getFullMonthName(this.date)+' '+this.date.getDate()+' '+this.date.getFullYear()+' '+padNum(this.date.getHours())+':'
			+padNum(this.date.getMinutes())+':'+padNum(this.date.getSeconds())
		:padNum(this.date.getMonth()+1)+'-'+this.date.getDate()+'-'+this.date.getFullYear().toString(10).slice(2)
			+' '+padNum(this.date.getHours())+':'+padNum(this.date.getMinutes());
}

LBFile.addSlashIfNeeded = function(f) {
	// This function adds a slash to a directory name if necessary
	
	return f.substr(-1)=='/'?f:f+'/';
};

module.exports = LBFile;