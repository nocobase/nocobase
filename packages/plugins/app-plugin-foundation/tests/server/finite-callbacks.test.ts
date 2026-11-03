import ts from 'typescript';
import { expect, it } from 'vitest';
import { SourceEvidence } from '../../server/source-evidence.js';
import { StaticValues } from '../../server/static-values.js';

function fixture(expression: string, prelude = '') {
  const file = '/finite-callbacks.ts';
  const ast = ts.createSourceFile(
    file,
    `${prelude}\nexport default ${expression};`,
    ts.ScriptTarget.Latest,
    true,
  );
  const last = ast.statements.at(-1);
  if (!last || !ts.isExportAssignment(last))
    throw new Error('Missing expression');
  const analysis = new SourceEvidence([{ file, ast }], new Map());
  return { evaluator: new StaticValues(analysis), expression: last.expression };
}

it('preserves separate values from each finite map iteration', () => {
  const { evaluator, expression } = fixture(
    "['first', 'second'].map(name => ({ name }))",
  );
  expect(evaluator.expressionBarrier(expression)).toBe('continues');
  const result = evaluator.values(expression);
  expect(result).toHaveLength(1);
  expect(ts.isArrayLiteralExpression(result[0])).toBe(true);
  const array = result[0] as ts.ArrayLiteralExpression;
  expect(
    array.elements.map((element) =>
      evaluator.strings(
        ts.factory.createPropertyAccessExpression(element, 'name'),
      ),
    ),
  ).toEqual([['first'], ['second']]);
});

it('keeps callback captures separate in a second map', () => {
  const { evaluator, expression } = fixture(
    "['first', 'second'].map(name => () => name).map(read => read())",
  );
  expect(evaluator.expressionBarrier(expression)).toBe('continues');
  const array = evaluator.values(expression)[0] as ts.ArrayLiteralExpression;
  expect(array.elements.map((element) => evaluator.strings(element))).toEqual([
    ['first'],
    ['second'],
  ]);
});

it('short circuits some in iteration order', () => {
  const { evaluator, expression } = fixture(
    '[true, false].some(value => { if (value) return true; unknown(); return false; })',
  );
  expect(evaluator.expressionBarrier(expression)).toBe('continues');
  expect(evaluator.booleans(expression)).toEqual([true]);
});

it.each([
  ['input.map(value => value)', ''],
  [
    '[1].map(() => () => value.name).map(read => read())',
    "const value = {name:'first'}; const alias = value; alias.name = 'second';",
  ],
  ['[1].map(value => value)', 'Array.prototype.map = unknown;'],
  [
    '[1].map(value => value)',
    'const prototype = Array.prototype; external(prototype);',
  ],
  [
    '[1].map(value => value)',
    'Object.defineProperty(Array.prototype, "map", {get() {return unknown;}});',
  ],
  [
    '[entry].map(value => value.name)',
    'const entry = {name: 1}; const alias = entry; alias.name = 2;',
  ],
  [
    'array.map(value => value)',
    'const array = ([1] as const); const alias = array; alias.map = unknown;',
  ],
  [
    'array.map(value => value)',
    'const array = [1]; const alias = array; alias.map = unknown;',
  ],
  ['array.map(value => value)', 'const array = [1]; [array.map] = [unknown];'],
  [
    '[{name: 1}].map(value => { const alias = value; alias.name = 2; return value; })',
    '',
  ],
  ['[1].map(callback)', 'let callback = value => value; callback = unknown;'],
  ['array.map(value => value)', 'const array = [1]; array.map = unknown;'],
  ['array.map(value => value)', 'const array = [1]; external(array);'],
  ['[, 1].map(value => value)', ''],
  ['[...input].map(value => value)', ''],
  ['[{ get name() { return 1; } }].map(value => value.name)', ''],
  ['[1].map(value => { external(value); return value; })', ''],
  ['[1].map(value => { throw new Error(); })', ''],
  ['[1].map(value => { unknown(); return value; })', ''],
  ['[{name: 1}].map(value => { value.name = 2; return value; })', ''],
  ['[1].map(async value => value)', ''],
  ['[1].map(value => value, unknown())', ''],
  ['[1]?.map(value => value)', ''],
  ['[false].some(value => { unknown(); return false; })', ''],
] as const)('blocks an unproven finite callback: %s', (source, prelude) => {
  const { evaluator, expression } = fixture(source, prelude);
  expect(evaluator.expressionBarrier(expression)).not.toBe('continues');
  expect(evaluator.values(expression)).toEqual([]);
});

it('rejects arrays over the value budget without returning a prefix', () => {
  const { evaluator, expression } = fixture(
    `[${Array.from({ length: 33 }, () => '1').join(',')}].map(value => value)`,
  );
  expect(evaluator.expressionBarrier(expression)).toBe('unknown');
  expect(evaluator.values(expression)).toEqual([]);
});

it('applies owned pushes in order before a finite map', () => {
  const { evaluator, expression } = fixture(
    `(() => { const paths = []; paths.push('first'); paths.push('second'); return paths.map(path => path); })()`,
  );
  expect(evaluator.expressionBarrier(expression)).toBe('continues');
  const array = evaluator.values(expression)[0] as ts.ArrayLiteralExpression;
  expect(array.elements.map((element) => evaluator.strings(element))).toEqual([
    ['first'],
    ['second'],
  ]);
});

