var
	w = window, // shortcuts
	d = document,
	bytes = 0, requests = 0, // development - bytes transferred
	s = { // settings
		sortby: 'name', // in directory list view, sort by this
		asec: true, // show in ascending order
		dirFirst: true, // show directories first
		hidden: true, // hide hidden files
		restricted: true, // hide restricted files
		dirTiles: true, // show directories as tiles
		expandHomeroot: false // in trash and search view, replace ~ with the home directory's path
	},
	file, // an LBFile of the current file
	type, // dir, trash, search, file
	bookmarks, // array of bookmarks
	iconset = [], // deprecated, probably
	toPaste = {}, // fromPath=>toPath
	LBFile = require('./File.js'), // LBFile class, containing file methods
	obj = require('./Object.js'); // object helpers
$.get('/info/localbrowseCWD',function(cwd){getDirContents(cwd+'/public/img/fatcow/16x16',{cont:false,simple:true},function(i){iconset = i().get()})});

LBFile.prototype.resolve = function() {
	// Get a full absolute path from a URL-path
	
	return this.path.replace(/^trash/,'~/.local/share/Trash/files').replace(/^~/,homeroot);
};

LBFile.prototype.relative = function() {
	// Get a URL-path from a full path
	
	return this.path.replace('/^~\/\.local\/share\/Trash\/files/','trash').replace(/^~/,homeroot);
};

function load() {
	// This function runs when a new file/dir is loaded, and at startup.

	// Start by identifying the file.
	file = new LBFile(location.hash.substr(1));
	if (location.hash.substr(1)=='') { // nothing was specified, so use homedir
		file = new LBFile(LBFile.addSlashIfNeeded(homeroot));
	}
	if (file.path !== location.hash.substr(1)) { // it was normalized
		location.hash = file.path;
		return;
	}

	cd(file.path, function(){
		d.title = _('title', file.name);
		if (type=='trash') {
			// If it's the trash, load it
			getDirContents('~/.local/share/Trash/files',listTrash);
		} else if (type=='search') {
			// Load search
			search(location.hash.substr(8));
		} else {
			// If it's a file or dir, load it
			if (getUrlVars(location.search).program) { // a program was set via URL
				loadProgram(getUrlVars(location.search).program);
			} else {
				viewFile();
			}
			if (location.search) { // we've done what's needed, now clear it
				history.replaceState(null, document.title, '/'+location.hash);
			}
		}
	});
}

function cd(loc, cb) {
	// Go to a specific file/dir

	if (loc=='..') {
		loc = file.dir;
	}
	file = new LBFile(loc);
	if (file.path !== location.hash.substr(1)) { // it was normalized
		noload = true;
		location.hash = file.path;
	}
	// Find out if it's a file or dir.
	type = /^search/.test(loc) ? 'search' : (loc=='trash' ? 'trash' : '');
	// first test if it's search, then trash, otherwise leave it for later
	if (!type) { 
		$.getJSON('info/info'+file.resolve(),function(f){
			file = new LBFile(f);
			if (loc=='/') {file.name = _('path-root')}
			type = f.type;
			finishLoading();
		});
	} else {
		file = new LBFile(f);
		finishLoading();
	}

	function finishLoading() {
		// Display AJAX loading circle
		$('<div id="ajax-loader"><img src="img/ajax-loader.gif">').appendTo('#content');
		$('table').menu('destroy');
		$('#file').removeData().remove();
		$('#toolbar-left').html('');
		$('#new').show();
		if (typeof cb == 'function') {cb();}
		// Create the pathbar
		pathbar(file.path, '#filepath', 53);
		if (type !== 'directory') {
			$('#filepath a:last').attr('href',function(i,old){return old.slice(0,-1)});
		}
	}
}

