$('#file').data('save', function (cb) {
	cb(file.path, $('#file').val());
});