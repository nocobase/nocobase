import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Hono } from 'hono';
import { collectModuleSources } from '../../server/module-sources.js';
import { businessModules } from '../../client/business-modules.js';

import type {
  FoundationBusinessModule,
  FoundationModuleSources,
} from '../../shared/foundation.js';
const fixed =
  "router.get('/items/export', c => { send(); return c.text('mail'); });";
const parameter =
  "router.get('/items/:id', c => { read(); return c.text('db'); });";
const forward =
  "router.get('/items/:id', async (c, next) => { read(); await next(); });";
const uncertain =
  "router.get('/items/:id', async (c, next) => { read(); if (c.req.query('forward')) await next(); else return c.text('db'); });";
export const overlapCases = [
  {
    name: 'fixed first',
    registration: fixed + parameter,
    calls: ['mail'],
    providers: ['mail'],
    complete: true,
  },
  {
    name: 'parameter first',
    registration: parameter + fixed,
    calls: ['db'],
    providers: ['db'],
    complete: true,
  },
  {
    name: 'explicit next',
    registration: forward + fixed,
    calls: ['db', 'mail'],
    providers: ['db', 'mail'],
    complete: true,
  },
  {
    name: 'conditional next',
    registration: uncertain + fixed,
    calls: ['db'],
    providers: ['db'],
    complete: false,
  },
  {
    name: 'conditional next taken',
    registration: uncertain + fixed,
    query: '?forward=1',
    calls: ['db', 'mail'],
    providers: ['db'],
    complete: false,
  },
  {
    name: 'method boundary',
    registration:
      "router.post('/items/:id', c => { read(); return c.text('db'); });" +
      fixed,
    calls: ['mail'],
    providers: ['mail'],
    complete: true,
  },
  {
    name: 'middleware continues',
    registration:
      "router.use('/items/*', async (c, next) => { read(); await next(); });" +
      fixed,
    calls: ['db', 'mail'],
    providers: ['db', 'mail'],
    complete: true,
  },
  {
    name: 'middleware terminates',
    registration:
      "router.use('/items/*', c => { read(); return c.text('db'); });" + fixed,
    calls: ['db'],
    providers: ['db'],
    complete: true,
  },
  {
    name: 'handler boundary',
    registration:
      "router.get('/items/export', c => { send(); return c.text('mail'); }, c => { read(); return c.text('db'); });",
    calls: ['mail'],
    providers: ['mail'],
    complete: true,
  },
  {
    name: 'handler next',
    registration:
      "router.get('/items/export', async (c, next) => { read(); return next(); }, c => { send(); return c.text('mail'); });",
    calls: ['db', 'mail'],
    providers: ['db', 'mail'],
    complete: true,
  },
  {
    name: 'fluent order',
    registration:
      "router.get('/items/export', c => { send(); return c.text('mail'); }).get('/items/:id', c => { read(); return c.text('db'); });",
    calls: ['mail'],
    providers: ['mail'],
    complete: true,
  },
  {
    name: 'nested mount order',
    registration:
      "const child=new Hono(); child.get('/items/export', c => { send(); return c.text('mail'); }); router.route('/',new Hono().route('/',child));" +
      parameter,
    calls: ['mail'],
    providers: ['mail'],
    complete: true,
  },
  {
    name: 'mount snapshots',
    registration:
      "const child=new Hono(); child.get('/items/export', c => { send(); return c.text('mail'); }); router.route('/',child); child.get('/items/:id', c => { read(); return c.text('db'); });",
    calls: ['mail'],
    providers: ['mail'],
    complete: true,
  },
  {
    name: 'helper call order',
    registration:
      "function register(r){r.get('/items/:id', c => { read(); return c.text('db'); });}" +
      fixed +
      'register(router);',
    calls: ['mail'],
    providers: ['mail'],
    complete: true,
  },
  {
    name: 'unused next closure',
    registration:
      "router.get('/items/:id', (c,next)=>{read(); const later=()=>next(); return c.text('db');});" +
      fixed,
    calls: ['db'],
    providers: ['db'],
    complete: false,
  },
  {
    name: 'independent API evidence',
    registration:
      uncertain +
      fixed +
      "router.get('/reliable', c => { send(); return c.text('mail'); });",
    otherRequest: 'reliable',
    calls: ['db'],
    providers: ['db', 'mail'],
    complete: false,
  },
  {
    name: 'opaque factory',
    registration:
      "function middleware(){return (c,next)=>{read();return next();};} router.use('/items/*', middleware());" +
      fixed,
    calls: ['db', 'mail'],
    providers: ['db'],
    complete: false,
  },
  {
    name: 'shadowed next',
    registration:
      "router.get('/items/:id', (c,next)=>{read(); function inner(next){return next();} return c.text('db');});" +
      fixed,
    calls: ['db'],
    providers: ['db'],
    complete: true,
  },
  {
    name: 'conditional dependency inside reached handler',
    registration:
      "router.get('/items/export', c=>{if(c.req.query('mail'))send();return c.text('done');});" +
      parameter,
    calls: [],
    providers: ['mail'],
    complete: true,
  },
  {
    name: 'base path clone',
    registration:
      "const child=router.basePath('/items'); child.get('/export', c=>{send();return c.text('mail');});" +
      parameter,
    calls: ['mail'],
    providers: ['mail'],
    complete: true,
  },
  {
    name: 'closure registration helper',
    registration:
      "function register(){router.get('/items/:id',c=>{read();return c.text('db');});} register();" +
      fixed,
    calls: ['db'],
    providers: ['db'],
    complete: true,
  },
  {
    name: 'short circuit registration',
    registration:
      "const enabled=true; enabled && router.get('/items/:id',c=>{read();return c.text('db');});" +
      fixed,
    calls: ['db'],
    providers: [],
    complete: false,
  },
  {
    name: 'uncertain middleware still follows a proven prefix',
    registration:
      "router.use('/items/*',async(c,next)=>{read();await next();});" +
      uncertain +
      fixed,
    calls: ['db', 'db'],
    providers: ['db'],
    complete: false,
  },
  {
    name: 'named handler alias',
    registration:
      "const done=c=>{send();return c.text('mail');};const handler=done;router.get('/items/export',handler);" +
      parameter,
    calls: ['mail'],
    providers: ['mail'],
    complete: true,
  },
  {
    name: 'reflective next',
    registration:
      "router.get('/items/:id',function(c){read();return arguments[1]();});" +
      fixed,
    calls: ['db', 'mail'],
    providers: ['db'],
    complete: false,
  },
  {
    name: 'unknown registration path',
    registration:
      "const endpoint=['/items/export'].join('');router.get(endpoint,c=>{read();return c.text('db');});" +
      fixed,
    calls: ['db'],
    providers: [],
    complete: false,
  },
  {
    name: 'unknown base path',
    registration:
      "const prefix=['items'].join('');const child=router.basePath('/'+prefix);child.get('/export',c=>{read();return c.text('db');});" +
      fixed,
    calls: ['db'],
    providers: [],
    complete: false,
  },
  {
    name: 'middleware without path',
    registration: 'router.use(async(c,next)=>{read();await next();});' + fixed,
    calls: ['db', 'mail'],
    providers: ['db', 'mail'],
    complete: true,
  },
  {
    name: 'literal handler spread respects termination',
    registration:
      "const handlers=[c=>{send();return c.text('mail');},c=>{read();return c.text('db');}];router.get('/items/export',...handlers);",
    calls: ['mail'],
    providers: ['mail'],
    complete: true,
  },
] as const;

