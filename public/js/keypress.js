$(w).keydown(function (e) {
    var keycode = e.which,
        key = String.fromCharCode(keycode);
    if (key == 'n' && e.ctrlKey) {
        $('#new').click();
        e.preventDefault();
    }
    if (
    $('#file.dirlist').length && !$('.ui-dialog').length && !$(e.target).is('#file .file .file-name input')) {
        // list of files (table = list, div = tiles)
        var sel = $('.sel.last'),
            fileList = $('div.file').filter(':visible'),
            tilesPerRow = fileList.index(fileList.filter(function () {
                return $(this).offset().top > fileList.first().offset().top;
            }).first());

        function scrollUp() {
            if ($.abovethetop("#file", ".sel.last", {
                threshold: 0
            }).length) {
                $('#file').animate({
                    'scrollTop': $('.sel.last').position().top
                });
            }
        }

        function scrollDown() {
            if ($.belowthefold("#file", ".sel.last", {
                threshold: 0
            }).length) {
                $('#file').animate({
                    'scrollTop': $('.sel.last').position().top - $('.sel.last').height()
                });
            }
        }

        function left() {
            var sel = $('.sel.last'); // some need their own because it gets called multiple times here
            e.preventDefault();
            if (sel.length == 1 && sel.prevMatching('.file:visible').length) {
                if (e.shiftKey) {
                    sel.removeClass('last');
                    if (sel.prevMatching('.file:visible').hasClass('sel')) {
                        sel.removeClass('sel');
                        sel.prevMatching('.file:visible').addClass('last');
                    } else {
                        sel.prevMatching('.file:visible').addClass('sel last');
                    }
                } else {
                    $('.sel').removeClass('sel last');
                    sel.prevMatching('.file:visible').addClass('sel last');
                }
            }
            scrollUp();
        }

        function right() {
            var sel = $('.sel.last');
            e.preventDefault();
            if (sel.length == 0) {
                $('.file').filter(':visible').first().addClass('sel last');
            }
            if (sel.length == 1 && sel.nextMatching('.file:visible').length) {
                if (e.shiftKey) {
                    sel.removeClass('last');
                    if (sel.nextMatching('.file:visible').hasClass('sel')) {
                        sel.removeClass('sel');
                        sel.nextMatching('.file:visible').addClass('last');
                    } else {
                        sel.nextMatching('.file:visible').addClass('sel last')
                    }
                } else {
                    $('.sel').removeClass('sel last');
                    sel.nextMatching('.file:visible').addClass('sel last');
                }
            }
            scrollDown();
        }

        function home() {
            e.preventDefault();
            if (sel.length === 0) {
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
            if (sel.length === 0) {
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
                if (sel.length == 1 && sel.prevAll('.file:visible').length > tilesPerRow - 1) {
                    for (var i = 0; i < tilesPerRow; i++) {
                        left();
                    }
                }
            } else {
                left();
            }
        }

        function down() {
            var sel = $('.sel.last');
            if ($('div#file.dirlist').length) {
                e.preventDefault();
                if (sel.length === 0) {
                    fileList.first().addClass('sel last');
                }
                if (sel.length == 1 && sel.nextAll('.file:visible').length) {
                    for (var i = 0; i < tilesPerRow; i++) {
                        right();
                    }
                }
            } else {
                right();
            }
        }
        switch (keycode) {
            case 37:
                // left
                if ($('div#file.dirlist').length) {
                    left();
                }
                break;
            case 39:
                // right
                if ($('div#file.dirlist').length) {
                    right();
                }
                break;
            case 38:
                // up
                up();
                break;
            case 40:
                // down
                down();
                break;
            case 33:
                // pg up
                e.preventDefault();
                for (var i = 0; i < 5; i++) {
                    up();
                }
                break;
            case 34:
                // pg dn
                e.preventDefault();
                for (var i = 0; i < 5; i++) {
                    down();
                }
                break;
            case 36:
                // home
                home();
                break;
            case 35:
                // end
                end();
                break;
            case 113:
                // q, i.e. f2
                $('#file .file.sel.last').addClass('renaming');
                clearInterval(refresh.interval);
                var nameContainer = $('td.file-name span, span.file-name', '#file .file.sel.last');
                nameContainer.html(
                    '<input type="text" name="file-name" value="' + $('#file .sel.last').data('info').name + '" />');
                $('input', nameContainer).focus();
                break;
        }
    }
});
$(d).on('keypress', '#file .file .file-name input', function (e) {
    if (e.which == 13 || e.which == 10) { // enter
        var f = {};
        f[$('#file .file.renaming').data('path')] = $('#file .file.renaming').data('info').dir + $(this).val();
        paste.run([
        $('#file .file.renaming').data('path')], [
        $('#file .file.renaming').data('info').dir + $(this).val()], function (toPaste) {
            $.post('/mod', {
                action: 'move',
                files: toPaste
            }, function () {
                refresh.interval = setInterval(refresh, 10000);
                refresh();
            });
        });
    }
});