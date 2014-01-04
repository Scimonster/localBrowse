/**
 * @file Extensions to Object.prototype
 * @author Scimonster
 * @license {@link LICENSE} (AGPL)
 */

module.exports = {

	'foreach': function(self, fun, thisp) {
		if (self == null || typeof fun != 'function') {
			throw new TypeError();
		}
		var t = Object(self);
		for (var i in t) {
			if (t.hasOwnProperty(i)) {
				if (fun.call(thisp, t[i], i, t) === false) {
					break; // return false from inside the foreach function is analagous to a break
				}
			}
		}
	},

	'map': function(self, fun, thisp, sameprops) {
		if (self == null || typeof fun != 'function') {
			throw new TypeError();
		}
		var t = Object(self);
		var res = {};
		for (var i in t) {
			if (t.hasOwnProperty(i)) {
				var val = fun.call(thisp, t[i], i, t);
				if (sameprops) {
					// the new property should have the same enumerate/write/etc as the original
					var props = Object.getOwnPropertyDescriptor(t, i);
					props.value = val;
					Object.defineProperty(res, i, props);
				} else {
					res[i] = val;
				}
			}
		}
		if (Array.isArray(self) || typeof self == 'string') { // came as an array, return an array
			var arr = [];
			for (var i in res) {
				arr[Number(i)] = res[i];
			}
			res = arr.filter(function(v){return v}); // for...in isn't guaranteed to give any meaningful order
			if (typeof self == 'string') {
				res = res.join('');
			}
		}
		return res;
	},

	'filter': function(self, fun, thisp) {
		if (self == null) {
			throw new TypeError('self is null');
		}
		switch (typeof fun) {
			case 'function':
				break; // do nothing
			case 'string':
			case 'number':
				return self[fun]; // str/num is just the property
			case 'boolean': // boolean shortcuts to filter only truthy/falsy values
				if (fun) {
					fun = function(v){return v};
				} else {
					fun = function(v){return !v};
				}
				break;
			case 'object':
				var funOrig = fun; // save it
				if (fun instanceof RegExp) { // test the val against the regex
					fun = function(v){return funOrig.test(v)};
					break;
				} else if (Array.isArray(fun)) { // keep these keys
					fun = function(v,k){return funOrig.indexOf(k)>-1};
					break;
				}
			default:
				throw new TypeError('fun is not a supported type');
		}
		var res = {};
		var t = Object(self);
		for (var i in t) {
			if (t.hasOwnProperty(i)) {
				var val = t[i]; // in case fun mutates it
				if (fun.call(thisp, val, i, t)) {
					// define property on res in the same manner as it was originally defined
					var props = Object.getOwnPropertyDescriptor(t, i);
					props.value = val;
					Object.defineProperty(res, i, props);
				}
			}
		}
		if (Array.isArray(self) || typeof self == 'string') { // came as an array, return an array
			var arr = [];
			for (var i in res) {
				arr[Number(i)] = res[i];
			}
			res = arr.filter(function(v){return v}); // for...in isn't guaranteed to give any meaningful order
			// can't use obj.filter(arr,true) here because that would infitely recurse
			if (typeof self == 'string') {
				res = res.join('');
			}
		}
		return res;
	},

	'some': function(self, fun, thisp) {
		if (self == null || typeof fun != 'function') {
			throw new TypeError();
		}
		var t = Object(self);
		for (var i in t) {
			if (t.hasOwnProperty(i) && fun.call(thisp, t[i], i, t)) {
				return true;
			}
		}
		return false;
	},

	'every': function(self, fun, thisp) {
		if (self == null || typeof fun != 'function') {
			throw new TypeError();
		}
		var t = Object(self);
		for (var i in t) {
			if (t.hasOwnProperty(i) && fun.call(thisp, t[i], i, t)) {
				return false;
			}
		}
		return true;
	},

	'indexOf': function(self, searchElement, loose) {
		// searchElement: what to search for (if a function, pass val, index, and obj; evaluate response)
		// loose {bool=false}: if true: if an array or object, JSON.stringify, then compare
		// loose, if searchElement is function: object to be passed as self
		// return index or null, if not found
		if (self == null) {
			throw new TypeError();
		}
		if (typeof self == 'string' || Array.isArray(self) && typeof searchElement != 'function') {
			return self.indexOf(searchElement);
		}
		if (loose && typeof searchElement == 'object') {
			searchElement = JSON.stringify(searchElement);
		}
		var t = Object(self);
		for (var i in t) {
			if (t.hasOwnProperty(i)) {
				if (typeof searchElement == 'function') { // if function returns true, so we're at it
					if(searchElement.call(loose, t[i], i, t)) {
						return i;
					}
				} else { // check for a match
					var value = t[i];
					if (loose) {
						value = JSON.stringify(value);
					}
					if (searchElement === value) {
						return i;
					}
				}
				
			}
		}
		return null;
	},

	'unique': function(self) {
		if (self == null) {
			throw new TypeError();
		}
		return module.exports.filter(self, function(val, i, obj) {
			return module.exports.indexOf(obj, val) == i; // only keep first occurrence of anything
		});
	}

};