function pathbar(path, element, height) {
	// Create a pathbar of a certain filepath

	path = path.split('/'), parts = [];
	if (path[path.length-1]=='') {path.pop()}
	$(element).buttonset('destroy');
	$(element).html('');
	if (!path[0]) {
		$(element).append('<a href="#/">/</a>');
		path = path.slice(1);
	}
	path.forEach(function(par) {
		parts[parts.length] = par;
		$(element).append('<a href="#/'+parts.join('/')+'/">'+par+'</a>');
	});
	$(element).buttonset();
	var i=0;
	while ($(element).height()>height) {
		parts=path.slice(0,i+1);
		i++;
		$(element).buttonset('destroy');
		$(element).html('');
		$(element).append('<a>...</a>');
		path.slice(i).forEach(function(par) {
			parts[parts.length] = par;
			$(element).append('<a href="#/'+parts.join('/')+'/">'+par+'</a>');
		});
		$(element).buttonset();
	}
}

function search(term) {
	// This function loads and displays search results

	if (typeof cwd == "undefined") {cwd = homeroot}
	$('<div id="ajax-loader"><img src="img/ajax-loader.gif">').appendTo('#content');
	$.post('/search','term='+encodeURIComponent(term)+'&cwd='+encodeURIComponent(cwd),function(results){
		listDir(TAFFY(results));
		$('#ajax-loader').remove();
	});
}

function copy(files,cut) {
	// Replaces the copy buffer with the specified files. Optionally removes them upon paste.

	// set up files as an array
	if ($.isJQuery(files)) {
		files = files.map(function(){return $(this).data('path')}).get();
	} else if (typeof files==="string") {
		files = files.split('\n');
	}
	sessionStorage.setItem('copy',files.join('\n'));
	sessionStorage.setItem('cut',!!cut);
	toPaste = {};
	return files.join('\n');
}

function paste(files,destination) {
	// Reads files from the copy buffer and copies them to the CWD

	files = files || sessionStorage.getItem('copy').split('\n');
	destination = destination || file.path;
	function run(files,destination,cb) { // recursive function to paste all files and dirs
		var recurse = 0; // recursion depth
		$.each(files, function(i, srcFile){
			$.get('info/info'+srcFile,function(src){
				src = new LBFile(src);
				if (src.readable) {
					$.get('info/info'+LBFile.addSlashIfNeeded(destination)+src.name,function(dest){
						dest = new LBFile(dest);
						// we now have info on the source and destination files
						if (dest.exists) { // we'll need to overwrite/merge
							recurse++; // starting an async operation
							function dataForFile(f,replace){
								return '<div class="fileOverwriteDialog-fileInfo"><img src="'+imageForFile(f,true)+'"/><p>' +
									(f.type==='directory'?
										('<b>'+_(replace?'paste-fileinfo-rfolder':'paste-fileinfo-efolder')+'</b><br/>'+
											_('paste-fileinfo-size',_('dirlist-filesize-items',f.items))):
										('<b>'+_(replace?'paste-fileinfo-rfile':'paste-fileinfo-efile')+'</b><br/>'+
											_('paste-fileinfo-size',f.filesizeFormatted()))) +
									'<br/>'+_('paste-fileinfo-date',f.dateFormatted())+'</p></div>';
							};
							if (dest.type=='directory' && src.type=='directory') { // merge
								$.post('info/dir','simple=true&file='+dest.dir,function(otherfiles){
								// other files in dest dir, to see if it will be overwritten
									var d = jqUI.prompt({
										title:_('paste-merge-title',src.name),
										text:
											'<div>'+
											_(src.date<dest.date?'paste-merge-body-newer':'paste-merge-body-older',(new LBFile(dest.dir)).name)+
											'</div>'+
											dataForFile(src,true)+
											dataForFile(dest,false)+
											'<p>'+
											_('paste-merge-body-newname')+
											'</p><p class="fileOverwriteDialog-exists">'+
											_('paste-merge-body-newname-exists')+
											'</p>',
										buttonLabel: _('paste-buttons'),
										width: 500
									},src.name,function(newname){
										if (newname) { // will be null if skip was clicked
											if (otherfiles.indexOf(newname)>-1) { // merge
												recurse++; // more async
												$.post('info/dir','simple=true&file='+src.path,function(children){
													run(children.map(function(item){return src.addSlashIfNeeded()+item}),dest.dir+newname,function(){
														recurse--; // async finished
														done(); // check for completeness
													});
												});
											} else { // name changed
												toPaste[srcFile] = dest.dir+newname;
											}
										}
										recurse--; // async finished
										done();
									});
								});
							} else { // overwrite
								$.post('info/dir','simple=true&file='+dest.dir,function(otherfiles){
								// other files in dest dir, to see if it will be overwritten
									var d = jqUI.prompt({
										title:_('paste-oberwrite-title',s.name),
										text:
											'<div>'+
											_(src.date<dest.date?'paste-overwrite-body-newer':'paste-overwrite-body-older',(new LBFile(dest.dir)).name)+
											'</div>'+
											dataForFile(src,true)+
											dataForFile(dest,false)+
											'<p>'+
											_('paste-overwrite-body-newname')+
											'</p><p class="fileOverwriteDialog-exists">'+
											_('paste-merge-body-newname-exists')+
											'</p>',
										buttonLabel: _('paste-buttons'),
										width: 500
									},src.name,function(newname){
										if (newname) { // will be null if skip was clicked
											toPaste[srcFile] = dest.dir+newname;
										}
										recurse--;
										done();
									});
								});
							}
						} else { // dest doesn't exist, everything's ok
							toPaste[srcFile] = dest.path;
						}
						done();
					});
				}
			});
		});
		function done(){
			if (recurse===0) {cb()}
		}
	}
	run(files,destination,function(){
		$.post('/mod',{action:(sessionStorage.getItem('cut')==="true"?'move':'copy'),files:toPaste},function(pasted){
			pasted = pasted.filter(function(item){return (new LBFile(item)).dir===file.addSlashIfNeeded()}); // in this dir
			$('.file').removeClass('sel last').filter(function(){
				return pasted.indexOf($(this).data('path'))>-1;
			}).addClass('sel').last().addClass('last');
		});
	});
}

