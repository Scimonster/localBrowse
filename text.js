/**
 * @file Message interface
 * @author Scimonster
 * @license {@link LICENSE} (MIT)
 * @module text
 */
obj = require('./Object.js');
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
				messages[lang] = require('./languages/'+lang);
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
	fallbacks = obj.unique(fallbacks);
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