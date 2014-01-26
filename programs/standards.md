# localBrowse File Viewer Standards
This document outlines the standards for a file editor plugin for localBrowse.

## Files
Each program must be defined as a directory in `./programs/`. The directory name should be the name of the module. So, the default text editor (`text`) is located in `./programs/text/`. You can organize the inside of your program's folder however you want, provided it exposes the following objects at the end.

## The Module
The module must expose the following properties, with the proper types.

### `modName` - String
This should be done with the following line of code:
```javascript
var name = exports.modName = path.basename(__dirname);
```
The `var name = ` is optional, but allows for easier inclusion of the module's name (such as in routes). The name should never be hardcoded, because the directory may be renamed.

### `html` - Function
This is a function taking two parameters, both required:
* `file`: an instance of `LBFile` (from `./File.js`)
* `cb`: a callback function to be passed a single string
The string passed to the callback will be inserted into `#file-container`. A string **must** be passed to it, or else the URL will never return!

### `messages` - Object
The `messages` objects from all programs are compiled and added to the native messaging interface. Your program's `messages` object should look something like this:
```json
{ "en": { "program-text": "text editor" } }
```
There are 3 required messages in English:
* `"program-"+name`
* `""program-"+name+"-name"`
* `""program-"+name+"-desc"`

Program-specific messages should be namespaced.

### `mimetypes` - Array
This should be an array of regular expressions (as instances of `RegExp`) to match the MIMEType of a file against. If any match, your program can open the file.

### `name` - String - **deprecated**
The human-readable-name of your program that will be displayed in the program options list. This is deprecated in favor of the `program-NAME-name` message (see above).

### `desc` - String - **deprecated**
A short description of your program that will be displayed in a tooltip for the `name`. This is deprecated in favor of the `program-NAME-desc` message (see above).

### `routes` - Object of Functions
Your program can provide a web interface besides the plain HTML from `html`. This is done through the `routes` object. Each key in the object is used as the request function for `/programs/YOUR PROGRAM NAME/KEY IN OBJECT`. The functions are passed two arguments: `req` and `res`. These are the same as any Express `req`/`res` objects. Both GET and POST requests are supported.

The route `/programs/YOUR PROGRAM NAME/html` is reserved for outputting the callback value of `html`, and `/programs/YOUR PROGRAM NAME/buttons` for generating the buttons.

### `buttons` - Functions
This function creates the barebones for the buttons in `#toolbar-left`. It is passed to parameters:
* `file`: an instance of `LBFile` (from `./File.js`)
* `cb`: a callback function to be passed an array

The array that gets passed to `cb` can contain a mix of arrays and objects. Arrays are to be buttonsets, while plain objects are buttons. Buttonset arrays should only contain objects for buttons.

#### Button Objects
A button object should contain the following properties:
* `elem` (String): an element describer (see below)
* `message` (String, optional): the message to be used as a label for the button
* `icons` (Object, optional): the same kind of object as passed to [`.button({icons:})`](http://api.jqueryui.com/button/#option-icons)

Note that either `message` or `icons` **must** be defined -- both, only `message`, or only `icons` can be set, but not neither.

An element describer is a string either formatted as an HTML element creatable by jQuery (`<input type="checkbox" name="my_box" checked="checked" />`, `<button>`) or a CSS selector string passable to [put-selector](https://npmjs.org/package/put-selector) (`button`, `button#save`, `#save`, `input[type="checkbox"][name="my_box"][checked="checked"]`). If a selector string is given without an element name, it defaults to `button`. Therefore, the second and third examples produce the same thing. It detects if it's an element by checking if the first non-whitespace character is a "<" sign.

### `noShow` - Boolean [Optional]
If you don't want your program to appear in the list, only directly from the "open" menu (such as the system opener program), set `exports.noShow` to `true`, or a truthy value. Otherwise, you can leave it unset, or false (or falsy).

## JavaScript
After loading the HTML, localBrowse will attempt to run the script at `/programs/YOUR PROGRAM NAME/index.js` with `jQuery.getScript()`. This script should exist, and be where save data is stored. You can expose this script with code like this (assuming your script is located in `./scripts/index.js`):
```javascript
exports.routes['index.js'] = function(req, res) {
	res.sendfile(path.join(__dirname,'scripts/index.js'));
};
```

## Saving
If your program has editing functionality, the following conventions should be used for saving:
* Save button has ID of `#save`
* Save as button has ID of `#saveAs`
* In your index.js file, set $('#file').data('save') to a function(callback), where callback() is passed two string parameters: the filename, and the data to be saved

## Summary
This should be enough for even complex applications to be written. If additional functionality is really needed, please leave an issue.