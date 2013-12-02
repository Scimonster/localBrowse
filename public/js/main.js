var
	w = window, // shortcuts
	d= document,
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
	LBFile = require('./File.js'); // LBFile class, containing file methods
$.get('/info/localbrowseCWD',function(cwd){getDirContents(cwd+'/public/img/fatcow/16x16',{cont:false,simple:true},function(i){iconset = i().select('name')})}); // deprecated

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
		location.hash += file.path;
		return;
	}
	if (file.path !== location.hash.substr(1)) { // it was normalized
		location.hash = file.path;
		return;
	}
	d.title = file.name + ' - localBrowse';

	// Find out if it's a file or dir.
	type = /^search/.test(location.hash.substr(1)) ? 'search' : (location.hash.substr(1)=='trash' ? 'trash' : ''); // first test if it's search, then trash, otherwise leave it for later
	if (!type) { 
		$.getJSON('info/info'+file.resolve(),function(f){
			file = new LBFile(f)
			type = f.type;
			finishLoading();
		});
	} else {
		finishLoading();
	}

	function finishLoading() {
		// Display AJAX loading circle
		$('<div id="ajax-loader"><img src="img/ajax-loader.gif">').appendTo('#content');
		$('table').menu('destroy');
		$('#file').removeData().remove();
		$('#toolbar-left').html('');
		$('#new').show();
		if (type=='trash') {
			// If it's the trash, load it
			getDirContents('~/.local/share/Trash/files',function(f){listTrash(f)});
		} else if (type=='search') {
			// Load search
			search(file.substr(7));
		} else {
			// If it's a file or dir, load it
			viewFile();
		}
		// Create the pathbar
		var tmp = file.path.split('/'), tmp2 = [];
		if (tmp[tmp.length-1]=='') {tmp.pop()}
		$('#filepath').buttonset('destroy');
		$('#filepath').html('');
		if (!tmp[0]) {
			$('#filepath').append('<a href="#/">/</a>');
			tmp = tmp.slice(1);
		}
		$.each(tmp,function(tmp3,par) {
			tmp2[tmp2.length] = par;
			$('#filepath').append('<a href="#/'+tmp2.join('/')+'/">'+par+'</a>');
		});
		$('#filepath').buttonset();
		var tmp3=0;
		while ($('#filepath').height()>53) {
			tmp2=tmp.slice(0,tmp3+1);
			tmp3++;
			$('#filepath').buttonset('destroy');
			$('#filepath').html('');
			$('#filepath').append('<a>...</a>');
			$.each(tmp.slice(tmp3),function(tmp4,par) {
				tmp2[tmp2.length] = par;
				$('#filepath').append('<a href="#/'+tmp2.join('/')+'/">'+par+'</a>');
			});
			$('#filepath a:last').attr('href',function(i,old){return old.slice(0,-1)});
			$('#filepath').buttonset();
		}
		$('#ajax-loader').remove();
	}
}

