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

it('reads absent own configuration fields and short circuits a non-nullish path', () => {
  const { evaluator, expression } = fixture(
    "[{accessPath:'/uploads/hr-files',actions:{findOne:{}}}].map(entry => { const {uploadOne, uploadMany, ...actions}=entry.actions; return {path:entry.accessPath ?? unknown(), actions}; })",
  );
  expect(evaluator.expressionBarrier(expression)).toBe('continues');
  const result = evaluator.values(expression)[0] as ts.ArrayLiteralExpression;
  expect(
    evaluator.strings(
      ts.factory.createPropertyAccessExpression(result.elements[0], 'path'),
    ),
  ).toEqual(['/uploads/hr-files']);
});

it.each([
  '[{get actions(){ unknown(); return {}; }}].map(entry => { const {missing,...actions}=entry.actions; return actions; })',
  '[{actions:{__proto__:unknown}}].map(entry => entry.actions.missing)',
  '[{actions:{}}].map(entry => entry.actions.missing ?? unknown())',
])('keeps unknown configuration states blocked: %s', (source) => {
  const { evaluator, expression } = fixture(source);
  expect(evaluator.expressionBarrier(expression)).not.toBe('continues');
  expect(evaluator.values(expression)).toEqual([]);
});

it('does not infer absence after prototype exposure', () => {
  const { evaluator, expression } = fixture(
    '[{}].map(entry=>entry.missing)',
    'external(Object.prototype);',
  );
  expect(evaluator.expressionBarrier(expression)).not.toBe('continues');
  expect(evaluator.values(expression)).toEqual([]);
});

it('completes an ordinary upload configuration in callback order', () => {
  const { evaluator, expression } = fixture(
    "(() => { const paths=[]; const entries=[{name:'files',disk:'local',accessMode:'stream',actions:{findOne:{},uploadOne:{maxSize:100}}}].map(entry=>{ const accessPath=entry.accessPath ?? '/uploads/files'; if(paths.some(path=>path===accessPath)) throw new Error('duplicate'); paths.push(accessPath); if(!entry.disk) throw new Error('disk'); if(entry.accessMode !== undefined && !['stream','redirect'].includes(entry.accessMode)) throw new Error('mode'); const {uploadOne,uploadMany,...actions}=entry.actions; for(const upload of [uploadOne,uploadMany]){if(upload===undefined)continue;if(!upload||typeof upload!=='object'||Object.keys(upload).some(key=>key!=='maxSize'))throw new Error('config'); if(upload.maxSize!==undefined&&(!Number.isSafeInteger(upload.maxSize)||upload.maxSize<=0))throw new Error('size');} return {...entry,accessPath,actions,uploadOne,uploadMany}; }); return entries.map(entry=>entry.name); })()",
  );
  expect(evaluator.expressionBarrier(expression)).toBe('continues');
  const array = evaluator.values(expression)[0] as ts.ArrayLiteralExpression;
  expect(array.elements.map((e) => evaluator.strings(e))).toEqual([['files']]);
});

it.each([
  '(async () => { for (const entry of await entries()) { if (!entry) throw new Error(); } return "done"; })()',
  '(async () => { for await (const entry of [1]) { if (!entry) throw new Error(); } return "done"; })()',
])('keeps async iteration outside finite configuration proof: %s', (source) => {
  const { evaluator, expression } = fixture(
    source,
    'async function entries(){return [1];}',
  );
  expect(evaluator.expressionBarrier(expression)).not.toBe('continues');
  expect(evaluator.values(expression)).toEqual([]);
});

it.each([
  '[{},{}].map(entry=>entry.missing ?? unknown())',
  "(() => {const paths=[];return ['same','same'].map(path=>{if(paths.some(existing=>existing===path))throw new Error('duplicate');paths.push(path);return path;});})()",
])(
  'keeps failure in a later configuration iteration blocking: %s',
  (source) => {
    const { evaluator, expression } = fixture(source);
    expect(evaluator.expressionBarrier(expression)).not.toBe('continues');
    expect(evaluator.values(expression)).toEqual([]);
  },
);

it('does not trust rewritten Object.keys', () => {
  const { evaluator, expression } = fixture(
    '[{value:1}].map(entry=>Object.keys(entry))',
    'Object.keys=unknown;',
  );
  expect(evaluator.expressionBarrier(expression)).not.toBe('continues');
  expect(evaluator.values(expression)).toEqual([]);
});

it('projects a finite read-only configuration table to its numeric maximum', () => {
  const { evaluator, expression } = fixture(
    'Number.isSafeInteger(Math.max(...Object.values(table).map(rule=>rule.maxSize)))',
    'const MB=1024*1024;const table={small:{maxSize:20*MB},large:{maxSize:200*MB}};',
  );
  expect(evaluator.expressionBarrier(expression)).toBe('continues');
  expect(evaluator.booleans(expression)).toEqual([true]);
});

it.each([
  'const alias=table.large;alias.maxSize=-1;',
  'external(table.large);',
  'const values=Object.values(table);external(values);',
  'Math.max=unknown;',
  'const M=Math;external(M);',
])('rejects exposed or rewritten numeric configuration: %s', (suffix) => {
  const { evaluator, expression } = fixture(
    'Number.isSafeInteger(Math.max(...Object.values(table).map(rule=>rule.maxSize)))',
    'const table={large:{maxSize:100}};' + suffix,
  );
  expect(evaluator.expressionBarrier(expression)).not.toBe('continues');
});

