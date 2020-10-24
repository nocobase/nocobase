(function (factory) {
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}((function () { 'use strict';

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var foo_1 = createCommonjsModule(function (module, exports) {
	var foo = exports;

	foo.a = function () {
	  return 'a';
	};
	foo.b = function () {
	  return 'b';
	};
	});
	var foo_2 = foo_1.a;
	var foo_3 = foo_1.b;

	console.log(foo_2());
	console.log(foo_3());

})));
