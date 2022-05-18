(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('foo')) :
	typeof define === 'function' && define.amd ? define(['foo'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.$));
}(this, (function (foo) { 'use strict';

	function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

	var foo__default = /*#__PURE__*/_interopDefaultLegacy(foo);

	foo__default['default'].bar();

})));
