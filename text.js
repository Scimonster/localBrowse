/**
 * @file Message interface
 * @author Scimonster
 * @license {@link LICENSE} (MIT)
 * @module text
 */
try { // can only run once without errors
	require('./Object.js')(); // extend Object (and Array)
} catch (e) {}
/**
 * Create a function to get system messages
 * @param {string} lang A language code to get for
 * @return {function} Function taking a single parameter, the message name, and returning the localized text
 */
module.exports = function gettext(lang) {
	var messages = {}, fallbacks = [lang];
	function getlang(lang) {
		if (!messages.hasOwnProperty(lang)) {
			try { // test for messages in this language
				messages[lang] = _require(/*'./languages/'+*/lang);
				fallbacks.push.apply(fallbacks, messages[lang].fallbacks);
				messages[lang] = messages[lang].messages;
			} catch (e) { // no langlist
				fallbacks.splice(fallbacks.indexOf(lang), 1); // remove it
				return getlang('en'); // default to English
			}
			return false;
		}
		return true;
	}
	getlang(lang);
	// if we've made it this far, we have a langlist
	// resolve fallbacks
	while (!fallbacks.every(function(fb){return getlang(fb)})) {}
	fallbacks = fallbacks.unique();
	console.log(messages);
	console.log(fallbacks);
	return function _(message) {
		var args = [].slice.call(arguments, 1);
		for (lang in fallbacks) { // loop through fallbacks
			if (messages[fallbacks[lang]].hasOwnProperty(message)) { // the language has our message
				return replace(messages[fallbacks[lang]][message], args);
			}
		}
		return message; // nowhere, so return the original message
	};
};

function replace(str, params) {
	// takes a str in format of "replacement 1: $1, replacement 2: $2"
	return str.replace(/\$(\d)/g, function(match, num){return params[num-1]});

}

// just for testing period
function _require(lang) {
	var m = {
		'en': {
			fallbacks: ['en'],
			messages: {
				'a': 'a',
				'b': 'b',
				'c': 'c',
				'd': 'd',
				'e': 'e',
				
				'dirlist-file-size-items': '$1 items',
				'paste-merge-folder': 'A $1 folder already exists in "$2".<br/>Do you want to merge these folders? Merging will ask for confirmation in case of file conflicts.'
			}
		},
		'fr': {
			fallbacks: ['en'],
			messages: {
				'a': 'a',
				'b': 'b',
				'c': 'c',
				'd': 'd'
			}
		},
		'it': {
			fallbacks: ['fr','en'],
			messages: {
				'a': 'a',
				'b': 'b',
				'c': 'c'
			}
		},
		'he': {
			fallbacks: ['en'],
			messages: {
				'a': 'א',
				'b': 'ב'
			}
		},
		'yi': {
			fallbacks: ['du','he'],
			messages: {
				'a': 'א'
			}
		}
	};
	if (m[lang]) {return m[lang]}
	else {console.log('error with '+lang);throw new Error('could not load language')}
}
