(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = global || self, global.foo = factory());
}(this, (function () { 'use strict';

	var index = (function () {
	  return 1;
	});

	return index;

})));