it('copies object rest without excluded keys', () => {
  const { evaluator, expression } = fixture(
    `(() => { const { uploadOne, ...actions } = {uploadOne: {}, findOne: {enabled: true}}; return actions; })()`,
  );
  expect(evaluator.expressionBarrier(expression)).toBe('continues');
  const object = evaluator.values(expression)[0] as ts.ObjectLiteralExpression;
  expect(
    object.properties.map((property) => (property.name as ts.Identifier).text),
  ).toEqual(['findOne']);
});

it.each([
  `(() => { const source = {value: 1}; const alias = source; alias.value = 2; const {...rest} = source; return rest; })()`,
  `(() => { const source = {value: 1}; source.value = 2; const {...rest} = source; return rest; })()`,
  `(() => { const paths = []; external(paths); paths.push('first'); return paths.map(path => path); })()`,
  `(() => { const paths = []; const alias = paths; alias.push = unknown; paths.push('first'); return paths.map(path => path); })()`,
  `(() => { const paths = []; paths.push(unknown()); return paths.map(path => path); })()`,
  `(() => { const paths = []; if (unknown) paths.push('first'); return paths.map(path => path); })()`,
  `(() => { const { omit, ...rest } = {get value() { unknown(); return 1; }}; return rest; })()`,
  `(() => { const { [unknown]: omit, ...rest } = {value: 1}; return rest; })()`,
])('keeps unproven writes and rest opaque: %s', (source) => {
  const { evaluator, expression } = fixture(source);
  expect(evaluator.expressionBarrier(expression)).toBe('unknown');
  expect(evaluator.values(expression)).toEqual([]);
});

it.each([
  '/uploads/hr-files',
  '/one',
  '/a_b/1-2',
  '/',
  '/trailing/',
  '/a/../b',
  '//double',
  'relative',
  '/a b',
])('proves the actual literal path check for %s', (path) => {
  const pattern = String.raw`/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+$/`;
  const { evaluator, expression } = fixture(
    `normalize(${JSON.stringify(path)})`,
    `function normalize(value) { if (!${pattern}.test(value)) throw new Error('path'); return value; }`,
  );
  const valid = /^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+$/.test(path);
  expect(evaluator.expressionBarrier(expression)).toBe(
    valid ? 'continues' : 'terminates',
  );
  expect(evaluator.strings(expression)).toEqual(valid ? [path] : []);
});

it.each([
  'RegExp.prototype.test = unknown;',
  'Object.defineProperty(RegExp.prototype, "test", {get() {return unknown;}});',
])('blocks a replaced regexp intrinsic: %s', (prelude) => {
  const { evaluator, expression } = fixture(
    String.raw`/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+$/.test('/uploads/hr-files')`,
    prelude,
  );
  expect(evaluator.expressionBarrier(expression)).toBe('unknown');
  expect(evaluator.booleans(expression)).toEqual([]);
});

it('bounds expansion of a reused object graph', () => {
  const prelude = `const leaf = {name: 'value'}; const branch = {${Array.from({ length: 32 }, (_, index) => `p${index}: leaf`).join(',')}}; const tree = {${Array.from({ length: 32 }, (_, index) => `p${index}: branch`).join(',')}};`;
  const { evaluator, expression } = fixture(
    '[tree].map(value => value)',
    prelude,
  );
  expect(evaluator.expressionBarrier(expression)).toBe('unknown');
  expect(evaluator.values(expression)).toEqual([]);
});

it('rejects prototype-setting properties in object rest', () => {
  const { evaluator, expression } = fixture(
    `(() => {const {...rest} = {__proto__: {name: 'inherited'}}; return rest;})()`,
  );
  expect(evaluator.expressionBarrier(expression)).toBe('unknown');
  expect(evaluator.values(expression)).toEqual([]);
});

it('rejects escaped nested values in object rest', () => {
  const { evaluator, expression } = fixture(
    `(() => {const child={value:1};const alias=child;alias.value=2; const {...rest}={child};return rest;})()`,
  );
  expect(evaluator.expressionBarrier(expression)).toBe('unknown');
  expect(evaluator.values(expression)).toEqual([]);
});

it('does not snapshot rest from an argument that may have been aliased and rewritten', () => {
  const { evaluator, expression } = fixture(
    `copy({value:1})`,
    `function copy(source) {const alias=source;alias.value=2;const {...rest}=source;return rest;}`,
  );
  expect(evaluator.expressionBarrier(expression)).toBe('unknown');
  expect(evaluator.values(expression)).toEqual([]);
});

it('captures completed local writes in a returned closure', () => {
  const { evaluator, expression } = fixture(
    `make()()`,
    `function make(){const paths=[];paths.push('value');return()=>paths.some(path=>path==='value');}`,
  );
  expect(evaluator.expressionBarrier(expression)).toBe('continues');
  expect(evaluator.booleans(expression)).toEqual([true]);
});

it('rejects escaped nested arrays in object rest', () => {
  const { evaluator, expression } = fixture(
    `(() => {const child=['first'];const alias=child;alias[0]='second'; const {...rest}={child};return rest;})()`,
  );
  expect(evaluator.expressionBarrier(expression)).toBe('unknown');
  expect(evaluator.values(expression)).toEqual([]);
});
