function fileSelector(base, options, callback) {
	if (typeof options == 'function') {
		callback = options;
		options = {};
	}
	getDirContents(base, function(files){
		options = $.extend(true, {
			types: [/.*/],
			multiple: false,
			preview: true,
			buttonLabel: _('filesel-button-open'),
			name: '',
			_: _,
			imageForFile: imageForFile,
			files: (s.dirFirst?
				files({type:'directory'}).order(s.sortby).get().concat(
					files({type:{'!is':'directory'}}).order(s.sortby).get())
				:files().order(s.sortby).get())
				.map(function(i){return new LBFile(i)}),
			dialog: {
				title: _('filesel-title-open'),
				close: function(e){
					console.log(e);
					if (e.currentTarget) { // clicked X in corner
						callback(null);
					}
				},
				modal: true,
				minHeight: 600,
				minWidth: 600,
				height: $(window).height()/1.1,
				width: $(window).width()/1.5
			}
		}, options, {dialog: {buttons: []}});
		options.dialog.buttons[0] = {text: _('filesel-button-cancel'), click: function() {
			$(this).dialog('close').dialog('destroy').remove();
			callback(null);
		}};
		options.dialog.buttons[1] = {
			text: options.buttonLabel,
			icons: {primary: 'ui-icon-check'},
			disabled: true,
			class: 'ok',
			click: function() {
				var selected = $('#filesel .files .file.sel');
				if (selected.length) {
					if (options.multiple) { // we need an array, even if just one was selected
						selected = selected.map(function(){return new LBFile($(this).data('info'))}).get();
					} else {
						selected = new LBFile(selected.data('info'));
					}
					console.log(selected)
					$(this).dialog('close').dialog('destroy').remove();
					callback(selected);
				}
			}
		};

		var dialog = $(jade.render('filesel',options));
		$('.sidebar',dialog).append($('#sidebar-places li').clone().add(
			$('#sidebar-bookmarks li').clone().each(function(){$('span[title]',this).remove()})
		));
		dialog = $(dialog).dialog(options.dialog);
		$('button.newfolder',dialog).button();
		$('.pathbar',dialog).buttonset().height(41);
		pathbar(base, $('.pathbar',dialog), 41);
		$('#filesel .content').height($('#filesel').height()-$('#filesel .top').height()-10);
	});
}

zfileSelector.updatePreview = function() {
	if ($('#filesel').hasClass('preview')) {}
	$('#filesel').parents('.ui-dialog').find('.ui-dialog-buttonset button.ok').button(
		'option','disabled',$('#filesel .sel').length<1);
};


$(d).on('click','#filesel .files .file',function(e){
	if ($(this).hasClass('sel')) {
		if ($('#filesel').hasClass('multiple') && e.ctrlKey && $('#filesel .sel').length>1) {
			$(this).removeClass('sel');
			if ($(this).hasClass('last')) {
				if ($(this).nextAll('.sel').length) {$(this).nextMatching('.sel').addClass('last')}
				else if ($(this).prevAll('.sel').length) {$(this).prevMatching('.sel').addClass('last')}
				else {$('#filesel .sel').add(this).removeClass('last')}
			}
		}
		else {
			$('#filesel .sel').removeClass('sel');
			$(this).addClass('sel last');
		}
	} else {
		$('#filesel .last').removeClass('last');
		if (!e.ctrlKey || !$('#filesel').hasClass('multiple')) {$('#filesel .sel').removeClass('sel')}
		$(this).addClass('sel last');
	}
	fileSelector.updatePreview();
});

//clearInterval(refresh)