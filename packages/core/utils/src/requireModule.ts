/**
 * @deprecated
 */
export function requireModule(m: any) {
  if (typeof m === 'string') {
    m = require(m);
  }
  if (typeof m !== 'object') {
    return m;
  }
  return m.__esModule ? m.default : m;
}

export async function importModule(m: any) {
  if (typeof m === 'string') {
    m = await import(m);
  }
  if (typeof m !== 'object') {
    return m;
  }
  return m.__esModule || m.default ? m.default : m;
}
