(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}((function () { 'use strict';

  var foo = {
    a: function () {
      return 'a';
    },
    b: function () {
      return 'b';
    },
  };

  console.log(foo.a());
  console.log(foo.b());

})));
