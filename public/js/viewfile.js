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
				d.title = _('title',_('title-editing',file.name));
				
				if (f.writable) { // add save button
					$('<button id="save"><!--<span class="ui-icon ui-icon-disk"></span>-->'+_('fileview-button-save')+'</button>').appendTo('#toolbar-left');
				} else {
					d.title = _('title',_('title-editing-read',file.name));
				}
				$.getJSON('info/writable'+file.dir,function(d){ // add save as button
					if (d) {
						$('<button id="saveAs">'+_('fileview-button-saveas')+'</button>').appendTo('#toolbar-left');
					}
					$('#toolbar-left').buttonset();
				});
				$('#message').html(_('messages-file-editingwith',_('editor-'+editor))+(f.writable?'':_('messages-file-readonly'))+(f.name.substr(-1)=='~'?_('messages-file-readonly'):''));
			} else { // no editors
				// Load the browser's view of the file.
				$('<iframe id="file">').attr('src','info/echo/'+file.path).appendTo('#file-container');
			}
			$('#file').data('modDate',f.date.getTime()); // for checking if it was modified
		} else { // doesn't exist
			$('<div id="file" style="text-align:center">').appendTo('#file-container').html(_('fileview-noexist',file.path));
		}
	});
	sidebarTree(file.path);
	if (trash) {file.update(file.relative())}
}

function listDir(files,beforeLoad,afterLoad) {
	// This function lists the contents of a directory

	beforeLoad = beforeLoad || $.noop;
	afterLoad = afterLoad || $.noop;
	if (files == 'perms') { // can't access
		$('#file').remove();
		$('<div id="file" style="text-align:center">').appendTo('#file-container').html(_('fileview-noaccess',file.path));
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