export function requireModule(m: any) {
  if (typeof m === 'string') {
    m = require(m);
  }

  if (typeof m !== 'object') {
    return m;
  }

  return m.__esModule ? m.default : m;
}

export default requireModule;

export async function importModule(m: string, options?: any) {
  const r = (await import(m, options)).default;
  return r.__esModule ? r.default : r;
}
