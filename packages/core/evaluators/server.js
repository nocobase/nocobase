var _useExportServer = require("./lib/server");

Object.keys(_useExportServer).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _useExportServer[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _useExportServer[key];
    }
  });
});
