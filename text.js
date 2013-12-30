/**
 * @file Message interface
 * @author Scimonster
 * @license {@link LICENSE} (AGPL)
 * @module text
 */
var obj = require('./Object.js'), extend = require('extend');
/**
 * Create a function to get system messages
 * @param {string} lang A language code to get for
 * @return {function} Function taking a single parameter, the message name, and returning the localized text
 */
function gettext(lang) {
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
	messages = extend.apply(null, [true, {}].concat(fallbacks.reverse().map(function(fb){return messages[fb]})));
	return function _(message) {
		function replace(str, params) {
			// takes a str in format of "replacement 1: $1, replacement 2: $2"
			if (typeof str != 'string') {
				return str;
			}
			return str.replace(/\$(\d)/g, function(match, num){return params[num-1]});
		}

		if (message) { // if we have a message
			var args = [].slice.call(arguments, 1);
			if (messages.hasOwnProperty(message)) { // we have a message in one of our fallbacks
				return replace(messages[message], args);
			}
			return message; // nowhere, so return the original message
		} else { // return them all
			return messages;
		}
	};
};
module.exports = gettext;
module.exports.load = function() {
	return gettext(require('./config').lang.code);
};