it.each([
  ['', true, true],
  ['', false, false],
  ['export {table};', true, false],
  ['const exported=import("./config.js");', true, false],
  ['const alias=table.large;external(alias);', true, false],
  ['external(table.large);', true, false],
] as const)(
  'keeps internal configuration exports fenced: %s / complete=%s',
  (extra, complete, accepted) => {
    const sources = [
      {
        file: '/main.ts',
        ast: ts.createSourceFile(
          '/main.ts',
          "import {table} from './config.js';" +
            extra +
            'export default Math.max(...Object.values(table).map(rule=>rule.maxSize));',
          ts.ScriptTarget.Latest,
          true,
        ),
      },
      {
        file: '/config.ts',
        ast: ts.createSourceFile(
          '/config.ts',
          'export const table={large:{maxSize:100}};',
          ts.ScriptTarget.Latest,
          true,
        ),
      },
    ];
    const a = new SourceEvidence(
      sources,
      new Map([['/main.ts\0./config.js', '/config.ts']]),
      undefined,
      { sources, complete, roots: ['/main.ts'] },
    );
    const e = new StaticValues(a),
      expression = (sources[0].ast.statements.at(-1) as ts.ExportAssignment)
        .expression;
    expect(e.expressionBarrier(expression) === 'continues').toBe(accepted);
  },
);

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

it('preserves host contribution scopes without executing deferred router factories', () => {
  const { evaluator, expression } = fixture(
    'make().map(contribution=>({scope:contribution.scope,createRouter:async app=>{unknown();return await contribution.createRouter(app);}}))',
    "import {defineApiRoutes,defineRootRoutes,defineRepositoryApiRoutes} from '@nocobase/app-server/router'; function make(){const entries=[{name:'files',policy:principal=>({read:false}),actions:{findOne:{}}}].map(entry=>({...entry}));const crud=defineRepositoryApiRoutes({principal:c=>c,repositories:entries.map(({name,policy,actions})=>({name,policy,actions}))});return [defineApiRoutes(async app=>unknown()),crud,defineRootRoutes(app=>unknown())];}",
  );
  expect(evaluator.expressionBarrier(expression)).toBe('continues');
  const values = evaluator.values(expression)[0] as ts.ArrayLiteralExpression;
  expect(
    values.elements.map((value) =>
      evaluator.strings(
        ts.factory.createPropertyAccessExpression(value, 'scope'),
      ),
    ),
  ).toEqual([['api'], ['api'], ['root']]);
});

it.each([
  "defineRepositoryApiRoutes({repositories:[{name:'files',policy:p=>p,actions:{findOne:{}}}]})",
  "defineRepositoryApiRoutes({principal:c=>c,repositories:[{name:'files',policy:p=>p,actions:{unknown:{}}}]})",
  "defineRepositoryApiRoutes({principal:c=>c,repositories:[{name:'files',policy:p=>p,actions:{findMany:{maxLimit:-1}}}]})",
  'defineApiRoutes(unknown())',
])('rejects unproved host contribution configuration: %s', (source) => {
  const { evaluator, expression } = fixture(
    source,
    "import {defineRepositoryApiRoutes,defineApiRoutes} from '@nocobase/app-server/router';",
  );
  expect(evaluator.expressionBarrier(expression)).not.toBe('continues');
});

it('keeps copied metadata opaque when a later callback reads its fields', () => {
  const { evaluator, expression } = fixture(
    '[1].map(()=>({schema})).map(entry=>entry.schema.type)',
    "export const schema={get type(){unknown();return 'string';}};",
  );
  expect(evaluator.expressionBarrier(expression)).not.toBe('continues');
  expect(evaluator.values(expression)).toEqual([]);
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

it.each([
  "for(const entry of entries)entry.name='changed';",
  "for(const entry of entries){const alias=entry;alias.name='changed';}",
  'for(const entry of entries)external(entry);',
  'for(const entry of entries)external(entry.options);',
])(
  'refuses a preceding loop that mutates or exports a callback input: %s',
  (prefix) => {
    const { evaluator, expression } = fixture(
      'entries.map(entry=>entry.name)',
      "const entries=[{name:'original',options:{}}];" + prefix,
    );
    expect(evaluator.expressionBarrier(expression)).not.toBe('continues');
    expect(evaluator.values(expression)).toEqual([]);
  },
);

it.each([
  "globalThis['Array'].prototype.map=unknown;",
  "globalThis['Object'].keys=unknown;",
  'globalThis[key]=unknown;',
])('refuses indirect global intrinsic replacement: %s', (prelude) => {
  const { evaluator, expression } = fixture(
    "['files'].map(name=>name)",
    prelude,
  );
  expect(evaluator.expressionBarrier(expression)).not.toBe('continues');
  expect(evaluator.values(expression)).toEqual([]);
});

it.each([
  'Number=unknown;',
  'const nativeNumber=Number;nativeNumber.isSafeInteger=unknown;',
])('refuses rewritten numeric guard identities: %s', (prelude) => {
  const { evaluator, expression } = fixture(
    "[{maxSize:100}].map(entry=>{if(!Number.isSafeInteger(entry.maxSize))throw new Error('size');return entry.maxSize;})",
    prelude,
  );
  expect(evaluator.expressionBarrier(expression)).not.toBe('continues');
  expect(evaluator.values(expression)).toEqual([]);
});
