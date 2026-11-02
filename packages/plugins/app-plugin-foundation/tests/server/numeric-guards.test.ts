import ts from 'typescript';
import { expect, it } from 'vitest';
import { SourceEvidence } from '../../server/source-evidence.js';
import { StaticValues } from '../../server/static-values.js';

function fixture(expression: string, prelude = '') {
  const file = '/numeric-guard.ts';
  const ast = ts.createSourceFile(
    file,
    `${prelude}\nexport default ${expression};`,
    ts.ScriptTarget.Latest,
    true,
  );
  if (
    (ast as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] })
      .parseDiagnostics.length
  )
    throw new Error('Invalid fixture');
  const last = ast.statements.at(-1);
  if (!last || !ts.isExportAssignment(last))
    throw new Error('Missing expression');
  const analysis = new SourceEvidence([{ file, ast }], new Map());
  return { evaluator: new StaticValues(analysis), expression: last.expression };
}

it.each([
  ['64 * 1024 <= 65536', true],
  ['2 ** 10 > 1000', true],
  ['(10 - 4) / 3 >= 3', false],
  ['10 % 3 < 2', true],
  ['-4 * +2 <= -8', true],
  ['1 / 0 > 1', true],
  ['0 / 0 >= 0', false],
  ['0 / 0 < 0', false],
  ['-0 < 0', false],
] as const)('evaluates the closed numeric condition %s', (source, expected) => {
  const { evaluator, expression } = fixture(source);
  expect(evaluator.booleans(expression)).toEqual([expected]);
});

it('follows immutable numeric aliases and comparison aliases', () => {
  const { evaluator, expression } = fixture(
    'valid',
    'const unit = 1024; const limit = 64 * unit; const valid = limit <= 65536;',
  );
  expect(evaluator.booleans(expression)).toEqual([true]);
});

it.each([
  ['size > 1', 'let size = 3; size = 0;'],
  ['size > 1', 'let size = 3;'],
  ['size > 1', 'const size = 3; size = 0;'],
  ['size > 1', 'const size = 3; [size] = [0];'],
  ['size > 1', 'const size = 3; ({size} = input);'],
  ['size > 1', 'const size = 3; for (size of input) {}'],
  ['size > 1', 'const size = unknown();'],
  ['size > 1', 'const size = { valueOf() { throw new Error(); } };'],
  ['size > 1', 'const size = "3";'],
  ['entry.size > 1', 'const entry = { get size() { return 3; } };'],
  ['size > 1', 'const size = other; const other = size;'],
  ['size > 1', 'const size = 3n;'],
] as const)(
  'keeps uncertain/coercible condition %s unproven (%s)',
  (source, prelude) => {
    const { evaluator, expression } = fixture(source, prelude);
    expect(evaluator.booleans(expression)).toEqual([]);
  },
);

it.each([
  ['2 * 1024 > 1024', 'terminates'],
  ['2 * 1024 < 1024', 'continues'],
] as const)(
  'preserves a constructor guard outcome for %s',
  (condition, expected) => {
    const { evaluator, expression } = fixture(
      'make()',
      `function make() { if (${condition}) throw new Error('size'); return []; }`,
    );
    expect(evaluator.expressionBarrier(expression)).toBe(expected);
  },
);

it('does not discard an unknown effect before a closed numeric condition', () => {
  const { evaluator, expression } = fixture(
    'make()',
    'function make() { unknown(); if (2 * 1024 < 1024) throw new Error(); return []; }',
  );
  expect(evaluator.expressionBarrier(expression)).toBe('unknown');
});

it.each([
  ['function make() { if (unknown()) return []; return []; }', 'unknown'],
  [
    'function make() { if (unknown()) throw new Error(); return []; }',
    'unknown',
  ],
  [
    'function stop() { throw new Error(); } function make() { if (stop()) return []; return []; }',
    'terminates',
  ],
  [
    'const gate = { get allowed() { unknown(); return true; } }; function make() { if (gate.allowed) return []; return []; }',
    'unknown',
  ],
  [
    'function check() { unknown(); return false; } function make() { if (check()) throw new Error(); return []; }',
    'unknown',
  ],
  [
    'function check() { return false; } function make() { if (check()) throw new Error(); return []; }',
    'continues',
  ],
] as const)(
  'checks condition completion before choosing a branch: %s',
  (source, expected) => {
    const { evaluator, expression } = fixture('make()', source);
    expect(evaluator.expressionBarrier(expression)).toBe(expected);
  },
);

it.each([
  ["['stream', 'redirect'].includes('stream')", true],
  ["['stream', 'redirect'].includes('other')", false],
  ['[1].includes("1")', false],
  ['[0 / 0].includes(0 / 0)', true],
  ['[-0].includes(0)', true],
  ['[].includes(null)', false],
  ['[false, null].includes(null)', true],
  ['Number.isSafeInteger(64 * 1024)', true],
  ['Number.isSafeInteger(2 ** 53)', false],
  ['Number.isInteger(3 / 2)', false],
  ['Number.isFinite(1 / 0)', false],
  ['Number.isNaN(0 / 0)', true],
] as const)(
  'proves a closed configuration guard: %s',
  (condition, expected) => {
    const { evaluator, expression } = fixture(condition);
    expect(evaluator.booleans(expression)).toEqual([expected]);
    expect(evaluator.expressionBarrier(expression)).toBe('continues');
    const guarded = fixture(
      `(()=>{if (${condition}) throw new Error(); return [];})()`,
    );
    expect(guarded.evaluator.expressionBarrier(guarded.expression)).toBe(
      expected ? 'terminates' : 'continues',
    );
  },
);

it.each([
  [
    'list.includes("stream")',
    'const list = ["stream"]; list.includes = unknown;',
  ],
  ['[...input].includes("stream")', ''],
  ['[,].includes(null)', ''],
  ['[unknown()].includes("stream")', ''],
  ['["stream"].includes(unknown())', ''],
  ['["stream"].includes("stream", unknown())', ''],
  ['["stream"].includes(...input)', ''],
  ['["stream"]?.includes("stream")', ''],
  ['["stream"].includes?.("stream")', ''],
  ['[{ valueOf() { unknown(); } }].includes(1)', ''],
  [
    'Number.isSafeInteger(1)',
    'const Number = { isSafeInteger() { unknown(); return true; } };',
  ],
  ['Number.isSafeInteger(value * 2)', 'let value = 3;'],
  ['Number.isSafeInteger(value * 2)', 'const value = 3; [value] = input;'],
] as const)(
  'keeps unsupported guard inputs opaque: %s',
  (condition, prelude) => {
    const { evaluator, expression } = fixture(condition, prelude);
    expect(evaluator.booleans(expression)).toEqual([]);
  },
);

it('bounds literal membership evaluation without truncating the receiver', () => {
  for (const size of [32, 33]) {
    const { evaluator, expression } = fixture(
      `[${Array.from({ length: size }, (_, index) => index).join(',')}].includes(${size - 1})`,
    );
    expect(evaluator.booleans(expression)).toEqual(size === 32 ? [true] : []);
  }
});
