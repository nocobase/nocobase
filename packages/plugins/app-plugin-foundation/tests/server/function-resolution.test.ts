import ts from 'typescript';
import { expect, it } from 'vitest';
import { SourceEvidence } from '../../server/source-evidence.js';
import { StaticValues } from '../../server/static-values.js';

function fixture(text: string) {
  const file = '/fixture.ts';
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const analysis = new SourceEvidence([{ file, ast }], new Map());
  const result = ast.statements.at(-1);
  if (!result || !ts.isExportAssignment(result))
    throw new Error('Missing query');
  return { analysis, query: result.expression, ast };
}

it('resolves a returned function consistently across repeated queries', () => {
  const { analysis, query } = fixture(
    'const handler = () => 1; function make() { return handler; } export default make();',
  );
  const first = analysis.functions(query);
  expect(first.map((node) => node.getText())).toEqual(['() => 1']);
  expect(analysis.functions(query)).toEqual(first);
});

it('does not reuse a root answer inside a blocked or exhausted recursive query', () => {
  const { analysis, query } = fixture('export default () => 1;');
  expect(analysis.functions(query)).toHaveLength(1);
  expect(analysis.functions(query, new Set([query]))).toEqual([]);
  const exhausted = new Set<ts.Node>(
    Array.from({ length: 32 }, () => ts.factory.createIdentifier('seen')),
  );
  expect(analysis.functions(query, exhausted)).toEqual([]);
  expect(analysis.functions(query)).toHaveLength(1);
});

it('keeps cycles unresolved and scopes results to the source analysis', () => {
  const cycle = fixture(
    'function one() { return two(); } function two() { return one(); } export default one();',
  );
  expect(cycle.analysis.functions(cycle.query)).toEqual([]);
  expect(cycle.analysis.functions(cycle.query)).toEqual([]);
  const other = fixture('export default () => 2;');
  expect(
    other.analysis.functions(other.query).map((node) => node.getText()),
  ).toEqual(['() => 2']);
});

it('reevaluates allowed-call contexts when reusing lexical references', () => {
  const { analysis, ast } = fixture(
    'const handler = () => 1; consume(handler); export default 0;',
  );
  const statement = ast.statements[0];
  if (!ts.isVariableStatement(statement)) throw new Error('Missing binding');
  const declaration = statement.declarationList.declarations[0];
  expect(analysis.immutable(declaration, () => true)).toBe(true);
  expect(analysis.immutable(declaration)).toBe(false);
  expect(analysis.immutable(declaration, () => true)).toBe(true);
});

it('does not confuse shadowed bindings or ignore writes after a permitted call', () => {
  for (const write of ['', 'handler.extra = 1;']) {
    const { analysis, ast } = fixture(
      `const handler = () => 1; function shadow(handler) { unknown(handler); }
       consume(handler); ${write} export default 0;`,
    );
    const statement = ast.statements[0];
    if (!ts.isVariableStatement(statement)) throw new Error('Missing binding');
    expect(
      analysis.immutable(statement.declarationList.declarations[0], () => true),
    ).toBe(!write);
  }
});

it('keeps an oversized lexical scope unproven on repeated queries', () => {
  const { analysis, ast } = fixture(
    `const handler = () => 1; handler(); ${'void 0;'.repeat(34_000)} export default 0;`,
  );
  const statement = ast.statements[0];
  if (!ts.isVariableStatement(statement)) throw new Error('Missing binding');
  const declaration = statement.declarationList.declarations[0];
  expect(analysis.immutable(declaration)).toBe(false);
  expect(analysis.immutable(declaration)).toBe(false);
});

it('restores the caller traversal path after alias resolution and cycles', () => {
  for (const [source, expected] of [
    ["const a = 'value'; const b = a; export default b;", ["'value'"]],
    ['const a = b; const b = a; export default a;', []],
  ] as const) {
    const { analysis, query } = fixture(source);
    const evaluator = new StaticValues(analysis);
    const marker = ts.factory.createIdentifier('caller');
    const seen = new Set<ts.Node>([marker]);
    expect(evaluator.values(query, seen).map((node) => node.getText())).toEqual(
      expected,
    );
    expect([...seen]).toEqual([marker]);
    expect(evaluator.values(query, seen).map((node) => node.getText())).toEqual(
      expected,
    );
    expect([...seen]).toEqual([marker]);
  }
});

it('restores the traversal path when source resolution throws', () => {
  const { analysis, query } = fixture('export default value;');
  analysis.declarations = () => {
    throw new Error('resolution failed');
  };
  const seen = new Set<ts.Node>();
  expect(() => new StaticValues(analysis).values(query, seen)).toThrow(
    'resolution failed',
  );
  expect(seen.size).toBe(0);
});
