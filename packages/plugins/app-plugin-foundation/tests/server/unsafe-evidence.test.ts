import ts from 'typescript';
import { expect, it } from 'vitest';
import { SourceEvidence } from '../../server/source-evidence.js';

function fixture(body: string) {
  const file = '/unsafe-evidence.ts';
  const ast = ts.createSourceFile(
    file,
    `import {read, databaseManagerToken} from '@nocobase/db';
     import {send} from '@nocobase/app-plugin-notification/server';
     export function first() { ${body} }
     export function second() { send(); }`,
    ts.ScriptTarget.Latest,
    true,
  );
  const roots = ast.statements.filter(ts.isFunctionDeclaration);
  const analysis = new SourceEvidence([{ file, ast }], new Map());
  return { file, roots, analysis };
}

it.each([
  ['capability', 'external(container);', 'unsafeCapability'],
  [
    'value',
    'const db = container.resolve(databaseManagerToken); db.extra = 1;',
    'unsafeValue',
  ],
] as const)(
  'stops discarded contextual evidence after a proven unsafe %s',
  (_, body, flag) => {
    const { file, roots, analysis } = fixture(body);
    const full = analysis.collect(file, roots, true);
    const stopped = analysis.collect(file, roots, true, true);
    expect(full[flag]).toBe(true);
    expect(stopped[flag]).toBe(true);
    expect(stopped.complete).toBe(false);
    expect(full.nodes.get(file)?.has(roots[1])).toBe(true);
    expect(stopped.nodes.get(file)?.has(roots[1])).toBeFalsy();
    expect(
      full.references.has('@nocobase/app-plugin-notification/server'),
    ).toBe(true);
    expect(
      stopped.references.has('@nocobase/app-plugin-notification/server'),
    ).toBe(false);

    // A later query on the same analysis must still collect safe evidence.
    const next = analysis.collect(file, [roots[1]], true, true);
    expect(next).toEqual(analysis.collect(file, [roots[1]], true));
    expect(next.unsafeCapability || next.unsafeValue).toBe(false);
    expect(next.references).toEqual(
      new Set(['@nocobase/app-plugin-notification/server']),
    );
  },
);

it.each(['read();', 'external();', 'external(input);', 'if (unknown) read();'])(
  'keeps all contextual evidence without a proven unsafe escape: %s',
  (body) => {
    const { file, roots, analysis } = fixture(body);
    const full = analysis.collect(file, roots, true);
    expect(full.unsafeCapability || full.unsafeValue).toBe(false);
    expect(analysis.collect(file, roots, true, true)).toEqual(full);
    expect(full.nodes.get(file)?.has(roots[1])).toBe(true);
  },
);

it('preserves page traversal even when discarding unsafe contextual evidence is requested', () => {
  const { file, roots, analysis } = fixture('external(container); read();');
  const full = analysis.collect(file, roots);
  expect(analysis.collect(file, roots, false, true)).toEqual(full);
  expect(full.nodes.get(file)?.has(roots[1])).toBe(true);
  expect(full.references.has('@nocobase/app-plugin-notification/server')).toBe(
    true,
  );
});
