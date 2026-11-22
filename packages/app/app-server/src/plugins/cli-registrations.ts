/**
 * The packages an application's CLI composition root registers: the members of the array it passes to
 * `defineCliPlugins([...])`, each traced to the `<package>/cli` default import it names. An import the array does not
 * use and code inside comments register nothing.
 *
 * `plugin inspect` and the App Foundation plugins page both read `cli/plugins` through this, so they agree on which
 * plugins the CLI registers. It needs no compiler: the source checkout's `cli/plugins.ts` and the `cli/plugins.js` a
 * build compiles from it — where a deployment has no TypeScript to parse with — have the same imports and the same
 * array, and both are read the same way.
 */
export function listCliPluginRegistrations(sourceText: string): string[] {
  const code = withoutComments(sourceText);
  const imports = new Map<string, string>();
  for (const match of code.matchAll(
    /\bimport\s+([A-Za-z_$][\w$]*)\s*(?:,\s*\{[^}]*\}\s*)?from\s*(['"])([^'"]+)\2/gu,
  )) {
    imports.set(match[1], match[3]);
  }
  const array = /\bdefineCliPlugins\s*\(\s*\[([^\]]*)\]/u.exec(code);
  if (!array) return [];
  const registered: string[] = [];
  for (const element of array[1].split(',')) {
    const specifier = imports.get(element.trim());
    if (!specifier?.endsWith('/cli')) continue;
    const packageName = specifier.slice(0, -'/cli'.length);
    if (!registered.includes(packageName)) registered.push(packageName);
  }
  return registered;
}

/** `source` with its comments blanked out, leaving strings and template literals as they are. */
function withoutComments(source: string): string {
  let result = '';
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '/' && next === '/') {
      const end = source.indexOf('\n', index);
      index = end === -1 ? source.length : end;
      continue;
    }
    if (char === '/' && next === '*') {
      const end = source.indexOf('*/', index + 2);
      index = end === -1 ? source.length : end + 2;
      result += ' ';
      continue;
    }
    if (char === "'" || char === '"' || char === '`') {
      let end = index + 1;
      while (end < source.length && source[end] !== char) {
        end += source[end] === '\\' ? 2 : 1;
      }
      result += source.slice(index, end + 1);
      index = end + 1;
      continue;
    }
    result += char;
    index += 1;
  }
  return result;
}
