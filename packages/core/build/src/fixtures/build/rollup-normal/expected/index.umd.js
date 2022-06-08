(function (factory) {
  typeof define === 'function' && define.amd ? define(['bar'], factory) :
  factory();
}((function () { 'use strict';

  function foo () {
    return 'foo';
  }

  console.log(foo());

})));
