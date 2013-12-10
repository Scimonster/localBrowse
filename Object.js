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
		return t;
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
		return res;
	},

	'filter': function(self, fun, thisp) {
		if (self == null || typeof fun != 'function') {
			throw new TypeError();
		}
		var res = {};
		var t = Object(self);
		for (var i in t) {
			if (t.hasOwnProperty(i)) {
				var val = t[i]; // in case fun mutates it
				console.log(i)
				console.log(val)
				if (fun.call(thisp, val, i, t)) {
					console.log(true)
					// define property on res in the same manner as it was originally defined
					var props = Object.getOwnPropertyDescriptor(t, i);
					props.value = val;
					Object.defineProperty(res, i, props);
				}
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
		return Array.prototype.filter.call(self, function(val, i, arr) {
			// force using Array's filter even for strings or other array-likes
			return arr.valueOf().indexOf(val) == i; // only keep first occurrence of anything
		});
	}

};
