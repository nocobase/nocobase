const esmImport = require('esm')(module);

export function requireModule(m: any) {
  if (typeof m === 'string') {
    m = esmImport(m);
  }
  if (typeof m !== 'object') {
    return m;
  }
  return m.__esModule ? m.default : m;
}

export default requireModule;
