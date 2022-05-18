(function (factory) {
	typeof define === 'function' && define.amd ? define(factory) :
	factory();
}((function () { 'use strict';

	var parse = function parse() {};

	var stringify = function stringify() {};

	var queryString = {
	  parse: parse,
	  stringify: stringify
	};

	queryString.parse();

})));
