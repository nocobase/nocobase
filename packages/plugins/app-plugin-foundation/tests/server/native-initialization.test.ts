import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { collectModuleSources } from '../../server/module-sources.js';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});
const guarded = `import {createHmac,randomBytes} from 'node:crypto';
export function createCheck(secret){
 if(secret !== undefined && typeof secret !== 'string') throw new TypeError('INVALID_SECRET');
 const key=createHmac('sha256',secret || randomBytes(32)).update('fixture:ticket').digest();
 const sign=payload=>createHmac('sha256',key).update(payload).digest('base64url');
 return {sign};
}`;
async function scan(
  check = guarded,
  secret = "app.config.get('auth.secret')",
  prefix = '',
  extra: Record<string, string> = {},
) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'foundation-native-'));
  roots.push(root);
  const files = {
    'package.json': JSON.stringify({ name: 'native-fixture' }),
    'client/routes.js': `export default [{name:'requisitions',componentLoader:()=>import('./page.js')}];`,
    'client/page.js': `import {useApiClient} from '@nocobase/app-client';export default ()=>useApiClient().request({path:'requisitions'});`,
    'server/routes/index.js': `import {Hono} from 'hono';import {defineApiRoutes} from '@nocobase/app-server/router';import {token} from '../providers/index.js';export default defineApiRoutes(app=>{const routes=new Hono();const service=app.container.resolve(token);routes.get('/requisitions',c=>service.requisitions.list());return routes;});`,
    'server/providers/index.js': `import {ServiceProvider,createServiceToken} from '@nocobase/service-provider';import {databaseManagerToken} from '@nocobase/db';import {createCheck} from './check.js';export const token=createServiceToken('services');
function createPublic(ctx){const check=createCheck(ctx.secret);return {check};}
function createServices(ctx){const publicPages=createPublic(ctx);${prefix}return {publicPages,requisitions:{list(){return ctx.database.repository('jobRequisitions').findMany();}}};}
class Provider extends ServiceProvider {register(){const app=this.app;app.container.singleton(token,()=>createServices({database:app.container.resolve(databaseManagerToken),secret:${secret}}));}}export default [Provider];`,
    'server/providers/check.js': check,
    'server/runtime.js': `import {defineAppRuntime} from '@nocobase/app-server/runtime';import routes from './routes/index.js';import serviceProviders from './providers/index.js';export default defineAppRuntime({routes,serviceProviders});`,
    ...extra,
  };
  for (const [file, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), content);
  }
  return (await collectModuleSources(root)).routes[0];
}

it.each(["app.config.get('auth.secret')", "'fixture-only'", 'undefined', "''"])(
  'reaches the selected table after guarded native initialization for %s',
  async (secret) => {
    const result = await scan(guarded, secret);
    expect(result?.apiProviders).toContain('@nocobase/db');
    expect(result?.collections).toContain('jobRequisitions');
  },
);

it('accepts original named-import aliases', async () => {
  const result = await scan(
    guarded
      .replaceAll('createHmac', 'hmac')
      .replace('{hmac,randomBytes}', '{createHmac as hmac,randomBytes}'),
  );
  expect(result?.collections).toContain('jobRequisitions');
});