export type OverlapCase = (typeof overlapCases)[number];
export async function withOverlapFixture(
  scenario: OverlapCase,
  run: (fixture: {
    root: string;
    sources: FoundationModuleSources;
    modules: readonly FoundationBusinessModule[];
    calls: string[];
    response: Response;
  }) => Promise<void> | void,
): Promise<void> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'foundation-overlap-'));
  try {
    const files = {
      'package.json': '{"name":"app"}',
      'client/routes.ts':
        "export default [{name:'page',componentLoader:()=>import('./page.js')}];",
      'client/page.ts':
        "import {useApiClient} from '@nocobase/app-client'; import {FileList} from '@nocobase/app-plugin-file/client'; export default ()=>{FileList(); return useApiClient().request({path:'items/export'});" +
        ('otherRequest' in scenario
          ? `useApiClient().request({path:'${scenario.otherRequest}'});`
          : '') +
        '};',
      'server/routes/index.ts':
        "import {Hono} from 'hono'; import {read} from '@nocobase/db'; import {send} from '@nocobase/app-plugin-mail/server'; const router=new Hono();" +
        scenario.registration +
        'export default router;',
    };
    for (const [file, content] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(root, file)), { recursive: true });
      await writeFile(path.join(root, file), content);
    }
    // Execute only this synthetic fixture, never consumer application code.
    const calls: string[] = [];
    const router = new Function(
      'Hono',
      'read',
      'send',
      'const router=new Hono();' + scenario.registration + 'return router;',
    )(
      Hono,
      () => calls.push('db'),
      () => calls.push('mail'),
    ) as Hono;
    const response = await router.request(
      '/items/export' + ('query' in scenario ? scenario.query : ''),
    );
    const sources = await collectModuleSources(root);
    const names = { db: '@nocobase/db', mail: '@nocobase/app-plugin-mail' };

    const modules = businessModules(
      [
        {
          id: 'app:page',
          name: 'page',
          packageName: 'app',
          source: 'application',
          path: '/page',
          auth: 'required',
          authz: 'unrestricted',
          navigation: { title: 'Page' },
          componentLoader: async () => ({ default: () => null }),
        },
      ],
      {
        complete: true,
        unreadable: [],
        entries: Object.entries({
          ...names,
          files: '@nocobase/app-plugin-file',
        }).map(([key, name]) => ({
          name,
          version: '1',
          installed: true,
          kind: 'plugin',
          origin: 'nocobase',
          categories: [key === 'db' ? 'dataModeling' : key],
          registration: 'observed',
          evidence: ['serverRegistration'],
        })),
      },
      sources,
      [
        'interface',
        'usersAndOrganizations',
        'permissions',
        'files',
        'mail',
        'dataModeling',
      ],
    );
    await run({ root, sources, modules, calls, response });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}
