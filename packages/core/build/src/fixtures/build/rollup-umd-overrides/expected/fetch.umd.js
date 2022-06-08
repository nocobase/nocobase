(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, (global.foo = global.foo || {}, global.foo.fetch = factory()));
}(this, (function () { 'use strict';

  function fetch () {
    return 'foo.fetch';
  }

  return fetch;

})));