it.each([
  [
    'opaque returned field',
    guarded.replace('return {sign};', 'return {sign:external(sign)};'),
  ],
  [
    'unknown returned spread',
    guarded.replace('return {sign};', 'return {...unknown,sign};'),
  ],
  [
    'global side effect',
    guarded.replace('return {sign};', 'globalThis.changed=true;return {sign};'),
  ],
  [
    'HMAC handle alias',
    guarded.replace(
      "const key=createHmac('sha256',secret || randomBytes(32)).update('fixture:ticket').digest();",
      "const h=createHmac('sha256',secret || randomBytes(32));const key=h.update('fixture:ticket').digest();",
    ),
  ],
  [
    'HMAC handle modification',
    guarded.replace(
      "const key=createHmac('sha256',secret || randomBytes(32)).update('fixture:ticket').digest();",
      "const h=createHmac('sha256',secret || randomBytes(32));h.digest=external;const key=h.update('fixture:ticket').digest();",
    ),
  ],
  [
    'HMAC handle escape',
    guarded.replace(
      "const key=createHmac('sha256',secret || randomBytes(32)).update('fixture:ticket').digest();",
      "const h=createHmac('sha256',secret || randomBytes(32));external({h});const key=h.update('fixture:ticket').digest();",
    ),
  ],
  [
    'composite initializer',
    guarded.replace(
      "const key=createHmac('sha256',secret || randomBytes(32)).update('fixture:ticket').digest();",
      "const key=(0,createHmac('sha256',secret || randomBytes(32)).update('fixture:ticket').digest());",
    ),
  ],
  ['mutable digest binding', guarded.replace('const key=', 'let key=')],
  [
    'optional native call',
    guarded.replace(
      "createHmac('sha256',secret",
      "createHmac?.('sha256',secret",
    ),
  ],
  [
    'optional update',
    guarded.replace(".update('fixture:ticket')", ".update?.('fixture:ticket')"),
  ],
  [
    'update encoding',
    guarded.replace(
      ".update('fixture:ticket')",
      ".update('fixture:ticket','utf8')",
    ),
  ],
  [
    'shadowed native import',
    guarded.replace('createCheck(secret)', 'createCheck(secret,createHmac)'),
  ],
  [
    'reflective parameter write',
    guarded.replace('const key=', 'arguments[0]=unknown;const key='),
  ],
  [
    'no runtime guard',
    guarded.replace(
      "if(secret !== undefined && typeof secret !== 'string') throw new TypeError('INVALID_SECRET');",
      '',
    ),
  ],
  [
    'guard does not throw',
    guarded.replace("throw new TypeError('INVALID_SECRET')", '{}'),
  ],
  [
    'wrong guard branch',
    guarded.replace("typeof secret !== 'string'", "typeof secret === 'string'"),
  ],
  [
    'guard after initialization',
    guarded
      .replace(
        "if(secret !== undefined && typeof secret !== 'string') throw new TypeError('INVALID_SECRET');",
        '',
      )
      .replace(
        'const sign=',
        "if(secret !== undefined && typeof secret !== 'string') throw new TypeError('INVALID_SECRET');const sign=",
      ),
  ],
  [
    'reassigned parameter',
    guarded.replace('const key=', 'secret=unknown;const key='),
  ],
  [
    'parameter alias escapes',
    guarded.replace('const key=', 'external(secret);const key='),
  ],
  ['unknown algorithm', guarded.replace("'sha256',secret", 'algorithm,secret')],
  ['other algorithm', guarded.replace("'sha256',secret", "'sha512',secret")],
  [
    'unknown key source',
    guarded.replace('secret || randomBytes(32)', 'unknown'),
  ],
  ['other random size', guarded.replace('randomBytes(32)', 'randomBytes(16)')],
  [
    'random callback',
    guarded.replace('randomBytes(32)', 'randomBytes(32,callback)'),
  ],
  [
    'unknown update input',
    guarded.replace("update('fixture:ticket')", 'update(payload)'),
  ],
  [
    'encoded digest',
    guarded.replace(
      "update('fixture:ticket').digest()",
      "update('fixture:ticket').digest('hex')",
    ),
  ],
  [
    'repeated finish',
    guarded.replace(
      "update('fixture:ticket').digest()",
      "update('fixture:ticket').digest().digest()",
    ),
  ],
  ['modified result', guarded.replace('const sign=', 'key[0]=1;const sign=')],
  [
    'escaped result',
    guarded.replace('const sign=', 'external({nested:[key]});const sign='),
  ],
  [
    'shadowed undefined',
    guarded.replace('createCheck(secret)', 'createCheck(secret,undefined)'),
  ],
  [
    'shadowed throw constructor',
    guarded.replace(
      'export function',
      'const TypeError=unknown;export function',
    ),
  ],
  ['import reassignment', guarded + '\ncreateHmac=unknown;'],
  ['import property modification', guarded + '\ncreateHmac.call=unknown;'],
  ['import escape', guarded + '\nexternal(createHmac);'],
  [
    'namespace replacement',
    guarded +
      "\nimport * as crypto from 'node:crypto';crypto.createHmac=unknown;",
  ],
  ['prototype replacement in another file', guarded + "\nimport './patch.js';"],
  [
    'unrelated import with same spelling',
    guarded.replace("'node:crypto'", "'external-crypto'"),
  ],
])('blocks native initialization with %s', async (_name, check) => {
  const result = await scan(check, undefined, '', {
    'server/providers/patch.js':
      "import {Hmac} from 'node:crypto';Hmac.prototype.digest=unknown;",
  });
  expect(result?.apiProviders ?? []).not.toContain('@nocobase/db');
  expect(result?.collections ?? []).not.toContain('jobRequisitions');
});

