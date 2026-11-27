import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const client = path.resolve(import.meta.dirname, '../../../client');
const panel = path.join(client, 'panel');

/** The relative modules a file loads when it loads: static value imports and re-exports, never `import()` or types. */
function staticImports(file: string): string[] {
  const source = readFileSync(file, 'utf8');
  const specifiers: string[] = [];
  const pattern =
    /^\s*(import|export)\s+(type\s+)?([^'";]*?\sfrom\s+)?['"]([^'"]+)['"]/gmu;
  for (const match of source.matchAll(pattern)) {
    if (match[2]) continue;
    // `import { type A, type B } from` loads nothing either.
    const names = match[3]?.match(/\{([^}]*)\}/u)?.[1];
    if (
      names &&
      !/^\s*\*/u.test(match[3] ?? '') &&
      names
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
        .every((name) => name.startsWith('type '))
    )
      continue;
    specifiers.push(match[4]!);
  }
  return specifiers
    .filter((specifier) => specifier.startsWith('.'))
    .map((specifier) => {
      const resolved = path.resolve(path.dirname(file), specifier);
      const base = resolved.replace(/\.js$/u, '');
      const candidate = [`${base}.ts`, `${base}.tsx`, resolved].find(
        (option) => existsSync(option) && !option.endsWith('/'),
      );
      if (!candidate) throw new Error(`${file}: cannot resolve ${specifier}`);
      return candidate;
    });
}

function reached(entries: readonly string[]): Set<string> {
  const seen = new Set<string>();
  const queue = [...entries];
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    queue.push(...staticImports(file));
  }
  return seen;
}

describe('the panel loads lazily', () => {
  it('is never reached from the eager entries', () => {
    const graph = reached(
      ['index.ts', 'plugin.ts', 'launchers/index.ts'].map((entry) =>
        path.join(client, entry),
      ),
    );
    expect(graph.size).toBeGreaterThan(3);
    expect(
      [...graph]
        .filter((file) => file.startsWith(`${panel}${path.sep}`))
        .map((file) => path.relative(client, file)),
    ).toEqual([]);
  });

  it('keeps the launchers away from the panel, even for types', () => {
    const launchers = path.join(client, 'launchers');
    for (const name of readdirSync(launchers)) {
      const source = readFileSync(path.join(launchers, name), 'utf8');
      expect([name, /['"]\.\.\/panel[/'"]/u.test(source)]).toEqual([
        name,
        false,
      ]);
    }
  });

  it('follows re-exports and value imports (the check would see a panel import)', () => {
    const graph = reached([path.join(panel, 'index.ts')]);
    expect(graph.has(path.join(panel, 'chat-panel.tsx'))).toBe(true);
    expect(
      graph.has(path.join(panel, 'components', 'agent-composer.tsx')),
    ).toBe(true);
  });
});
