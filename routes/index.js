
/*
 * GET home page.
 */

exports.index = function(req, res){
	res.render('index', {
		sidebar: [
			{name:'Home',icon:'home',url:'~/'},
			{name:'Documents',icon:'document',url:'~/Document/'},
			{name:'Downloads',icon:'arrowthick-1-s',url:'~/Downloads/'},
			{name:'Music',icon:null,url:'~/Music/',span:"span(style='display: inline-block;') ♫"},
			{name:'Pictures',icon:'image',url:'~/Pictures/'},
			{name:'Videos',icon:'video',url:'~/Videos/'},
			{name:'Root',icon:'disk',url:'/'},
			{name:'Recent',icon:'clock',url:'~/.local/share/recently-used.xbel'},
			{name:'Trash',icon:'trash',url:'~/Trash/'}
		],
		username: process.env.USERNAME,
		homeroot: process.env.HOME,
	});
};
console.log(process.env)
