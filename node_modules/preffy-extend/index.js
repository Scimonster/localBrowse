function preffyExtend() {
	"use strict";
	var hasOwn = Object.prototype.hasOwnProperty;
	var toString = Object.prototype.toString;

	var isPlainObject = function isPlainObject(obj) {
		"use strict";
		if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval) {
			return false;
		}

		var has_own_constructor = hasOwn.call(obj, 'constructor');
		var has_is_property_of_method = hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
		// Not own constructor property must be Object
		if (obj.constructor && !has_own_constructor && !has_is_property_of_method)
			return false;

		// Own properties are enumerated firstly, so to speed up,
		// if last one is own, then all properties are own.
		var key;
		for (key in obj) {}

		return key === undefined || hasOwn.call(obj, key);
	};

	var options, name, src, copy, copyIsArray, clone,
		target = arguments[1] || {},
		weights = arguments[0] || [],
		origWeights = weights.slice(),
		i = 2,
		length = arguments.length,
		deep = false;
	weights.reverse();

	// Handle a deep copy situation
	if (typeof target === "boolean") {
		deep = target;
		target = arguments[2] || {};
		// skip the boolean and the target
		i = 3;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if (typeof target !== "object" && typeof target !== "function") {
		target = {};
	}

	for (; i < length; ++i) {
		// Only deal with non-null/undefined values
		if ((options = arguments[i]) != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target === copy) {
					continue;
				}

				// Don't replace if replacement is weighted lower
				if (weights.indexOf(typeof src) > weights.indexOf(typeof copy)) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if (deep && copy && (isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
					if (copyIsArray) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];

					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[name] = preffyExtend(origWeights, deep, clone, copy);

				// Don't bring in undefined values
				} else if (copy !== undefined) {
					target[name] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

typeof module!='undefined'?module.exports = preffyExtend:null;