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
				last.append('<td class="file-size">'+(f.type=='directory'?f.items+' items':(f.readable?f.filesizeFormatted():f.size))+'</td>');
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