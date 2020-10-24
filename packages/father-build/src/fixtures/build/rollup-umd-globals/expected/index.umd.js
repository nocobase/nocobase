(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('foo')) :
	typeof define === 'function' && define.amd ? define(['foo'], factory) :
	(global = global || self, factory(global.$));
}(this, (function (foo) { 'use strict';

	foo = foo && foo.hasOwnProperty('default') ? foo['default'] : foo;

	foo.bar();

})));
