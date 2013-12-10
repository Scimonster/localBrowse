/**
 * @file Messages for English
 * @author Scimonster
 * @license {@link LICENSE} (MIT)
 */
var en = {

	fallbacks: [ 'en' ],
	messages: {

		// title-*: page titles in different circumstances (all are given as $1 in `title`)
		"title": "$1 - localBrowse",
		"title-editing": "$1 - editing",
		"title-editing-read": "$1 - editing [read-only]",

		// index-*: items on index
		"index-new": "new",
		"index-new-dir": "directory",
		"index-new-file": "file",
		"index-new-link": "link",
		"index-search": "search",
		// index-loc-*: headers in location sidebar
		"index-loc-tree": "Tree",
		"index-loc-places": "Places",
		"index-loc-bookmarks": "Bookmarks",
		"index-loc-bookmarks-add": "bookmark here",
		"index-loc-bookmarks-remove": "remove this bookmark",
		// places-*: items in places sidebar
		"places-home": "Home",
		"places-docs": "Documents",
		"places-downloads": "Downloads",
		"places-music": "Music",
		"places-pix": "Pictures",
		"places-vids": "Videos",
		"places-root": "Root",
		"places-recent": "Recent",
		"places-trash": "Trash",

		// dirlist-header-*: items in thead in views/dir.list.jade
		"dirlist-header-name": "Name",
		"dirlist-header-size": "Size",
		"dirlist-header-date": "Last Modified",
		"dirlist-header-type": "Type",
		"dirlist-header-perm": "Permissions",
		// dirlist-*: other items when listing directory
		"dirlist-filesize-items": "$1 items",
		"dirlist-filetype-directory": "directory",
		"dirlist-show-hidden": "show hidden files",
		"dirlist-hide-hidden": "hide hidden files",
		"dirlist-show-restricted": "show restricted files",
		"dirlist-hide-restricted": "hide restricted files",
		"dirlist-type-list": "list",
		"dirlist-type-tiles": "tiles",
		"dirlist-depth-title": "Depth",
		"dirlist-depth-body": "Calculate size how many levels? (Note that a higher number is a slower operation.)",
		"dirlist-size-placeholder": "&hellip;",

		// trash-*: items for trash
		"trash-header-name": "Name",
		"trash-header-size": "Size",
		"trash-header-date": "Date Deleted",
		"trash-header-orig": "Original Location",
		"trash-header-type": "Type",
		"trash-header-perm": "Permissions",

		// fileview-*: when editing a file
		"fileview-button-save": "save",
		"fileview-button-saveas": "save as",
		"fileview-noexist": "The file \"$1\" does not exist.",
		"fileview-noaccess": "$1 is not readable to localBrowse.",
		"fileview-saveas-title": "Save as",
		"fileview-saveas-body": "Name of new file:",

		// editor-*: editor names
		"editor-text": "text",

		// ctxm-*: Context menu
		// ctxm-selfile-*: ... for selected files
		"ctxm-selfile-open": "Open",
		"ctxm-selfile-cut": "Cut",
		"ctxm-selfile-copy": "Copy",
		"ctxm-selfile-moveTo": "Move to&hellip;",
		"ctxm-selfile-copyTo": "Copy to&hellip;",
		"ctxm-selfile-makeLink": "Make link$1&hellip;",
		"ctxm-selfile-rename": "Rename",
		"ctxm-selfile-trash": "Move to trash",
		"ctxm-selfile-props": "Properties",
		"ctxm-selfile-newFolder": "New folder with selection",
		// ctxm-dirlist-*: ... for a directory
		"ctxm-dirlist-new": "New folder",
		"ctxm-dirlist-paste": "Paste",
		"ctxm-dirlist-props": "Properties",

		// messages-*: messages displayed at the bottom of the page
		"messages-bookmarkadded": "Bookmark added.",
		"messages-file-editingwith": "Editing with $1 editor.",
		"messages-file-readonly": " This file is read-only to localBrowse.", // keep the space
		"messages-file-backup": " Warning: you are editing a backup file.", // keep the space
		"messages-file-saved": "File saved.",
		"messages-file-saved-as": "File saved to $1",
		"messages-dir-count": "$1 directories; $2 files.",
		"messages-dir-size": "Approximately <span id=\"directorySize\">$1</span> (<span id=\"dirSizeDepth\">$2</span> levels deep). <a id=\"fullDirSize\" href=\"$3\">More accurate calculation.</a>",

		// paste-*: text displayed when pasting files
		"paste-fileinfo-rfolder": "Replacement folder",
		"paste-fileinfo-efolder": "Existing folder",
		"paste-fileinfo-rfile": "Replacement file",
		"paste-fileinfo-efile": "Existing file",
		"paste-fileinfo-size": "Size: $1",
		"paste-fileinfo-date": "Last modified: $1",
		"paste-merge-title": "Merge folder \"$1\"?",
		"paste-merge-body-newer": "A newer folder with the same name already exists in \"$1\".<br/>Do you want to merge these folders? Merging will ask for confirmation in case of file conflicts.",
		"paste-merge-body-older": "A older folder with the same name already exists in \"$1\".<br/>Do you want to merge these folders? Merging will ask for confirmation in case of file conflicts.",
		"paste-merge-body-newname": "You can type in a new name for the folder. If it exists, the new folder will be merged with the old one.",
		"paste-overwrite-title": "Overwrite file \"$1\"?",
		"paste-overwrite-body-newer": "A newer file with the same name already exists in \"$1\".<br/>Do you want to replace this file?",
		"paste-overwrite-body-older": "A older file with the same name already exists in \"$1\".<br/>Do you want to replace this file?",
		"paste-overwrite-body-newname": "You can type in a new name for the file. If it exists, the new file will replace the old one.",
		"paste-merge-body-newname-exists": "A file with the current name exists in the destination folder.",
		"paste-buttons": ["Paste","Skip"],

		// search-*: in search dialog
		"search-large-title": "Searching in a Large Directory",
		"search-large-body": "The selected directory is over 200MB, and searches may be slow. Click OK to search anyways, or cancel to choose a more specific directory.",
		"search-title": "Search",
		"search-body": "Search for this in file names:",

		// new-*: when creating something new
		"new-dir": "New directory",
		"new-file": "New file",
		"new-link": "New link",
		"new-dir-name": "Name of new directory",
		"new-file-name": "Name of new file",
		"new-link-name": "Name of new link",
		"new-link-file": "File to link to",

		// ajaxerror-*: if we have an error
		"ajaxerror": "Connection Error",
		"ajaxerror-e-mod": "Could not modify filesystem",
		"ajaxerror-e-search": "Could not search for $1",
		"ajaxerror-e-echo": "Could not echo content of $1",
		"ajaxerror-e-exists": "Could not determine existence of $1",
		"ajaxerror-e-readable": "Could not determine readability of $1",
		"ajaxerror-e-writable": "Could not determine writability of $1",
		"ajaxerror-e-info": "Could not get information for $1",
		"ajaxerror-e-dir": "Could not get directory listing for $1",
		"ajaxerror-e-dirSize": "Could not calculate size of directory $1",
		"ajaxerror-e-cwd": "Could not access localBrowse source directory",
		"ajaxerror-e-dir-rend": "Could not render contents of directory $1",
		"ajaxerror-e-ctxmenu": "Could not render context menu",
		"ajaxerror-exception": "<br/>Response from the server: $1",
		"ajaxerror-retry": "Retrying in <span>$1</span> seconds",
		"ajaxerror-button": "Retry now",

		// filechanged-*: the current file was changed, do we want to update?
		"filechanged": "Changed on disk",
		"filechanged-body": "The file has been changed on disk. Do you want to reload it?",
		"filechanged-buttons": ["Reload","Cancel"],

	}
};

module.exports = en;
