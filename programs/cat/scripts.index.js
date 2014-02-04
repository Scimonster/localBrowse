$('#file').data('save', function (cb) {
	cb(null, $('#file').text());
});