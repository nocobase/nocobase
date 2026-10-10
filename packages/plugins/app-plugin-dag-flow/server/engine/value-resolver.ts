function readPath(source: unknown, path: string): unknown {
  const parts = path
    .replace(/^ctx\./, '')
    .split('.')
    .filter(Boolean);
  let current = source;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function resolveWorkflowValue(
  value: unknown,
  scope: Record<string, unknown>,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => resolveWorkflowValue(item, scope));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        resolveWorkflowValue(item, scope),
      ]),
    );
  }
  if (typeof value !== 'string') {
    return value;
  }

  const exact = value.match(/^\s*\{\{\s*([^{}]+?)\s*\}\}\s*$/);
  if (exact) {
    return readPath(scope, exact[1]);
  }
  if (/^(?:ctx\.)?\$[\w.]+$/.test(value)) {
    return readPath(scope, value);
  }

  return value.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_match, path: string) => {
    const resolved = readPath(scope, path.trim());
    if (resolved == null) {
      return '';
    }
    return typeof resolved === 'object'
      ? JSON.stringify(resolved)
      : String(resolved);
  });
}
