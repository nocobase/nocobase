import React from 'react';

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};

  var target = _objectWithoutPropertiesLoose(source, excluded);

  var key, i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

function a () {
  alert('a');
}

function b1() {
  alert('b1');
}
function b2() {
  alert('b2');
}

var b = /*#__PURE__*/Object.freeze({
  __proto__: null,
  b1: b1,
  b2: b2
});

var _class;
// babel-plugin-react-require
var Foo = function Foo() {
  return /*#__PURE__*/React.createElement("div", null);
}; // Don't support multiple chunks for now
// @babel/plugin-syntax-dynamic-import
// import('./a');
// object-rest-spread

var _bar = bar,
    foo = _bar.foo,
    z = _objectWithoutProperties(_bar, ["foo"]);

console.log(z); // @babel/plugin-proposal-decorators + class

var A = foo(_class = function A() {
  _classCallCheck(this, A);
}) || _class; // export default from

var a$1 = x > 10 ? 'big' : 'small';
console.log(a$1); // export namespace from

export { A, Foo, a, b };