function loadBookmarks() {
	// This function lists current bookmarks
	
	if (localStorage.getItem('bookmarks')) {bookmarks=JSON.parse(localStorage.getItem('bookmarks'))}
	else {localStorage.setItem('bookmarks','[]')}
	$('#sidebar-bookmarks').html('');
	$.each(bookmarks, function(i, b) {
		$('#sidebar-bookmarks').append(
			'<li><a href="#'+b[0]+'" title="'+b[0]+'">'+
			'<span class="ui-icon ui-icon-'+(b[1]=='directory'?'folder-collapsed':'document')+'"></span>'+
			(new LBFile(b[0])).name+'</a>'+
			'<span class="ui-icon ui-icon-squaresmall-close" title="'+_('index-loc-bookmarks-remove')+'" data-index="'+i+'"></span>'+
			'</li>');
	});
}

function addBookmark() {
	// This function will add a bookmark to the list
	
	if (bookmarks.indexOf(file.path)+1) {return}
	bookmarks.push([file.path,file.type]);
	localStorage.setItem('bookmarks',JSON.stringify(bookmarks));
	loadBookmarks();
	$('#message').data('old',$('#message').html());
	$('#message').html(_('messages-bookmarkadded'));
	setTimeout(function(){
		$('#message').html($('#message').data('old'));
		$('#message').removeData('old');
	},1500);
}

function sidebarTree(f) {
	// This function creates the tree in the sidebar

	$.post('/info/treeParents',{file:f},function(tree){
		$('#sidebar-tree li').remove(); // remove all past ones
		tree = (function m(t){
			return obj.map(obj.filter(obj.filter(t,true),function(v,k){
				return /^[^\.]/.test(k);
			}),function(v){
				return typeof v=='object'?m(v):v;
			});
		})(tree);
		$('#sidebar-tree>ul').html((function m(t,k){
			var a = '';
			obj.foreach(t,function(v,i){
				var f = LBFile.addSlashIfNeeded(k)+i+'/';
				a += '<li data-path="'+f+'">'+
					'<span class="ui-icon ui-icon-folder-'+(typeof v=='object'?'open':'collapsed')+'"></span>'+
					'<a href="#'+f+'">'+i+'</a>'+(typeof v=='object'?'<ul>'+m(v,f)+'</ul>':'')+'</li>';
			});
			return a;
		})(tree,'/'));
		var curLocInTree = $('li[data-path="'+LBFile.addSlashIfNeeded(typeof f=='string'?f:f[f.length-1])+'"]');
		function scroll(){$('#sidebar-tree').scrollTop(curLocInTree.position()?~~curLocInTree.position().top:0)}
		scroll();
		if (!$('#sidebar-tree').scrollTop()) {scroll()}
		curLocInTree.children('a').css('fontWeight','bold');
	});
}

