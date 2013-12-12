function viewFile() {
	// This function opens a file

	// TODO: Completely redo file-opening (see /TODO.md)
	var trash=false;
	
	if (file.path.match(/^trash/)) {
		file.update(file.resolve());
		trash = true;
	}
	// Check if the requested file exists
	$.post('info/info','content=true&file='+file.path,function(f){
		f = file = new LBFile(f);
		if (f.type == 'directory') {
			getDirContents(file.path,listDir);
			return;
		}
		$.get('/programs/editors?file='+file.path, function(editors){
			$('#file').remove();
			$('<ul id="file" class="program-selector">').attr('title',_('fileview-openwith')).appendTo('#file-container').append(editors.map(function(editor){
				return $('<li>').attr({'data-program':editor.modName, title: editor.desc}).append('<a>').
					children('a').attr('href',location.hash).text(editor.name).parent();
			})).menu();
		});
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
	$('#message').html(_('messages-dir-count',files({type:'directory'}).count(),files({type:{'!is':'directory'}}).count())+' <span id=\"dirSize\">'+
		_('messages-dir-size',($('#directorySize').text()||'...'),($('#dirSizeDepth').text()||3),location.hash)+'</span>');
	if (type!='search') {
		// get dir size
		$.post('info/dirSize','depth='+$('#dirSizeDepth').text()+'&file='+file.path,function(size){
			file.size = size;
			$('#dirSize').html(_('messages-dir-size',file.filesizeFormatted(),$('#dirSizeDepth').text(),location.hash));
		});
	}
	$('#toolbar-left').children().remove();
	$('<span>'+
		'<input id="show_hide_hidden" type="checkbox" name="show_hide_hidden"'+(s.hidden?' checked="checked"':'')+' />'+
		'<input id="show_hide_restricted" type="checkbox" name="show_hide_restricted"'+(s.restricted?' checked="checked"':'')+' />'+
		'<label for="show_hide_hidden">'+_(s.hidden?'dirlist-show-hidden':'dirlist-hide-hidden')+'</label>'+
		'<label for="show_hide_restricted">'+_(s.restricted?'dirlist-show-restricted':'dirlist-hide-restricted')+'</label>'+
		'</span>').buttonset().appendTo('#toolbar-left');
	$('<span>'+
		'<input id="dir_type_list" type="radio" name="dir_type" value="list"'+(s.dirTiles?'':' checked="checked"')+' />'+
		'<input id="dir_type_tiles" type="radio" name="dir_type" value="tiles"'+(s.dirTiles?' checked="checked"':'')+' />'+
		'<label for="dir_type_list">'+_('dirlist-type-list')+'</label>'+
		'<label for="dir_type_tiles">'+_('dirlist-type-tiles')+'</label>'+
		'</span>').buttonset().appendTo('#toolbar-left');
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

$(d).on('click','ul#file li a',function() {
	var program = $(this).parent().data('program');
	$('#file-container').load('/programs/'+program+'/html?file='+encodeURIComponent(file.path), function() {
		$('#message').html(_('messages-file-editingwith',_('editor-'+program))+
			(file.writable?'':_('messages-file-readonly'))+
			(file.name.substr(-1)=='~'?_('messages-file-backup'):''));
		$('#file').data('program',program);
		$('#file').data('modDate',file.date.getTime()); // for checking if it was modified
		$.getJSON('/programs/'+program+'/buttons?file='+encodeURIComponent(file.path), function(buttons) {
			$('#toolbar-left').children().remove();
			buttons.forEach(function(b){
				if (b instanceof Array) { // a buttonset
					$('<span>').appendTo('#toolbar-left').append(b.map(buttonFromObject)).buttonset();
				} else {
					$('#toolbar-left').append(buttonFromObject(b));
				}
			});
			function buttonFromObject(button) {
				return $(button.elem).button({icons: button.icons});
			}

			$.getScript('/programs/'+program+'/index.js');
		});
	});
});
$(d).on('click','#fullDirSize',function() {
	jqUI.prompt({text:_('dirlist-depth-body'),title:_('dirlist-depth-title')},(parseInt($('#dirSizeDepth').text())+1),function(depth){
		if (depth) {
			$('#dirSizeDepth').text(depth);
			$('#directorySize').text(_('dirlist-size-placeholder'));
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
		$('#message').html(_('messages-file-saved'));
		setTimeout(function(){$('#message').html(oldMessage)},1500);
	});
});
$(d).on('click','#saveAs',function(){
	jqUI.prompt({title:_('fileview-saveas-title'),text:_('fileview-saveas-body')},function(name){
		if (name) {
			$.post('/mod',{action:'mkfile',file:file.dir+name,content:$('#file').val()},function(){
				$('#message').html(_('messages-file-saved-as',file.dir+name));
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
	$('<ul id="contextMenu">').appendTo('body').offset({top:e.pageY,left:e.pageX}).
		load('render/ctxMenu?type=seledFiles',{r:$('.sel').hasClass('restricted'),l:$('.sel').length==1},function(){
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
	function item(d,id,message){
		return '<li'+(d?' class="ui-state-disabled"':'')+' id="contextMenu-folder-'+id+'"><a>'+
		_('ctxm-dirlist-'+message)+
		'</a></li>';
	}
	var line = '<li></li>';
	$.get('info/writable'+file.path,function(r){
		//console.log(!!r);
		$('<ul id="contextMenu">').append(
			item(!r,'newFolder','new'),
			line,
			item(!(r&&sessionStorage.getItem('copy')),'paste','paste'),
			item(false,'props','props')).
		appendTo('body').menu().offset({top:e.pageY,left:e.pageX});
	})
});
$(d).on('click','#contextMenu-file-open',function(){
	$('.sel.last').dblclick();
});
$(d).on('click','#contextMenu-folder-paste',function(){paste()}); // no event object