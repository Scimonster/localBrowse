var w = window, d= document, // this stuff is global just for the dev period
	s = {
		sortby: 'name',
		asec: true,
		dirFirst: 1,
		hidden: true,
		restricted: true,
		dirTiles: true,
		expandHomeroot: false
	},
	file, type, bookmarks, iconset = [],
	homeroot = '/home/'+user;
$.get('/info/localbrowseCWD',function(cwd){getDirContents(cwd+'/public/img/fatcow/16x16',{cont:false,simple:true},function(i){iconset = i().select('name')})});

function load() {
	// This function runs when a new file/dir is loaded, and at startup.

	// Start by identifying the file.
	file = location.hash.substr(1);
	if (file=='') { // nothing was specified, so use homedir, sorta
		file = homeroot+'/';
		location.hash += file;
		return;
	}
	d.title = file + ' - localBrowse';

	// Find out if it's a file or dir.
	type = /^search/.test(file) ? 'search' : (file=='trash' ? file : ''); // first test if it's search, then trash, otherwise leave it for later
	if (!type) { 
		$.ajax({
			dataType: "json",
			url: 'info/info/'+file.replace(/^trash/,'~/.local/share/Trash/files').replace(/^~/,homeroot),
			async: false,
			success: function(d){type = d.type}
		});
	}

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
	var tmp = file.split('/'), tmp2 = [];
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

function viewFile() {
	// This function opens a file

	var editable_types = {
		'text\/.*': 'text',
		'inode\/x-empty': 'text',
		'image\/svg': 'text'
	}, editors = ['text'], trash=false;
	
	if (file.match(/^trash/)) {
		file = file.replace(/^trash/,homeroot+'/.local/share/Trash/files');
		trash=true;
	}
	// Check if the requested file exists
	$.post('info/info','content=true&file='+file,function(f){
		$('#file').remove();
		if (f.exists) {
			if (f.type == 'directory') {
				getDirContents(file,listDir);
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

				if (editor == 'text') {
					$('<textarea id="file" autofocus="autofocus">').val(f.cont).appendTo('#file-container').focus();
				}
				d.title = file + ' - editing - localBrowse';
				
				if (f.writable) {
					$('<button id="save"><!--<span class="ui-icon ui-icon-disk"></span>-->save</button>').appendTo('#toolbar-left');
				} else {
					d.title = file + ' - editing [read-only] - localBrowse';
				}
				$.get('info/writable'+getParentDir(file),function(d){
					if (parseInt(d)){
						$('<button id="saveAs">save as</button>').appendTo('#toolbar-left');
					}
					$('#toolbar-left').buttonset();
				});
				$('#message').html('Editing with '+editor+' editor.'+(f.writable?'':' This file is read-only to localBrowse.')+(f.name.substr(-1)=='~'?' Warning: you are editing a backup file.':''));
			} else {
				// Load the browser's view of the file.
				$('<iframe id="file">').attr('src','info/echo/'+file).appendTo('#file-container');
			}
			$('#file').data('modDate',f.date);
		} else {
			$('<div id="file" style="text-align:center">').appendTo('#file-container').html('The file "'+file+'" does not exist.');
		}
	});
	sidebarTree(file);
	if (trash) {file = file.replace(homeroot+'/.local/share/Trash/files','trash')}
}

function listDir(files,afterLoad) {
	// This function lists the contents of a directory
	
	afterLoad = afterLoad || $.noop;
	if (files == 'perms') {
		$('#file').remove();
		$('<div id="file" style="text-align:center">').appendTo('#file-container').html(file+' is not readable to localBrowse.');
		return;
	}
	$('#message').html(files({type:'directory'}).count()+' directories; '+files({type:{'!is':'directory'}}).count()+' files. <span id="dirSize">Approximately <span id="directorySize">'+($('#directorySize').text()||'...')+'</span> (<span id="dirSizeDepth">'+($('#dirSizeDepth').text()||3)+'</span> levels deep). <a id="fullDirSize" href="'+location.hash+'">More accurate calculation.</a></span>');
	if (file.substr(0,6)!='search') {
		$.post('info/dirSize','depth='+$('#dirSizeDepth').text()+'&file='+file,function(size){
			$('#dirSize').html('Approximately <span id="directorySize">'+filesizeFormatted(size)+'</span> (<span id="dirSizeDepth">'+$('#dirSizeDepth').text()+'</span> levels deep). <a id="fullDirSize" href="'+location.hash+'">More accurate calculation.</a>');
		});
	}
	$('#toolbar-left').children().remove();
	$('<span><input id="show_hide_hidden" type="checkbox" name="show_hide_hidden"'+(s.hidden?' checked="checked"':'')+' /><input id="show_hide_restricted" type="checkbox" name="show_hide_restricted"'+(s.restricted?' checked="checked"':'')+' /><label for="show_hide_hidden"><span>show</span> hidden files</label><label for="show_hide_restricted"><span>show</span> restricted files</label></span>').buttonset().appendTo('#toolbar-left');
	$('<span><input id="dir_type_list" type="radio" name="dir_type" value="list"'+(s.dirTiles?'':' checked="checked"')+' /><input id="dir_type_tiles" type="radio" name="dir_type" value="tiles"'+(s.dirTiles?' checked="checked"':'')+' /><label for="dir_type_list">list</label><label for="dir_type_tiles">tiles</label></span>').buttonset().appendTo('#toolbar-left');
	$('#file').remove();
	$('<'+(s.dirTiles?'div':'table')+' id="file" class="dirlist">').appendTo('#file-container');
	$('#file').load('/render/dir?type='+(s.dirTiles?'tiles':'list'),{
		base:addSlashIfNeeded(file.substr(0,6)!='search'?file:cwd),
		files:(s.dirFirst?files({type:'directory'}).order(s.sortby).get().concat(files({type:{'!is':'directory'}}).order(s.sortby).get()):files().order(s.sortby).get())
	},function(){
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
	
	if (files == 'perms') {
		$('#file').remove();
		$('<div id="file" style="text-align:center">').appendTo('#file-container').html('The trash is not readable to localBrowse! Did you forget to run the setup script?');
		return;
	}
	$('#toolbar-left').html('<input id="show_hide_restricted" type="checkbox" name="show_hide_restricted" checked="checked" /><label for="show_hide_restricted"><span>show</span> restricted files</label>').buttonset();
	$('#file').remove();
	$('<table id="file" class="trash">').appendTo('#file-container').html('<thead><tr><th id="name">Name</th><th id="size">Size</th><th id="date">Date Deleted</th><th id="orig">Original Location</th><th id="type">Type</th><th id="perm">Permissions</th></tr></thead><tbody></tbody>');
	getDirContents('~/.local/share/Trash/info',{cont:true,simple:false},function(trashinfo){
		function action(f){
			if (trashinfo({name:f.name+'.trashinfo'}).get().length) {
				var i = parseTrashInfo(trashinfo({name:f.name+'.trashinfo'}).get()[0].cont), last = $('<tr class="file">').appendTo('#file tbody');
				last.append('<td class="file-name"><img class="file-img" src="'+imageForFile(f,false)+'" /> '+f.name+'</td>');
				last.append('<td class="file-size">'+(f.type=='directory'?f.size+' items':(isReadable(f)?filesizeFormatted(f.size):f.size))+'</td>');
				last.append('<td class="file-date">'+(isReadable(f)?dateFormat(f.date,true):f.date)+'</td>');
				last.append('<td>'+getParentDir(decodeURIComponent(i.Path))+'</td>');
				if (!s.expandHomeroot) {last.find('td:last').html(function(x,old){return old.replace(homeroot,'~')})}
				last.append('<td class="file-perm">'+permsFormatted(f.perm)+'</td>');
				last.append('<td>'+permsFormatted(f.perm)+'</td>');
				if (!isReadable(f)) {last.addClass('restricted')}
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
	
	if ($.isJQuery(files)) {
		oldfiles = files;
		files = [];
		oldfiles.each(function(){
			files.push($(this).data('path'));
		});
	} else if (typeof files==="string") {
		files = files.split('\n');
	}
	sessionStorage.setItem('copy',files.join('\n'));
	sessionStorage.setItem('cut',!!cut);
	return files.join('\n');
}

function paste(files,destination) {
	// Reads files from the copy buffer and copies them here
	
	console.log(arguments)
	
	files = files || sessionStorage.getItem('copy').split('\n');
	destination = destination || file;
	$.each(files, function(i, srcFile) {
		$.get('info/info'+srcFile,function(src){
			if (src.readable) {
				$.get('info/info'+addSlashIfNeeded(destination)+getFileName(srcFile),function(dest){
					// we now have info on the source and destination files
					if (dest.exists) { // we'll need to overwrite/merge
						if (dest.type=='directory' && src.type=='directory') { // merge
							$.post('info/dir','simple&file='+getParentDir(dest.name),function(otherfiles){
								console.log(otherfiles)
								var d = jqUI.prompt({
									title:'Merge folder "'+getFileName(srcFile)+'"?',
									text:'<div>A '+(src.date<dest.date?'newer':'older')+' folder with the same name already exists in "'+getFileName(getParentDir(dest.name))+'".<br/>Do you want to merge these folders? Merging will ask for confirmation in case of file conflicts.</div><div class="fileOverwriteDialog-fileInfo"><img src="'+imageForFile(src,true)+'"/><p><b>Replacement folder</b><br/>Size: '+src.size+' items<br/>Last modified: '+dateFormat(src.date)+'</p></div><div class="fileOverwriteDialog-fileInfo"><img src="'+imageForFile(dest,true)+'"/><p><b>Existing folder</b><br/>Size: '+dest.size+' items<br/>Last modified: '+dateFormat(dest.date)+'</p></div><p>You can type in a new name for the folder. If it exists, the new folder will be merged with the old one.</p><p class="fileOverwriteDialog-exists">A file with the current name exists in the destination folder.</p>',
									buttonLabel: ['Paste','Skip'],
									width: 500
								},getFileName(srcFile),function(newname){
									if (newname) {
										if (otherfiles.indexOf(newname)>-1) { // merge
											$.post('info/dir','simple&file='+srcFile,function(children){
											run(src.name,getParentDir(dest.name)+newname,true);
												paste(children.map(function(item){return addSlashIfNeeded(srcFile)+item}),getParentDir(dest.name)+newname);
											});
										}
										else { // name changed, so create new dir first
											run(src.name,getParentDir(dest.name)+newname,true);
											paste(children.map(function(item){return addSlashIfNeeded(srcFile)+item}),getParentDir(dest.name)+newname);
										}
									}
								});
								d.dialog.find('input').keyup(function(){
									if (otherfiles.indexOf($(this).val())>-1) {d.dialog.find('.fileOverwriteDialog-exists').show()}
									else {d.dialog.find('.fileOverwriteDialog-exists').hide()}
								});
							});
						}
						else { // overwrite files
							$.post('info/dir','simple&file='+getParentDir(dest.name),function(otherfiles){
								var d = jqUI.prompt({
									title:'Overwrite file "'+getFileName(srcFile)+'"?',
									text:'<div>A '+(src.date<dest.date?'newer':'older')+' file with the same name already exists in "'+getFileName(getParentDir(dest.name))+'".<br/>Do you want to replace this file?</div><div class="fileOverwriteDialog-fileInfo"><img src="'+imageForFile(src,true)+'"/><p><b>Replacement file</b><br/>Size: '+filesizeFormatted(src.size)+'<br/>Last modified: '+dateFormat(src.date)+'</p></div><div class="fileOverwriteDialog-fileInfo"><img src="'+imageForFile(dest,true)+'"/><p><b>Existing file</b><br/>Size: '+filesizeFormatted(dest.size)+'<br/>Last modified: '+dateFormat(dest.date)+'</p></div><p>You can type in a new name for the file. If it exists, the new file will replace the old one.</p><p class="fileOverwriteDialog-exists">A file with the current name exists in the destination folder.</p>',
									buttonLabel: ['Paste','Skip'],
									width: 500
								},getFileName(srcFile),function(newname){
									if (newname) {
										run(src.name,getParentDir(dest.name)+newname); // run, as long as it's not null or empty
									}
								});
								d.dialog.find('input').keyup(function(){
									if (otherfiles.indexOf($(this).val())>-1) {d.dialog.find('.fileOverwriteDialog-exists').show()}
									else {d.dialog.find('.fileOverwriteDialog-exists').hide()}
								});
							});
						}
					} else {
						if (src.type=='directory') {
							$.post('info/dir','simple&file='+srcFile,function(children){
								run(src.name,dest.name,true);
								paste(children.map(function(item){return addSlashIfNeeded(srcFile)+item}),dest.name);
							});
						} else {
							run(src.name,dest.name);
						}
					}
				});
			}
		});
	});
	function run(src,dest,dir) {
		console.log(arguments)
		if (dir) {
			$.post('functions.php?action='+(sessionStorage.getItem('cut')==="true"?'move':'mk')+'dir&file='+dest,'src='+src,function(success){});
		} else {
			$.post('functions.php?action='+(sessionStorage.getItem('cut')==="true"?'move':'copy')+'&file='+src,'dest='+dest,function(success){
				if (success && sessionStorage.getItem('cut')==="true") {
					$.post('functions.php?action=moveCleanup');
				}
			});
		}
	}
}

function loadBookmarks() {
	// This function lists current bookmarks
	
	if (localStorage.getItem('bookmarks')) {bookmarks=JSON.parse(localStorage.getItem('bookmarks'))}
	else {localStorage.setItem('bookmarks','[]')}
	$('#sidebar-bookmarks').html('');
	$.each(bookmarks, function(i, b) {
		$('#sidebar-bookmarks').append('<li><a href="#'+b[0]+'" title="'+b[0]+'"><span class="ui-icon ui-icon-'+(b[1]=='directory'?'folder-collapsed':'document')+'"></span>'+getFileName(b[0])+'</a><span class="ui-icon ui-icon-squaresmall-close" title="remove this bookmark" data-index="'+i+'"></span></li>');
	});
}

function addBookmark() {
	// This function will add a bookmark to the list
	
	if (bookmarks.indexOf(file)+1) {return}
	bookmarks.push([file,type]);
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
	$.post('info/dir',$.extend(opts,{file:dir.replace(/^trash/,'~/.local/share/Trash/files').replace(/^~/,homeroot)}),function(r){
		if (r.error) {callback(r.error)}
		else {callback(TAFFY(r))}
	});
}

function isReadable(f){return f.size!='N/A'}

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
		var ext = f.name.split('.');
		ext = ext.length?ext[ext.length-1]:'';
		if (iconset.indexOf('file_extension_'+ext+'.png')>-1) {return 'img/fatcow/'+(big?'32x32':'16x16')+'/file_extension_'+ext+'.png'}
		else {return 'img/fatcow/'+(big?'32x32':'16x16')+'/document_empty.png'}
	}
}

$(w).on('hashchange',load);
$(function(){
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
		function run(){jqUI.prompt({text: 'Search for this in file names', title: 'Search'},function(term){w.cwd=file;location.hash='#search/'+term;})}
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
					'/mod',{action:'mk'+$(me).attr('id').substr(4),file:addSlashIfNeeded(file)+filename},
					function(){location.hash=addSlashIfNeeded(location.hash)+filename;}
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
					function(linkto){$.post('/mod',{action:'link',dest:addSlashIfNeeded(file)+filename,src:linkto},load);}
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
				echo: "Could not echo content of",
				mkdir: "Could not make directory",
				mkfile: "Could not make file",
				mklink: "Could not make link",
				exists: "Could not determine existence of",
				readable: "Could not determine readability of",
				writable: "Could not determine writability of",
				info: "Could not get information for",
				dir: "Could not get directory listing for",
				save: "Could not save file",
				search: "Could not search for",
				dirSize: "Could not calculate size of directory",
				localbrowseCWD: "Could not access localBrowse source directory",
			})[getUrlVars(settings.url).action] +
			(getUrlVars(settings.url).action=="localbrowseCWD"?'':' '+getUrlVars(settings.url).file) +
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
$(d).on('click','#filepath a:last',load);
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
		$('.file.hidden').show();
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
	$.post('/mod',{action:'save',file:file,content:$('#file').val()},function(info){
		$('#file').data('modDate',info.date);
		var oldMessage = $('#message').html();
		$('#message').html('File saved.');
		setTimeout(function(){$('#message').html(oldMessage)},1500);
	});
});
$(d).on('click','#saveAs',function(){
	jqUI.prompt({title:'Save as',text:'Name of new file:'},function(name){
		if (name) {
			$.post('/mod',{action:'mkfile',file:getParentDir()+name,content:$('#file').val()},function(){
				$('#message').html('File saved to '+getParentDir()+name);
				location.hash = "#"+getParentDir()+name;
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
				var curLocInTree = $('li[data-path="'+addSlashIfNeeded($('#sidebar-tree').data('file'))+'"]');
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
	function open(d,id){return '<li'+(d?' class="ui-state-disabled"':'')+' id="contextMenu-file-'+id+'"><a>'}
	var close = '</a></li>', line = '<li></li>', r = $('.sel').hasClass('restricted');
	if ($('.sel').length==1) {
		$('<ul id="contextMenu">').append(
			open(r,'open')+'Open'+close,
			line,
			open(r,'cut')+'Cut'+close,
			open(r,'copy')+'Copy'+close,
			line,
			open(r,'moveTo')+'Move to...'+close,
			open(r,'copyTo')+'Copy to...'+close,
			open(false,'makeLink')+'Make link'+close,
			open(r,'rename')+'Rename'+close,
			line,
			open(r,'trash')+'Move to Trash'+close,
			line,
			open(false,'props')+'Properties'+close).
		appendTo('body').menu().offset({top:e.pageY,left:e.pageX});
	} else {
		$('<ul id="contextMenu">').append(
			open(r,'newFolder')+'New folder with selection'+close,
			line,
			open(r,'cut')+'Cut'+close,
			open(r,'copy')+'Copy'+close,
			line,
			open(r,'moveTo')+'Move to...'+close,
			open(r,'copyTo')+'Copy to...'+close,
			open(false,'makeLink')+'Make links'+close,
			line,
			open(r,'trash')+'Move to Trash'+close,
			line,
			open(false,'props')+'Properties'+close).
		appendTo('body').menu().offset({top:e.pageY,left:e.pageX});
	}
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
$(d).on('contextmenu','#file.dirlist',function(e){
	console.log(e);
	if ($(e.target).add($(e.target).parent()).hasClass('file')) {return}
	$('#contextMenu').remove();
	function open(d,id){return '<li'+(d?' class="ui-state-disabled"':'')+' id="contextMenu-folder-'+id+'"><a>'}
	var close = '</a></li>', line = '<li></li>';
	$.get('info/writable/'+file,function(r){
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
	if ($('#file.dirlist').length && file.substr(0,6)!='search') {
		getDirContents(file,function(f){
			var selList = [];
			$('.sel').each(function(){
				selList.push($(this).find('.file-name').text());
			});
			var selLast = $('.sel.last .file-name').text();
			var scroll = {top:$('#file').scrollTop(),left:$('#file').scrollLeft()};
			listDir(f,function(){
				$('.file').filter(function(){return selList.indexOf($(this).find('.file-name').text())>-1}).addClass('sel');
				$('.file').filter(function(){return $(this).find('.file-name').text()==selLast}).addClass('last');
				$('#file').scrollTop(scroll.top).scrollLeft(scroll.left);
			});
		})
	} else if ($('textarea#file').length) {
		$.getJSON('info/info.date'+file,function(d){
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