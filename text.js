/**
 * @file Message interface
 * @author Scimonster
 * @license {@link LICENSE} (MIT)
 * @module text
 */

require('./Object.js')(); // extend Object (and Array)
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
				fallbacks.splice(fallbacks.indexOf(lang),1); // remove it
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
	return function(message) {
		for (lang in fallbacks) { // loop through fallbacks
			if (messages[fallbacks[lang]].hasOwnProperty(message)) { // the language has our message
				return messages[fallbacks[lang]][message];
			}
		}
		return message; // nowhere, so return the original message
	};
};

// just for testing period
function _require(lang) {
	console.log(lang)
	var m = {
		'en': {
			fallbacks: ['en'],
			messages: {
				'a': 'a',
				'b': 'b',
				'c': 'c',
				'd': 'd',
				'e': 'e'
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
