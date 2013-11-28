// Contains functions used both by the client and server for fixing up filenames and the like

function getParentDir(f) {
	// This function gets the containing directory of a file/dir.

	if (!f) {f = file}
	return f.replace(/\/$/,'').split('/').slice(0,-1).join('/')+'/'||'/';
}

function getFileName(f) {
	// This function gets the filename without the whole path of a file/dir.

	return f.replace(/\/$/,'').split('/').reverse()[0]||'/';
}

function addSlashIfNeeded(f) {
	// This function adds a slash to a directory name if necessary
	
	return f.substr(-1)=='/'?f:f+'/';
}

function filesizeFormatted(size) {
	units = ['','K','M','G','T','P','E','Z','Y'];
	power = size>0 ? Math.floor(Math.log(size)/Math.log(1024)) : 0;
	return (numberFormat(size/Math.pow(1024,power),2,'.',',')+' '+units[power]+'B').replace('.00 B',' B');
}

// http://phpjs.org/functions/number_format/
function numberFormat(number,decimals,dec_point,thousands_sep){number=(number+'').replace(/[^0-9+\-Ee.]/g,'');var n=!isFinite(+number)?0:+number,prec=!isFinite(+decimals)?0:Math.abs(decimals),sep=(typeof thousands_sep==='undefined')?',':thousands_sep,dec=(typeof dec_point==='undefined')?'.':dec_point,s='',toFixedFix=function(n,prec){var k=Math.pow(10,prec);return''+Math.round(n*k)/k;};s=(prec?toFixedFix(n,prec):''+Math.round(n)).split('.');if(s[0].length>3){s[0]=s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g,sep);}if((s[1]||'').length<prec){s[1]=s[1]||'';s[1]+=new Array(prec-s[1].length+1).join('0');}return s.join(dec);}

function padNum(n){n=n.toString();return n.length==1?'0'+n:n}

function permsFormatted(perms) {
	var permsReadable = '';
	perms = perms.split('');
	if (perms.length==4) {perms.shift()}
	perms.forEach(function(p) {
		var permsBin = parseInt(p,8).toString(2).split('');
		permsReadable += (permsBin[0]=='1'?'r':'-') + (permsBin[1]=='1'?'w':'-') + (permsBin[2]=='1'?'x':'-');
	});
	return permsReadable;
}

function dateFormat(d,table) {
	D = new Date(d*1000);
	return table?crit.dateGetFullMonthName(D)+' '+D.getDate()+' '+D.getFullYear()+' '+padNum(D.getHours())+':'+padNum(D.getMinutes())+':'+padNum(D.getSeconds()):padNum(D.getMonth()+1)+'-'+D.getDate()+'-'+D.getFullYear().toString(10).slice(2)+' '+padNum(D.getHours())+':'+padNum(D.getMinutes());
}

if (typeof window=='undefined') { // Node doesn't have window
	module.exports = {
		getParentDir: getParentDir,
		getFileName: getFileName,
		addSlashIfNeeded: addSlashIfNeeded,
		filesizeFormatted: filesizeFormatted,
		numberFormat: numberFormat,
		padNum: padNum,
		permsFormatted: permsFormatted,
		dateFormat: dateFormat
	};
}