import ts from 'typescript';
import { expect, it } from 'vitest';
import { SourceEvidence } from '../../server/source-evidence.js';
import { StaticValues } from '../../server/static-values.js';

function factory(body: string, prelude = '') {
  const file = '/routes.ts',
    ast = ts.createSourceFile(
      file,
      `import {defineApiRoutes} from '@nocobase/app-server/router';import {databaseManagerToken} from '@nocobase/db';${prelude}\nexport default defineApiRoutes(app=>{const db=app.container.resolve(databaseManagerToken);${body}});`,
      ts.ScriptTarget.Latest,
      true,
    );
  const declaration = (ast.statements.at(-1) as ts.ExportAssignment)
    .expression as ts.CallExpression;
  const fn = declaration.arguments[0] as ts.ArrowFunction,
    block = fn.body as ts.Block;
  const analysis = new SourceEvidence([{ file, ast }], new Map()),
    evaluator = new StaticValues(analysis);
  const last = block.statements.at(-1) as ts.ReturnStatement;
  for (const statement of block.statements.slice(0, -1))
    expect(evaluator.statementBarrier(statement)).toBe('continues');
  return { evaluator, expression: last.expression! };
}
it('constructs only literal descriptors on the host database', () => {
  for (const expression of [
    'db.connection(undefined)',
    "db.repository('files',undefined)",
    'db.query()',
  ]) {
    const found = factory(`return ${expression};`);
    expect(found.evaluator.expressionBarrier(found.expression)).toBe(
      'continues',
    );
  }
});
it.each([
  'db.repository(unknown())',
  "fake.repository('files')",
  'db.connection(unknown)',
  "db.repository('files',unknown)",
  'db.query(unknown)',
])('refuses an unproved database descriptor: %s', (expression) => {
  const found = factory(`return ${expression};`);
  expect(found.evaluator.expressionBarrier(found.expression)).toBe('unknown');
});
it('constructs an explicitly unwritable upload policy without running a query', () => {
  const { evaluator, expression } = factory(
    "return db.repository('files').withPolicy({create:false,read:{scope:true,fields:['id'],relations:{}},update:false,delete:false});",
  );
  expect(evaluator.expressionBarrier(expression)).toBe('continues');
});
it.each([
  '{create:unknown,read:false,update:false,delete:false}',
  '{create:true,read:false,update:false,delete:false}',
  "{create:false,read:{get scope(){unknown();return true;},fields:['id'],relations:{}},update:false,delete:false}",
])('keeps unsupported policy input blocked: %s', (policy) => {
  const { evaluator, expression } = factory(
    `return db.repository('files').withPolicy(${policy});`,
  );
  expect(evaluator.expressionBarrier(expression)).toBe('unknown');
});
const proxy =
  "const operations={read:()=>db.repository('files')};return new Proxy(db.repository('files'),{get(target,property,receiver){if(Object.hasOwn(operations,property))return Reflect.get(operations,property);return unknown(target,property,receiver);}});";
it('selects only the closed own-operation branch of a literal proxy getter', () => {
  const { evaluator, expression } = factory(proxy);
  expect(evaluator.expressionBarrier(expression)).toBe('continues');
  const known = ts.factory.createPropertyAccessExpression(
    expression as ts.Expression,
    'read',
  );
  expect(evaluator.values(known).every(ts.isFunctionLike)).toBe(true);
  expect(evaluator.values(known)).toHaveLength(1);
  expect(
    evaluator.expressionBarrier(
      ts.factory.createPropertyAccessExpression(
        expression as ts.Expression,
        'missing',
      ),
    ),
  ).toBe('unknown');
});
it.each([
  proxy.replace('if(Object.hasOwn', 'unknown();if(Object.hasOwn'),
  proxy.replace(
    'Reflect.get(operations,property)',
    'external(operations,property)',
  ),
  proxy.replace(
    'Object.hasOwn(operations,property)',
    'Object.hasOwn(operations,unknown)',
  ),
])('refuses an unproved proxy getter branch: %s', (source) => {
  const { evaluator, expression } = factory(source);
  expect(
    evaluator.expressionBarrier(
      ts.factory.createPropertyAccessExpression(
        expression as ts.Expression,
        'read',
      ),
    ),
  ).toBe('unknown');
});
it.each([
  'Reflect.get=unknown;',
  'globalThis.Reflect=unknown;',
  'Proxy=unknown;',
])('refuses rewritten proxy intrinsics: %s', (prelude) => {
  const { evaluator, expression } = factory(proxy, prelude);
  expect(evaluator.expressionBarrier(expression)).toBe('unknown');
});
it('does not accept a second policy binding on an already bound descriptor', () => {
  const { evaluator, expression } = factory(
    "return db.repository('files').withPolicy({create:false,read:false,update:false,delete:false}).withPolicy({create:false,read:false,update:false,delete:false});",
  );
  expect(evaluator.expressionBarrier(expression)).toBe('unknown');
});
