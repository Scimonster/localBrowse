function viewFile() {
	// This function opens a file

	var trash = false;
	
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
		if ($('#file').data('program')) { // reloaded on change, because data is cleared in load()
			loadProgram($('#file').data('program'));
			return;
		}
		if (config.programs.defaults[f.type]) { // open in default program
			loadProgram(config.programs.defaults[f.type]);
			return;
		}
		$.get('/programs/editors?file='+file.path, function(editors){
			if (editors.length == 1) {
				loadProgram(editors[0].modName);
				$('#ajax-loader').remove();
			} else {
				$('#file').remove();
				$('<ul id="file" class="program-selector">').appendTo('#file-container').append(editors.map(function(editor){
					return $('<li>').attr({'data-program':editor.modName, title: editor.desc}).append('<a>').
						children('a').attr('href',location.hash).text(editor.name).parent();
				})).menu();
				$('#message').text(_('messages-openwith'));
				$('#ajax-loader').remove();
			}
		});
	});
	$('#sidebar-tree').data('file',[file.path])
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
	$('#message').html(_('messages-dir-count',files({type:'directory'}).count(),files({type:{'!is':'directory'}}).count())+
		' <span id=\"dirSize\">'+
		_('messages-dir-size',($('#directorySize').text()||'...'),($('#dirSizeDepth').text()||3),location.hash)+
		'</span>');
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
	beforeLoad();
	if ($('#file').prop('tagName')!==(s.dirTiles?'div':'table')) { // only recreate #file if it's the wrong type
		$('#file').remove();
		$('<'+(s.dirTiles?'div':'table')+' id="file" class="dirlist">').appendTo('#file-container');
	}
	$('#file').html(jade.render('dir.'+(s.dirTiles?'tiles':'list'), {
		base: type=='search'?LBFile.addSlashIfNeeded(cwd):file.addSlashIfNeeded(),
		imageForFile: imageForFile,
		'_': _,
		files: (s.dirFirst?
			files({type:'directory'}).order(s.sortby).get().concat(
				files({type:{'!is':'directory'}}).order(s.sortby).get())
			:files().order(s.sortby).get())
			.map(function(i){return new LBFile(i)})
	}));
	$('#show_hide_hidden,#show_hide_restricted').change();
	if (!s.dirTiles) {
		if (!s.asec) {$('#file tr').reverse()}
		$('#file th span.ui-icon').remove();
		$('<span>').appendTo('#'+s.sortby).addClass('ui-icon ui-icon-triangle-1-'+(s.asec?'s':'n'));
		$('#file').menu();
	}
	$('#file .file').each(function(){
		$(this).data('info',new LBFile(files({path:$(this).data('path')}).get()[0]));
	});
	afterLoad();
	$('#ajax-loader').remove();
	$('#file').data('files',files);
}

function loadProgram(program) {
	if (!$('#ajax-loader').length) {
		$('<div id="ajax-loader"><img src="img/ajax-loader.gif">').appendTo('#content');
	}
	$('#file-container').load('/programs/'+program+'/html?file='+encodeURIComponent(file.path), function() {
		$('#message').html(_('messages-file-editingwith',_('program-'+program))+
			(file.writable?'':_('messages-file-readonly'))+
			(file.name.substr(-1)=='~'?_('messages-file-backup'):''));
		$('#file').data('program',program);
		$('#file').data('modDate',file.date.getTime()); // for checking if it was modified
		$('#file').addClass('fileview');
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
			$('#ajax-loader').remove();
		});
	});
}

