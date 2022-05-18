(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.foo = {}));
}(this, (function (exports) { 'use strict';

	var hierarchy = function hierarchy() {};

	const foo = () => {
	};

	var a = function a() {};

	exports.a = a;
	exports.foo = foo;
	exports.hierarchy = hierarchy;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
