var _foo$test;

var foo = {};
export var optionalChaining = foo === null || foo === void 0 ? void 0 : (_foo$test = foo.test) === null || _foo$test === void 0 ? void 0 : _foo$test.abc;
var bar = false;
export var nullishCoalescing = bar !== null && bar !== void 0 ? bar : 'default';
