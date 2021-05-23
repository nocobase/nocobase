(function (factory) {
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}((function () { 'use strict';

	function createCommonjsModule(fn, basedir, module) {
		return module = {
			path: basedir,
			exports: {},
			require: function (path, base) {
				return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
			}
		}, fn(module, module.exports), module.exports;
	}

	function commonjsRequire () {
		throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
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

	console.log(foo_1.a());
	console.log(foo_1.b());

})));