function getDirContents(dir, opts, callback) {
	// This function is used to fetch contents of a dir into a DB.

	if (typeof opts == "function") {
		callback = opts;
		opts = {cont:false,simple:false};
	}
	$.post('info/dir',$.extend(opts,{file:(new LBFile(dir)).resolve()}),function(r){
		if (r.error) {callback(r.error)}
		else {callback(TAFFY(r))}
	});
}

jade.render = function(f, locals) {
	// Render a file from jade.files

	return jade.files['views/' + (/\.jade$/.test(f)?f:f+'.jade')](locals);
}

$(w).on('hashchange',function(){
	if (typeof noload == 'undefined') {
		load();
	} else {
		delete noload;
	}
});
$(function(){ // set up jqUI elements
	$('#filepath').buttonset();
	$('#back-and-forth').buttonset();
	$('#back').click(history.back);
	$('#next').click(history.forward);
	$('#search-bttn').click(function(){
		if (file.size > 209715200) { // 200MB
			jqUI.confirm({text: _('search-large-body'), title: _('search-large-title'), width: 400}, function(c){
				if (c) {run()}
			});
		} else {run()}
		function run(){
			jqUI.prompt({text: _('search-body'), title: _('search-title')},function(term){
				if (term) {
					w.cwd = file.path;
					location.hash = '#search/'+term;
				}
			});
		}
	}).button();
	$('#new').click(function(e){
		if ($('#new-menu').is(':visible')) {
			$('html').click()
		} else {
			$('#new-menu').show();
			$('#file').css('opacity',0.5);
			e.stopPropagation();
		}
	}).button();
	$('#new-menu').menu().css({position:'absolute',zIndex:100}).offset({
		top: $('#new').offset().top+$('#new').height()+3,
		left: $('#new').offset().left-$('#new').width()+15
	}).hide();
	$('#new-dir, #new-file').click(function() {
		var newType = $(this).attr('id').substr(4), me=this;
		jqUI.prompt(
			{
				text: _(newType=='dir'?'new-dir-name':'new-file-name'),
				title: _(newType=='dir'?'new-dir':'new-file')
			},
			function(filename){
				$.post(
					'/mod',{action:'mk'+newType,file:file.addSlashIfNeeded()+filename},
					function(){location.hash=LBFile.addSlashIfNeeded(location.hash)+filename;}
				);
			}
		);
	});
	$('#new-link').click(function() {
		jqUI.prompt(
			{text: _('new-link-name'),title: _('new-link')},
			function(filename){
				if (filename) {
					fileSelector(file.path, {
						buttonLabel: _('new-link'),
						dialog: {title: _('new-link-file')}
					}, function(linkto){
						$.post('/mod',{action:'link',dest:file.addSlashIfNeeded()+filename,src:linkto.path},load);
					});
				}
			}
		);
	});
	load();
	loadBookmarks();
	$('#new-bookmark').click(addBookmark).button();
	$('a[href*="~"]').each(function(){$(this).attr('href',$(this).attr('href').replace('~',homeroot));});
	$('#locations').accordion({heightStyle:'fill'});
	$(w).resize();
	$(d).tooltip();
});
$(w).resize(function(){
	$('#content').height(w.innerHeight-25);
	$('#locations').accordion('refresh');
});
$(w).click(function(){
	$('#new-menu').hide();
	$('#file').css('opacity',1);
	$('#contextMenu-file-cut, #contextMenu-file-copy').zclip('remove');
	$('#contextMenu').remove();
});
$(d).ajaxError(function(e, jqxhr, settings, exception){
	var url = settings.url.split('?')[0], split = obj.filter(url.split('/'),true);
	if (split[0]=='programs' && split[2]=='index.js') { // ignore missing index.js program files
		return;
	}
	var message = jqUI.alert({
		text:
			_('ajaxerror-e-' + ({
				'/mod': "mod",
				'search': "search",
				'info/echo': "echo",
				'info/exists': "exists",
				'info/readable': "readable",
				'info/writable': "writable",
				'info/info': "info",
				'info/dir': "dir",
				'info/dirSize': "dirSize",
				'info/localbrowseCWD': "cwd",
				'render/dir': "dir-rend",
				'render/ctxMenu': "ctxmenu",
			})[url], (url=="info/localbrowseCWD"||url=="render/ctxMenu"||url=="/mod"?'':' '+decodeURIComponent(getUrlVars('i?'+settings.data).file))) +
			(exception?_('ajaxerror-exception',exception):'') +
			'<div class="retrying_in">'+_('ajaxerror-retry',5)+'</div>',
		title: _('ajaxerror'),
		buttonLabel: _('ajaxerror-button')
	},function(e){
		if (!e.currentTarget) { // button pressed, or timed out
			$.ajax(settings);
			clearInterval(retryCountdown);
		}
	}),
	retryCountdown = setInterval(function(){
		$(message.dialog).find('.retrying_in').text(function(){return _('ajaxerror-retry',parseInt($('span',this).text())-1)});
		if ($(message.dialog).find('.retrying_in span').text()==0) {message.buttons[0].click()}
	},1000);
});
$(d).on('click','#filepath a:last',load); // because the browser won't usually load the hash if it's the same
$(d).on('click','.ui-icon.ui-icon-squaresmall-close',function(){
	localStorage.setItem('bookmarks',JSON.stringify(crit.allBut(bookmarks,$(this).data('index'))));
	loadBookmarks();
});
$(d).on('click','#sidebar-tree span.ui-icon',function sbTreeExpand(e) {
	var me = $(this);
	if (me.siblings('ul').length) {
		me.removeClass('ui-icon-folder-open').addClass('ui-icon-folder-collapsed').siblings('ul').remove();
		$('#sidebar-tree').data('file',$('#sidebar-tree').data('file').map(function(v){
			return LBFile.addSlashIfNeeded(v)==me.parent().data('path')?me.parent().parent().parent().data('path'):v;
		}));
	} else {
		$('#sidebar-tree').data('file').push(me.parent().data('path'));
		sidebarTree($('#sidebar-tree').data('file'));
		return;
	}
});
$(d).on('contextmenu',false);
var refresh = setInterval(function(){
	if ($('#file.dirlist').length && type!='search') {
		getDirContents(file.path,function(f){
			var selList, selLast, scroll;
			listDir(f,function(){
				selList = $('.sel').map(function(){
					return $(this).find('.file-name').text();
				}).get();
				selLast = $('.sel.last .file-name').text();
				scroll = {top:$('#file').scrollTop(),left:$('#file').scrollLeft()};
			},function(){
				$('.file').filter(function(){return selList.indexOf($(this).find('.file-name').text())>-1}).addClass('sel');
				$('.file').filter(function(){return $(this).find('.file-name').text()==selLast}).addClass('last');
				$('#file').scrollTop(scroll.top).scrollLeft(scroll.left);
			});
		})
	} else if ($('#file.fileview').length) {
		$.getJSON('info/info.date'+file.path,function(d){
			if (d!=$('#file').data('modDate')) {
				jqUI.confirm({title:_('filechanged'),text:_('filechanged-body'),buttonLabel:_('filechanged-buttons')},function(reload){
					if (reload) {
						var scroll = {top:$('#file').scrollTop(),left:$('#file').scrollLeft()};
						viewFile();
						$('#file').scrollTop(scroll.top).scrollLeft(scroll.left);
					}
					else {$('#file').data('modDate',d)}
				});
			}
		});
	}
},10000);
$(d).ajaxSuccess(function(e, xhr, settings){
	var b = parseInt(xhr.getResponseHeader('Content-Length'));
	bytes += b;
	requests++;
	console.log(settings.url+'?'+settings.data+': '+b)
	console.log(bytes);
	console.log('average: '+(bytes/requests));
});