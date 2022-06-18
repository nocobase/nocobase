export function requireModule(module: any) {
  if (typeof module === 'string') {
    module = require(module);
  }
  if (typeof module !== 'object') {
    return module;
  }
  return module.__esModule ? module.default : module;
}

export default requireModule;
