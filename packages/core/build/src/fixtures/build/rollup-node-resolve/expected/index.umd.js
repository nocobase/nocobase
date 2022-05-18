(function (factory) {
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}((function () { 'use strict';

	var browser = 'hello browser';

	console.log(browser);

})));