$(d).on('click','ul#file li a',function() {
	loadProgram($(this).parent().data('program'));
});
$(d).on('click','li#contextMenu-file-open ul li a',function() {
	var p = $(this).parent().data('program');
	if ($('.sel').length==1) { // open in this tab
		cd($('.sel').data('path'), function(){
			loadProgram(p);
		});
	} else { // open in new tabs
		// BROKEN
		$('.sel').each(function(){
			$('<a target="_blank" href="/?program='+p+'#'+$(this).data('path')+'">')[0].click();
		});
		cd('..',load); // hack against a bug
	}
});
$(d).on('click','#fullDirSize',function() {
	jqUI.prompt({text:_('dirlist-depth-body'),title:_('dirlist-depth-title')},
		(parseInt($('#dirSizeDepth').text())+1),function(depth){
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
		$(this).button('option','label',_('dirlist-show-hidden'));
	} else {
		$('.file.hidden').show();
		$(this).button('option','label',_('dirlist-hide-hidden'));
	}
	if (s.restricted) {$('.file.restricted').hide()}
});
$(d).on('change','#show_hide_restricted',function(){
	s.restricted = $(this).is(':checked');
	if (s.restricted) {
		$('.file.restricted').hide();
		$(this).button('option','label',_('dirlist-show-restricted'));
	} else {
		$('.file.restricted').show();
		$(this).button('option','label',_('dirlist-hide-restricted'));
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
	$('#file').data('save')(function(f,content){
		$.post('/mod',{action:'save',file:f,content:content},function(info){
			$('#file').data('modDate',info.date);
			var oldMessage = $('#message').html();
			$('#message').html(_('messages-file-saved'));
			setTimeout(function(){$('#message').html(oldMessage)},1500);
		});
	});
});
$(d).on('click','#saveAs',function(){
	$('#file').data('save')(function(f,content){
		fileSelector(file.dir, {
			title: _('fileview-saveas-body'),
			name: LBFile.path.basename(f),
			buttonLabel: _('fileview-saveas-title'),
			preview: false,
			nosel: true
		}, function(info,name){
			if (name) {
				$.post('/mod',{action:'mkfile',file:name,content:content},function(){
					$('#message').html(_('messages-file-saved-as',name));
					location.hash = "#"+name;
				});
			}
		});
	});
});
$(d).on('contextmenu','#file .file',function(e){
	$('#contextMenu').remove();
	if (!$(this).hasClass('sel')) { // fix selections
		$('.sel').removeClass('sel last');
		$(this).addClass('sel last');
	}
	var r = $('.sel').hasClass('restricted');
	$('<ul id="contextMenu">').appendTo('body').offset({top:e.pageY,left:e.pageX}).
		html(jade.render('ctxMenu', {
			list: $('.sel').length==1?[ // just one
				{r:r,id:'open'},
				null,
				{r:r,id:'cut'},
				{r:r,id:'copy'},
				null,
				{r:r,id:'moveTo'},
				{r:r,id:'copyTo'},
				{r:false,id:'makeLink'},
				{r:r,id:'rename'},
				null,
				{r:r,id:'trash'},
				null,
				{r:false,id:'props'},
			]:[ // more than one
				{r:r,id:'open'},
				null,
				{r:r,id:'newFolder'},
				null,
				{r:r,id:'cut'},
				{r:r,id:'copy'},
				null,
				{r:r,id:'moveTo'},
				{r:r,id:'copyTo'},
				{r:false,id:'makeLink',label:'ctxm-selfile-makeLinks'},
				null,
				{r:r,id:'trash'},
				null,
				{r:false,id:'props'},
			],
			_: _,
			prefix: 'selfile',
			ns: 'file',
			programs: programs.editorsForFile($('.file.sel').map(function(){return $(this).data('info')}).get(), true)
		}));
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
$(d).on('contextmenu','#file.dirlist',function(e){
	if ($(e.target).add($(e.target).parents('.file')).hasClass('file')) {return}
	$('#contextMenu').remove();
	$('<ul id="contextMenu">').appendTo('body').offset({top:e.pageY,left:e.pageX}).
		html(jade.render('ctxMenu', {
			list: [
				{r:!file.writable,id:'newFolder'},
				null,
				{r:!(file.writable&&sessionStorage.getItem('copy')),id:'paste'},
				{r:false,id:'props'}
			],
			prefix: 'dirlist',
			ns: 'folder',
			_: _})).
		appendTo('body').menu().offset({top:e.pageY,left:e.pageX});
});
$(d).on('click','#contextMenu-folder-paste',function(){paste()}); // no event object
$(d).on('click','#contextMenu-file-props,#contextMenu-folder-props',function(){
	$.post('/info/info',{file:/folder/.test(this.id)?file.path:$('.sel.last').data('path'),stat:true}, function(i){
		i = new LBFile(i);
		var tabs = [
			{
				title: 'Basic',
				file: 'basic',
				locals: {imageForFile: imageForFile, _: _, i: i},
				close: function(){
					if ($('#props-basic-name').val() != i.name) {
						var f = {};
						f[i.path] = i.dir + $('#props-basic-name').val();
						$.post('/mod', {action: 'move', files: f}, refresh);
					}
				}
			},
			{
				title: 'Permissions',
				file: 'perms',
				locals: {_: _, i: i},
				close: function(){
					$.post('/mod', {
						action: 'chmod',
						file: i.path,
						mode: $(':selected','td.permSel select').map(function(){
							console.log($(this).val())
							console.log($('#props-perms-exec-box').is(':checked'))
							return parseInt($(this).val())+crit.b_to_bin($('#props-perms-exec-box').is(':checked'));
						}).get().join('')
					}, refresh);
				}
			},
			{
				title: 'Open With',
				file: 'openwith',
				locals: {_: _, i: i, programs: programs, defProg: config.programs.defaults[i.type]},
				close: function(){
					$.post('/config', {newVal: $(':selected','select.openwith-program').val(), item: 'programs.defaults.'+i.type}, function(conf){
						config = conf;
					});
				},
				load: function(){$('select.openwith-program').chosen()}
			},
		];
		$('body').append(jade.render('properties/index.jade', {
			tabs: tabs.map(function(t){return {title: t.title, short: t.file}}),
			file: i,
			compiled: tabs.map(function(tab){return jade.render('properties/'+tab.file, tab.locals)}),
			_: _
		}));
		$('#props').tabs({
			heightStyle: 'auto',
			activate: function(e, ui){
				(tabs[$(this).tabs('option','active')].load || $.noop)();
			},
			create: function(e, ui){
				(tabs[$(this).tabs('option','active')].load || $.noop)();
			}
		}).dialog({
			width: 500,
			buttons: [
				{text: _('props-buttons-close'), click: function(){
					(tabs[$(this).tabs('option','active')].close || $.noop)();
					$(this).dialog('close');
				}}
			],
			close: function(){
				$(this).dialog('destroy').remove();
			}
		});
	});
});
$(d).on('click','#contextMenu-file-moveTo,#contextMenu-file-copyTo',function(){
	var sel = $('#file .file.sel').map(function(){return $(this).data('path')}).get(), id = this.id.substr(17,4);
	fileSelector(file.path, {
		types: [{name:_('filetype-dir'),reg:/^directory$/}],
		buttonLabel: _('filesel-button-'+id),
		nosel: true
	}, function(dir,parent){
		if (dir) {
			paste(sel,dir.exists?dir.path:parent,id=='move');
			refresh();
		}
	});
});
$(d).on('click','#contextMenu-file-makeLink',function(){
	var sel = $('#file .file.sel').map(function(){return $(this).data('info')}).get();
	fileSelector(file.path, {
		types: [{name:_('filetype-dir'),reg:/^directory$/}],
		nosel: true
	}, function(dir,parent){
		if (dir) {
			var complete = -1;
			sel.forEach(function(f,i){
				$.post('/mod', {
					action: 'link',
					dest: LBFile.addSlashIfNeeded(dir.exists?dir.path:parent)+f.name,
					src: f.path
				}, function(){
					if (++complete==i) {
						refresh();
					}
				});
			});
		}
	});
});
$(d).on('click','#contextMenu-file-rename',function(){
	$(w).trigger($.Event('keydown',{which:113}));
});
$(d).on('click', '#contextMenu-folder-newFolder', function(){
	$.post('/mod', {
		action: 'mkdir',
		file: file.addSlashIfNeeded()+('Untitled Folder '+(function(d){
			return d.count()?d.order('name asec').get().map(function(name,i){
				return i==0?true:name.name.substr(16)==i+1;
			}).concat(false).indexOf(false)+1:'';
		})($('#file').data('files')({name:{regex:/^Untitled Folder\s*(\d*|)$/}}))).trim()
	}, refresh);
});

function imageForFile(f,big) {
	if (f.type=='directory') {return 'img/fatcow/'+(big?'32x32':'16x16')+'/folder.png'}
	else {
		if (iconset.indexOf('file_extension_'+f.ext+'.png')>-1) {
			return 'img/fatcow/'+(big?'32x32':'16x16')+'/file_extension_'+f.ext+'.png';
		}
		else {return 'img/fatcow/'+(big?'32x32':'16x16')+'/document_empty.png'}
	}
}