it.each([
  '42',
  '-42',
  '1n',
  'NaN',
  'Infinity',
  '!0',
  'true',
  'null',
  '{}',
  '[]',
  "new String('fixture')",
  'new Proxy({}, {get(){external();}})',
  '/fixture/',
  'class {}',
])('rejects invalid input %s before the selected query', async (secret) => {
  expect((await scan(guarded, secret))?.apiProviders ?? []).not.toContain(
    '@nocobase/db',
  );
});

it.each(['opaquePeer();', 'throw new Error("stop");'])(
  'retains a later peer initialization barrier: %s',
  async (prefix) => {
    expect(
      (await scan(guarded, undefined, prefix))?.apiProviders ?? [],
    ).not.toContain('@nocobase/db');
  },
);

it('rejects a native prototype changed through an instance in another module', async () => {
  const result = await scan(guarded + "\nimport './patch.js';", undefined, '', {
    'server/providers/patch.js':
      "import {createHmac} from 'node:crypto';const h=createHmac('sha256','fixture');h.constructor.prototype.digest=external;",
  });
  expect(result?.apiProviders ?? []).not.toContain('@nocobase/db');
});

it.each([
  ['42', false],
  ['new Proxy({}, {get(){external();}})', false],
  ["'fixture'", true],
  ['undefined', true],
])(
  'shares guarded continuation for a subsequent call with %s',
  async (argument, continues) => {
    const result = await scan(guarded, undefined, `createCheck(${argument});`);
    expect((result?.apiProviders ?? []).includes('@nocobase/db')).toBe(
      continues,
    );
  },
);

it('retains an opaque step before the guard', async () => {
  const result = await scan(
    guarded.replace(
      'export function createCheck(secret){',
      'export function createCheck(secret){opaquePeer();',
    ),
  );
  expect(result?.apiProviders ?? []).not.toContain('@nocobase/db');
});

const clientCryptoPatch =
  "import {Hmac} from 'node:crypto';Hmac.prototype.digest=external;";
it('keeps browser-only crypto declarations out of backend intrinsic identity', async () => {
  const result = await scan(guarded, undefined, '', {
    'client/page.js':
      "import './crypto.js';import {useApiClient} from '@nocobase/app-client';export default ()=>useApiClient().request({path:'requisitions'});",
    'client/crypto.js': clientCryptoPatch,
  });
  expect(result?.collections).toContain('jobRequisitions');
});
it('checks a client-path module when a backend root actually imports it', async () => {
  const result = await scan(guarded, undefined, '', {
    'client/crypto.js': clientCryptoPatch,
    'server/runtime.js':
      "import '../client/crypto.js';import {defineAppRuntime} from '@nocobase/app-server/runtime';import routes from './routes/index.js';import serviceProviders from './providers/index.js';export default defineAppRuntime({routes,serviceProviders});",
  });
  expect(result?.apiProviders ?? []).not.toContain('@nocobase/db');
});
it('rejects a native contract when the executable backend graph is incomplete', async () => {
  const result = await scan(guarded + "\nimport './missing.js';");
  expect(result?.apiProviders ?? []).not.toContain('@nocobase/db');
});

it('includes dynamic API dependencies when runtime omits the conventional API entry', async () => {
  const result = await scan(guarded, undefined, '', {
    'client/crypto.js': clientCryptoPatch,
    'server/runtime.js': 'export default {};',
    'server/routes/index.js': `void import('../client/crypto.js');import {Hono} from 'hono';import {defineApiRoutes} from '@nocobase/app-server/router';import {token} from '../providers/index.js';export default defineApiRoutes(app=>{const routes=new Hono();const service=app.container.resolve(token);routes.get('/requisitions',c=>service.requisitions.list());return routes;});`,
  });
  expect(result?.apiProviders ?? []).not.toContain('@nocobase/db');
});