function viewFile() {
	// This function opens a file

	// TODO: Completely redo file-opening (see /TODO.md)
	var editable_types = {
		'text\/.*': 'text',
		'inode\/x-empty': 'text',
		'image\/svg': 'text'
	}, editors = ['text'], trash=false;
	
	if (file.path.match(/^trash/)) {
		file.update(file.resolve());
		trash = true;
	}
	// Check if the requested file exists
	$.post('info/info','content=true&file='+file.path,function(f){
		f = new LBFile(f);
		$('#file').remove();
		if (f.exists) {
			if (f.type == 'directory') {
				getDirContents(file.path,listDir);
				return;
			}
			var editor;
			// determine editor
			$.each(editable_types, function(regex, ed) {
				if (new RegExp(regex).test(f.type)) {editor = ed; return false;}
			});
			
			// Load editor
			if (editors.indexOf(editor)+1) {
				// We have an editor for this type.

				if (editor == 'text') { // load text editor
					$('<textarea id="file" autofocus="autofocus">').val(f.cont).appendTo('#file-container').focus();
				}
				d.title = file.name + ' - editing - localBrowse';
				
				if (f.writable) { // add save button
					$('<button id="save"><!--<span class="ui-icon ui-icon-disk"></span>-->save</button>').appendTo('#toolbar-left');
				} else {
					d.title = file.name + ' - editing [read-only] - localBrowse';
				}
				$.getJSON('info/writable'+file.dir,function(d){ // add save as button
					if (d) {
						$('<button id="saveAs">save as</button>').appendTo('#toolbar-left');
					}
					$('#toolbar-left').buttonset();
				});
				$('#message').html('Editing with '+editor+' editor.'+(f.writable?'':' This file is read-only to localBrowse.')+(f.name.substr(-1)=='~'?' Warning: you are editing a backup file.':''));
			} else { // no editors
				// Load the browser's view of the file.
				$('<iframe id="file">').attr('src','info/echo/'+file).appendTo('#file-container');
			}
			$('#file').data('modDate',f.date.getTime()); // for checking if it was modified
		} else { // doesn't exist
			$('<div id="file" style="text-align:center">').appendTo('#file-container').html('The file "'+file.path+'" does not exist.');
		}
	});
	sidebarTree(file.path);
	if (trash) {file.update(file.relative())}
}

function listDir(files,beforeLoad,afterLoad) {
	// This function lists the contents of a directory

	beforeLoad = beforeLoad || $.noop;
	afterLoad = afterLoad || $.noop;
	if (files.err == 'perms') { // can't access
		$('#file').remove();
		$('<div id="file" style="text-align:center">').appendTo('#file-container').html(file.path+' is not readable to localBrowse.');
		return;
	}
	// set message
	$('#message').html(files({type:'directory'}).count()+' directories; '+files({type:{'!is':'directory'}}).count()+' files. <span id="dirSize">Approximately <span id="directorySize">'+($('#directorySize').text()||'...')+'</span> (<span id="dirSizeDepth">'+($('#dirSizeDepth').text()||3)+'</span> levels deep). <a id="fullDirSize" href="'+location.hash+'">More accurate calculation.</a></span>');
	if (type!='search') {
		// get dir size
		$.post('info/dirSize','depth='+$('#dirSizeDepth').text()+'&file='+file.path,function(size){
			file.size = size;
			$('#dirSize').html('Approximately <span id="directorySize">'+file.filesizeFormatted()+'</span> (<span id="dirSizeDepth">'+$('#dirSizeDepth').text()+'</span> levels deep). <a id="fullDirSize" href="'+location.hash+'">More accurate calculation.</a>');
		});
	}
	$('#toolbar-left').children().remove();
	$('<span><input id="show_hide_hidden" type="checkbox" name="show_hide_hidden"'+(s.hidden?' checked="checked"':'')+' /><input id="show_hide_restricted" type="checkbox" name="show_hide_restricted"'+(s.restricted?' checked="checked"':'')+' /><label for="show_hide_hidden"><span>'+(s.hidden?'show':'hide')+'</span> hidden files</label><label for="show_hide_restricted"><span>'+(s.restricted?'show':'hide')+'</span> restricted files</label></span>').buttonset().appendTo('#toolbar-left');
	$('<span><input id="dir_type_list" type="radio" name="dir_type" value="list"'+(s.dirTiles?'':' checked="checked"')+' /><input id="dir_type_tiles" type="radio" name="dir_type" value="tiles"'+(s.dirTiles?' checked="checked"':'')+' /><label for="dir_type_list">list</label><label for="dir_type_tiles">tiles</label></span>').buttonset().appendTo('#toolbar-left');
	$.post(
		'render/dir?type='+(s.dirTiles?'tiles':'list'), // render listing
		type=='search'?{ // so we need to pass the entire listing
			base:LBFile.addSlashIfNeeded(cwd),
			files:(s.dirFirst?files({type:'directory'}).order(s.sortby).get().concat(files({type:{'!is':'directory'}}).order(s.sortby).get()):files().order(s.sortby).get())
		}:{ // we can just give it the dirpath and it'll get the files
			dir: file.addSlashIfNeeded(),
			s: s
		},
		function(res){
			beforeLoad();
			if ($('#file').prop('tagName')!==(s.dirTiles?'div':'table')) { // only recreate #file if it's the wrong type
				$('#file').remove();
				$('<'+(s.dirTiles?'div':'table')+' id="file" class="dirlist">').appendTo('#file-container');
			}
			$('#file').html(res);
			$('#show_hide_hidden,#show_hide_restricted').change();
			if (!s.dirTiles) {
				if (!s.asec) {$('#file tr').reverse()}
				$('#file th span.ui-icon').remove();
				$('<span>').appendTo('#'+s.sortby).addClass('ui-icon ui-icon-triangle-1-'+(s.asec?'s':'n'));
				$('#file').menu();
			}
			afterLoad();
	});
	$('#file').data('files',files);
}

