/**
 * @file Messages for English
 * @author Scimonster
 * @license {@link LICENSE} (MIT)
 */
var en = {

	fallbacks: [ 'en' ],
	messages: {

		"title": "$1 - localBrowse", // page title

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
		// dirlist-*: other items in views/dir.(list/tiles).jade
		"dirlist-filesize-items": "$1 items",
		"dirlist-filetype-directory": "directory",

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

		// messages-*: messages displayed at the bottom of the page
		"messages-bookmarkadded": "Bookmark added.",

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

	}
};

module.exports = en;
