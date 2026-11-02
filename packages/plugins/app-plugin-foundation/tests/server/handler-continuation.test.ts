import ts from 'typescript';
import { expect, it } from 'vitest';
import { SourceEvidence } from '../../server/source-evidence.js';
import { StaticValues } from '../../server/static-values.js';
import { handlerContinuation } from '../../server/handler-continuation.js';

const prelude = `import {bodyLimit} from 'hono/body-limit';
const purposes={document:{maxSize:100},video:{maxSize:200}};
function isPurpose(value){return typeof value==='string'&&Object.hasOwn(purposes,value);}`;
const upload = `async(c,next)=>{
 const purpose=c.req.query('purpose');
 if(!isPurpose(purpose))return c.json({code:'PURPOSE'},400);
 const rule=purposes[purpose];
 let stored=false;
 const response=await bodyLimit({maxSize:rule.maxSize+64,onError:c=>c.json({code:'SIZE'},413)})(c,async()=>{await next();stored=true;});
 if(response)return response;
 if(!stored||!c.res.ok)return;
 const envelope=await c.res.clone().json().catch(()=>null);
 unknown(envelope);
}`;
function continuation(source: string, prefix = prelude, registered = true) {
  const file = '/routes.ts',
    ast = ts.createSourceFile(
      file,
      `${prefix}\nconst handler=${source};`,
      ts.ScriptTarget.Latest,
      true,
    );
  const analysis = new SourceEvidence([{ file, ast }], new Map(), undefined, {
    sources: [{ file, ast }],
    complete: true,
    roots: [file],
  });
  const declaration = (ast.statements.at(-1) as ts.VariableStatement)
    .declarationList.declarations[0];
  const handler = declaration.initializer!;
  if (registered) analysis.routeHandlers.add(handler);
  return {
    result: handlerContinuation(handler, analysis, new StaticValues(analysis)),
    analysis,
    handler,
  };
}
it('proves the next edge inside one owned native body limiter without accepting post-response parsing', () => {
  const { result, analysis, handler } = continuation(upload);
  expect(result).toBe('next');
  // This completion proof deliberately ends at next; the handler's opaque response remains blocked.
  expect(
    new StaticValues(analysis).expressionBarrier(
      ts.factory.createCallExpression(handler as ts.Expression, undefined, []),
    ),
  ).toBe('unknown');
});
it.each([
  upload.replace('const purpose=', 'unknown();const purpose='),
  upload.replace(
    'await next();stored=true;',
    'await next();await next();stored=true;',
  ),
  upload.replace('await next();stored=true;', 'stored=true;await next();'),
  upload.replace('let stored=false;', 'let stored=true;'),
  upload.replace(
    'if(response)return response;',
    'if(response)unknown(response);',
  ),
  upload.replace('if(!stored||!c.res.ok)return;', 'if(!stored)return;'),
  upload.replace('maxSize:rule.maxSize+64', 'maxSize:unknown()'),
  upload.replace('const purpose=', 'c.req=unknown;const purpose='),
  upload.replace('bodyLimit({', 'fakeBodyLimit({'),
])(
  'does not turn an unknown or malformed body-limit edge into next: %s',
  (source) => {
    expect(continuation(source).result).toBe('unknown');
  },
);
it('requires a registered native context for an applied body limiter', () => {
  expect(continuation(upload, prelude, false).result).toBe('unknown');
});
it.each([
  'async(c,next)=>{unknown();await next();}',
  'async(c,next)=>{throw new Error();await next();}',
  'async(c,next)=>{external(next);}',
])('blocks an unproved prefix or escaped next: %s', (source) => {
  expect(continuation(source).result).toBe('unknown');
});
it('allows a completed native response guard before a direct next', () => {
  expect(
    continuation(
      "async(c,next)=>{const key=c.req.query('key');if(!key)return c.json({code:'MISSING'},400);await next();}",
    ).result,
  ).toBe('next');
});

it('retains numeric expression values after a finite purpose guard', () => {
  expect(
    continuation(
      upload,
      prelude
        .replace('const purposes=', 'const MB=1024*1024;const purposes=')
        .replace('maxSize:100', 'maxSize:20*MB')
        .replace('maxSize:200', 'maxSize:200*MB'),
    ).result,
  ).toBe('next');
});
it.each([
  'async(c,next)=>{while(unknown){external(c);}await next();}',
  'async(c,next)=>{switch(unknown){case 1:external(c);}await next();}',
  'async(c,next)=>{class Local{static value=unknown();}await next();}',
  'async(c,next)=>{function setup(){for(;;){unknown();}}setup();await next();}',
])('refuses unsupported executable prefix statements: %s', (source) => {
  expect(continuation(source).result).toBe('unknown');
});