function listTrash(files) {
	// This function lists the contents of the trash
	
	// TODO: make trash work more like regular dir
	
	if (files.err == 'perms') {
		$('#file').remove();
		$('<div id="file" style="text-align:center">').appendTo('#file-container').html('The trash is not readable to localBrowse! Did you forget to run the setup script?');
		return;
	}
	$('#toolbar-left').html('<input id="show_hide_restricted" type="checkbox" name="show_hide_restricted" checked="checked" /><label for="show_hide_restricted"><span>show</span> restricted files</label>').buttonset();
	$('#file').remove();
	$('<table id="file" class="trash">').appendTo('#file-container').html('<thead><tr><th id="name">Name</th><th id="size">Size</th><th id="date">Date Deleted</th><th id="orig">Original Location</th><th id="type">Type</th><th id="perm">Permissions</th></tr></thead><tbody></tbody>');
	getDirContents('~/.local/share/Trash/info',{cont:true,simple:false},function(trashinfo){
		function action(f){
			f = new LBFile(f);
			if (trashinfo({name:f.name+'.trashinfo'}).get().length) {
				var i = parseTrashInfo(trashinfo({name:f.name+'.trashinfo'}).get()[0].cont), last = $('<tr class="file">').appendTo('#file tbody');
				last.append('<td class="file-name"><img class="file-img" src="'+imageForFile(f,false)+'" /> '+f.name+'</td>');
				last.append('<td class="file-size">'+(f.type=='directory'?f.size+' items':(f.readable?f.filesizeFormatted():f.size))+'</td>');
				last.append('<td class="file-date">'+(f.readable?f.dateFormatted(true):f.date)+'</td>');
				last.append('<td>'+(new LBFile(decodeURIComponent(i.Path))).dir+'</td>');
				if (!s.expandHomeroot) {last.find('td:last').html(function(x,old){return old.replace(homeroot,'~')})}
				last.append('<td class="file-perm">'+f.permsFormatted()+'</td>');
				last.append('<td>'+f.permsFormatted()+'</td>');
				if (!f.readable) {last.addClass('restricted')}
			}
		}
		if (s.dirFirst) {
			files({type:'directory'}).order(s.sortby).each(action);
			files({type:{'!is':'directory'}}).order(s.sortby).each(action);
		} else {
			files().order(s.sortby).each(action);
		}
		if (!s.asec) {$('tr').reverse()}
		$('th span.ui-icon').remove();
		$('<span>').appendTo('#'+s.sortby).addClass('ui-icon ui-icon-triangle-1-'+(s.asec?'s':'n'));
		$('#message').text(files({type:'directory'}).count()+' directories; '+files({type:{'!is':'directory'}}).count()+' files');
		$('table').menu();
	});
	$('#new').hide();
	$('#file').data('files',files);
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
							var dataForFile = function(f,replace){return f.type==='directory'?('<div class="fileOverwriteDialog-fileInfo"><img src="'+imageForFile(f,true)+'"/><p><b>'+(replace?'Replacement':'Existing')+' folder</b><br/>Size: '+f.size+' items<br/>Last modified: '+f.dateFormatted()+'</p></div>'):('<div class="fileOverwriteDialog-fileInfo"><img src="'+imageForFile(f,true)+'"/><p><b>'+(replace?'Replacement':'Existing')+' file</b><br/>Size: '+f.filesizeFormatted()+' items<br/>Last modified: '+f.dateFormatted()+'</p></div>')};
							if (dest.type=='directory' && src.type=='directory') { // merge
								$.post('info/dir','simple=true&file='+dest.dir,function(otherfiles){ // other files in dest dir, to see if it will be overwritten
									var d = jqUI.prompt({
										title:'Merge folder "'+src.name+'"?',
										text:'<div>A '+(src.date<dest.date?'newer':'older')+' folder with the same name already exists in "'+(new LBFile(dest.dir)).name+'".<br/>Do you want to merge these folders? Merging will ask for confirmation in case of file conflicts.</div>'+dataForFile(src,true)+dataForFile(dest,false)+'<p>You can type in a new name for the folder. If it exists, the new folder will be merged with the old one.</p><p class="fileOverwriteDialog-exists">A file with the current name exists in the destination folder.</p>',
										buttonLabel: ['Paste','Skip'],
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
								$.post('info/dir','simple=true&file='+dest.dir,function(otherfiles){ // other files in dest dir, to see if it will be overwritten
									var d = jqUI.prompt({
										title:'Overwrite file "'+src.name+'"?',
										text:'<div>A '+(src.date<dest.date?'newer':'older')+' file with the same name already exists in "'+(new LBFile(dest.dir)).name+'".<br/>Do you want to replace this file?</div>'+dataForFile(src,true)+dataForFile(dest,false)+'<p>You can type in a new name for the file. If it exists, the new file will replace the old one.</p><p class="fileOverwriteDialog-exists">A file with the current name exists in the destination folder.</p>',
										buttonLabel: ['Paste','Skip'],
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
		$('#sidebar-bookmarks').append('<li><a href="#'+b[0]+'" title="'+b[0]+'"><span class="ui-icon ui-icon-'+(b[1]=='directory'?'folder-collapsed':'document')+'"></span>'+(new LBFile(b[0])).name+'</a><span class="ui-icon ui-icon-squaresmall-close" title="remove this bookmark" data-index="'+i+'"></span></li>');
	});
}

function addBookmark() {
	// This function will add a bookmark to the list
	
	if (bookmarks.indexOf(file.path)+1) {return}
	bookmarks.push([file.path,file.type]);
	localStorage.setItem('bookmarks',JSON.stringify(bookmarks));
	loadBookmarks();
	$('#message').data('old',$('#message').html());
	$('#message').html('Bookmark added.');
	setTimeout(function(){
		$('#message').html($('#message').data('old'));
		$('#message').removeData('old');
	},1500);
}

function sidebarTree(f) {
	// This function creates the tree in the sidebar
	
	$('#sidebar-tree li').remove(); // remove all past ones
	var fileparts = f.split('/');
	fileparts[0] = '/';
	$('#sidebar-tree').data({fileparts:fileparts.filter(function(part){return part}),file:f}); // get the parts of the file
	$('<li data-path="/"><span class="ui-icon ui-icon-folder-collapsed"></span><a href="#/">/</a></li>').appendTo('#sidebar-tree>ul');
	$('li[data-path="/"]>span.ui-icon').trigger('click',[1]);
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

function parseTrashInfo(info) {
	info = info.split('\n');
	var info2 = {};
	if (info[0]=='[Trash Info]') {
		info.shift();
		$.each(info, function(i,v) {
			info2[v.split('=')[0]] = v.split('=')[1];
		});
	}
	info2.DeletionDate = Date.parse(info2.DeletionDate)/1000;
	return info2;
}

function imageForFile(f,big) {
	if (f.type=='directory') {return 'img/fatcow/'+(big?'32x32':'16x16')+'/folder.png'}
	else {
		if (iconset.indexOf('file_extension_'+f.ext+'.png')>-1) {
			return 'img/fatcow/'+(big?'32x32':'16x16')+'/file_extension_'+f.ext+'.png';
		}
		else {return 'img/fatcow/'+(big?'32x32':'16x16')+'/document_empty.png'}
	}
}

$(w).on('hashchange',load);
$(function(){ // set up jqUI elements
	$('#filepath').buttonset();
	$('#back-and-forth').buttonset();
	$('#back').click(history.back);
	$('#next').click(history.forward);
	$('#search-bttn').click(function(){
		if (parseInt($('#directorySize').text()) > 209715200) { // 200MB
			jqUI.confirm({text: 'The selected directory is over 200MB, and searches may be slow. Click OK to search anyways, or cancel to choose a more specific directory.', title: 'Searching in a Large Directory', width: 400}, function(c){
				if (c) {run()}
			});
		} else {run()}
		function run(){jqUI.prompt({text: 'Search for this in file names', title: 'Search'},function(term){w.cwd=file.path;location.hash='#search/'+term;})}
	}).button();
	$('#new').click(function(e){if ($('#new-menu').is(':visible')) {$('html').click()} else {$('#new-menu').show(); $('#file').css('opacity',0.5); e.stopPropagation();}}).button();
	$('#new-menu').menu().css({position:'absolute',zIndex:100}).offset({top:$('#new').offset().top+$('#new').height()+3,left:$('#new').offset().left-$('#new').width()+15}).hide();
	$('#new-dir, #new-file').click(function() {
		var newType = ['directory','file'][$(this).index()], me=this;
		jqUI.prompt(
			{
				text: 'Name of new '+newType,
				tilte: 'New '+newType
			},
			function(filename){
				$.post(
					'/mod',{action:'mk'+$(me).attr('id').substr(4),file:file.addSlashIfNeeded()+filename},
					function(){location.hash=LBFile.addSlashIfNeeded(location.hash)+filename;}
				);
			}
		);
	});
	$('#new-link').click(function() {
		jqUI.prompt(
			{text: 'Name of new link',tilte: 'New link'},
			function(filename){if (filename) {
				jqUI.prompt(
					{text: 'File to link to',tilte: 'New link'},
					function(linkto){$.post('/mod',{action:'link',dest:file.addSlashIfNeeded()+filename,src:linkto},load);}
				);
			}}
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
$(w).keydown(function(e){
	var keycode = e.which, key = String.fromCharCode(keycode);
	if (key=='n' && e.ctrlKey) {$('#new').click(); e.preventDefault();}
	if ($('#file.dirlist').length) { // list of files (table = list, div = tiles)
		var sel = $('.sel.last'), fileList = $('div.file').filter(':visible'), tilesPerRow = fileList.index(fileList.filter(function(){return $(this).offset().top>fileList.first().offset().top}).first());
		function scrollUp() {if ($.abovethetop("#file", ".sel.last", {threshold : 0}).length) {$('#file').animate({'scrollTop':$('.sel.last').position().top})}}
		function scrollDown() {if ($.belowthefold("#file", ".sel.last", {threshold : 0}).length) {$('#file').animate({'scrollTop':$('.sel.last').position().top-$('.sel.last').height()})}}
		function left() {
			var sel = $('.sel.last'); // some need their own because it gets called multiple times here
			e.preventDefault();
			if (sel.length==1 && sel.prevMatching('.file:visible').length) {
				if (e.shiftKey) {
					sel.removeClass('last');
					if (sel.prevMatching('.file:visible').hasClass('sel')) {
						sel.removeClass('sel');
						sel.prevMatching('.file:visible').addClass('last');
					}
					else {sel.prevMatching('.file:visible').addClass('sel last');}
				}
				else {
					$('.sel').removeClass('sel last');
					sel.prevMatching('.file:visible').addClass('sel last');
				}
			}
			scrollUp();
		}
		function right() {
			var sel = $('.sel.last');
			e.preventDefault();
			if (sel.length==0) {
				$('.file').filter(':visible').first().addClass('sel last');
			}
			if (sel.length==1 && sel.nextMatching('.file:visible').length) {
				if (e.shiftKey) {
					sel.removeClass('last');
					if (sel.nextMatching('.file:visible').hasClass('sel')) {
						sel.removeClass('sel');
						sel.nextMatching('.file:visible').addClass('last');
					}
					else {sel.nextMatching('.file:visible').addClass('sel last')}
				}
				else {
					$('.sel').removeClass('sel last');
					sel.nextMatching('.file:visible').addClass('sel last');
				}
			}
			scrollDown();
		}
		function home() {
			e.preventDefault();
			if (sel.length==0) {
				$('.file').filter(':visible').first().addClass('sel last');
			} else {
				if (e.shiftKey) {
					$('.sel').removeClass('sel last');
					sel.prevAll('.file:visible').add(sel).addClass('sel').first().addClass('last');
				} else {
					$('.sel').removeClass('sel last');
					$('.file').filter(':visible').first().addClass('sel last');
				}
			}
			scrollUp();
		}
		function end() {
			e.preventDefault();
			if (sel.length==0) {
				$('.file').filter(':visible').last().addClass('sel last');
			} else {
				if (e.shiftKey) {
					$('.sel').removeClass('sel last');
					sel.nextAll('.file:visible').add(sel).addClass('sel').last().addClass('last');
				} else {
					$('.sel').removeClass('sel last');
					$('.file').filter(':visible').last().addClass('sel last');
				}
			}
			scrollDown();
		}
		function up() {
			var sel = $('.sel.last');
			if ($('div#file.dirlist').length) {
				e.preventDefault();
				if (sel.length==1 && sel.prevAll('.file:visible').length > tilesPerRow-1) {
					for (var i=0;i<tilesPerRow;i++) {left()}
				}
			} else {left()}
		}
		function down() {
			var sel = $('.sel.last');
			if ($('div#file.dirlist').length) {
				e.preventDefault();
				if (sel.length==0) {
					fileList.first().addClass('sel last');
				}
				if (sel.length==1 && sel.nextAll('.file:visible').length) {
					for (var i=0;i<tilesPerRow;i++) {right()}
				}
			} else {right()}
		}
		switch (keycode) {
			case 37: // left
				if ($('div#file.dirlist').length) {left()}
				break;
			case 39: // right
				if ($('div#file.dirlist').length) {right()}
				break;
			case 38: // up
				up();
				break;
			case 40: // down
				down();
				break;
			case 33: // pg up
				e.preventDefault();
				for (var i=0;i<5;i++) {up()}
				break;
			case 34: // pg dn
				e.preventDefault();
				for (var i=0;i<5;i++) {down()}
				break;
			case 36: // home
				home();
				break;
			case 35: // end
				end();
				break;
		}
	}
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
	var message = jqUI.alert({
		text:
			({
				'/mod': "Could not modify filesystem",
				'search': "Could not search for",
				'info/echo': "Could not echo content of",
				'info/exists': "Could not determine existence of",
				'info/readable': "Could not determine readability of",
				'info/writable': "Could not determine writability of",
				'info/info': "Could not get information for",
				'info/dir': "Could not get directory listing for",
				'info/dirSize': "Could not calculate size of directory",
				'info/localbrowseCWD': "Could not access localBrowse source directory",
				'render/dir': "Could not render contents of directory",
				'render/ctxMenu': "Could not render context menu",
			})[settings.url.split('?')[0]] +
			(settings.url.split('?')[0]=="info/localbrowseCWD"||settings.url.split('?')[0]=="render/ctxMenu"||settings.url.split('?')[0]=="/mod"?'':' '+decodeURIComponent(getUrlVars('i?'+settings.data).file)) +
			(exception?"<br/>Response from the server: "+exception:'') +
			'<div class="retrying_in">Retrying in <span>5</span> seconds</div>',
		title: 'Connection Error',
		buttonLabel: 'Retry now'
	},function(e){
		if (!e.currentTarget) { // button pressed, or timed out
			$.ajax(settings);
			clearInterval(retryCountdown);
		}
	}),
	retryCountdown = setInterval(function(){
		$(message.dialog).find('.retrying_in span').text(function(i,old){return parseInt(old)-1});
		if ($(message.dialog).find('.retrying_in span').text()==0) {message.buttons[0].click()}
	},1000);
});
$(d).on('click','#filepath a:last',load); // because the browser won't usually load the hash if it's the same
$(d).on('click','#fullDirSize',function() {
	jqUI.prompt({text:'Calculate size how many levels? (Note that a higher number is a slower operation.)',title:'Depth'},(parseInt($('#dirSizeDepth').text())+1),function(depth){
		if (depth) {
			$('#dirSizeDepth').text(depth);
			$('#directorySize').text('...');
		}
	}).dialog.find('input').spinner();
});
$(d).on('change','#show_hide_hidden',function(){
	s.hidden = $(this).is(':checked');
	if (s.hidden) {
		$('.file.hidden').hide();
		$('label[for="show_hide_hidden"] span:last').text('show');
	} else {
		$('.file.hidden').show();
		$('label[for="show_hide_hidden"] span:last').text('hide');
	}
	if (s.restricted) {$('.file.restricted').hide()}
});
$(d).on('change','#show_hide_restricted',function(){
	s.restricted = $(this).is(':checked');
	if (s.restricted) {
		$('.file.restricted').hide();
		$('label[for="show_hide_restricted"] span:last').text('show');
	} else {
		$('.file.restricted').show();
		$('label[for="show_hide_restricted"] span:last').text('hide');
	}
	if (s.hidden) {$('.file.hidden').hide()}
});
$(d).on('change','input[name="dir_type"]',function(){
	s.dirTiles = $(this).val()=="tiles";
	listDir($('#file').data('files'));
});
$(d).on('click','#file th',function() {
	if (s.sortby == $(this).attr('id')) {s.asec = !s.asec}
	else {s.asec = true}
	s.sortby = $(this).attr('id');
	($('#file.trash').length?listTrash:listDir)($('#file').data('files'));
});
$(d).on('dblclick','#file .file',function() {
	location.hash = $(this).data('path');
});
$(d).on('click','#file .file',function(e){
	if ($(this).hasClass('sel')) {
		if (e.ctrlKey && $('.sel').length>1) {
			$(this).removeClass('sel');
			if ($(this).hasClass('last')) {
				if ($(this).nextAll('.sel').length) {$(this).nextMatching('.sel').addClass('last')}
				else if ($(this).prevAll('.sel').length) {$(this).prevMatching('.sel').addClass('last')}
				else {$('.sel').add(this).removeClass('last')}
			}
		}
		else {
			$('.sel').removeClass('sel');
			$(this).addClass('sel last');
		}
	} else {
		$('.last').removeClass('last');
		if (!e.ctrlKey) {$('.sel').removeClass('sel')}
		$(this).addClass('sel last');
	}
});
$(d).on('click','#save',function(){
	$.post('/mod',{action:'save',file:file.path,content:$('#file').val()},function(info){
		$('#file').data('modDate',info.date);
		var oldMessage = $('#message').html();
		$('#message').html('File saved.');
		setTimeout(function(){$('#message').html(oldMessage)},1500);
	});
});
$(d).on('click','#saveAs',function(){
	jqUI.prompt({title:'Save as',text:'Name of new file:'},function(name){
		if (name) {
			$.post('/mod',{action:'mkfile',file:file.dir+name,content:$('#file').val()},function(){
				$('#message').html('File saved to '+file.dir+name);
				location.hash = "#"+file.dir+name;
			});
		}
	});
});
$(d).on('click','.ui-icon.ui-icon-squaresmall-close',function(){
	localStorage.setItem('bookmarks',JSON.stringify(crit.allBut(bookmarks,$(this).data('index'))));
	loadBookmarks();
});
$(d).on('click','#sidebar-tree span.ui-icon',function(e, iter) {
	var me = $(this);
	if (me.siblings('ul').length) {
		me.removeClass('ui-icon-folder-open').addClass('ui-icon-folder-collapsed').siblings('ul').remove();
	} else {
		getDirContents(me.parent().data('path'),function(dirs){
			dirs = dirs({type:'directory',name:{'!left':'.'}});
			me.removeClass('ui-icon-folder-collapsed').addClass('ui-icon-folder-open').parent().append($('<ul>'));
			dirs.each(function(part){
				var path = me.parent().data('path')+part.name;
				$('<li data-path="'+path+'/"><span class="ui-icon ui-icon-folder-collapsed"></span><a href="#'+path+'">'+part.name+'</a></li>').appendTo(me.siblings('ul'));
			});
			if (iter && $('#sidebar-tree').data('fileparts')[iter]) {
				$('li[data-path="/'+$('#sidebar-tree').data('fileparts').slice(1,iter+1).join('/')+'/"]>span.ui-icon').trigger('click',[iter+1]);
			}
			if (iter) {
				var curLocInTree = $('li[data-path="'+LBFile.addSlashIfNeeded($('#sidebar-tree').data('file'))+'"]');
				function scroll(){$('#sidebar-tree').scrollTop(curLocInTree.position()?Math.floor(curLocInTree.position().top):0)}
				scroll();
				if (!$('#sidebar-tree').scrollTop()) {scroll()}
				curLocInTree.children('a').css('fontWeight','bold');
			}
		});
	}
});
$(d).on('contextmenu',false);
$(d).on('contextmenu','#file .file',function(e){
	$('#contextMenu').remove();
	if (!$(this).hasClass('sel')) { // fix selections
		$('.sel').removeClass('sel last');
		$(this).addClass('sel class');
	}
	$('<ul id="contextMenu">').appendTo('body').offset({top:e.pageY,left:e.pageX}).load('render/ctxMenu?type=seledFiles',{r:$('.sel').hasClass('restricted'),l:$('.sel').length==1},function(){
		$('#contextMenu').menu();
		$('#contextMenu-file-cut').zclip({
			path: 'js/ZeroClipboard.swf',
			copy: function(){return copy($('.sel'),true)},
			afterCopy: $.noop
		});
		$('#contextMenu-file-copy').zclip({
			path: 'js/ZeroClipboard.swf',
			copy: function(){return copy($('.sel'))},
			afterCopy: $.noop
		});
	});
});
$(d).on('contextmenu','#file.dirlist',function(e){
	if ($(e.target).add($(e.target).parent()).hasClass('file')) {return}
	$('#contextMenu').remove();
	function open(d,id){return '<li'+(d?' class="ui-state-disabled"':'')+' id="contextMenu-folder-'+id+'"><a>'}
	var close = '</a></li>', line = '<li></li>';
	$.get('info/writable'+file.path,function(r){
		//console.log(!!r);
		$('<ul id="contextMenu">').append(
			open(!r,'newFolder')+'New folder'+close,
			line,
			open(!(r&&sessionStorage.getItem('copy')),'paste')+'Paste'+close,
			open(false,'props')+'Properties'+close).
		appendTo('body').menu().offset({top:e.pageY,left:e.pageX});
	})
});
$(d).on('click','#contextMenu-file-open',function(){
	$('.sel.last').dblclick();
});
$(d).on('click','#contextMenu-folder-paste',function(){paste()}); // no event object
setInterval(function(){
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
	} else if ($('textarea#file').length) {
		$.getJSON('info/info.date'+file.path,function(d){
			if (d!=$('#file').data('modDate')) {
				jqUI.confirm({title:'Changed on disk',text:'The file has been changed on disk. Do you want to reload it?',buttonLabel:['Reload','Cancel']},function(reload){
					if (reload) {
						var scroll = {top:$('#file').scrollTop(),left:$('#file').scrollLeft()};
						load();
						$('#file').scrollTop(scroll.top).scrollLeft(scroll.left);
					}
					else {$('#file').data('modDate',d)}
				});
			}
		});
	}
},5000);