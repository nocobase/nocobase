import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import type { ReadStream } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { HEADERS, ProtocolError } from '@nocobase/agent-protocol';
import { Hono, type MiddlewareHandler } from 'hono';
import { afterEach, describe, expect, it } from 'vitest';
import { createArtifactStore, createDistributionRoutes, createDownloadTokenService, createInstallRoutes, downloadTokenAdmission, installScript } from '../src/index.js';
import { memoryTokens } from './tokens.js';

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))); });
async function fixture() {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'cli-distribution-')); roots.push(dir);
  for (const product of ['acme', 'nocobase-runner', 'other']) {
    await mkdir(path.join(dir, 'stable', product, '1.0.0'), { recursive: true });
    const content = Buffer.alloc(8 * 1024 * 1024, 42);
    await writeFile(path.join(dir, 'stable', product, '1.0.0', 'cli.tar.gz'), content);
    await writeFile(path.join(dir, 'stable', product, 'manifest.json'), JSON.stringify({schema:1, product, versions:{'1.0.0':{targets:{'linux-x64':{file:'1.0.0/cli.tar.gz', size:content.length, sha256:createHash('sha256').update(content).digest('hex')}}}}}));
  }
  return { dir, artifacts: createArtifactStore({ dir }) };
}
const session: MiddlewareHandler = async (context, next) => {
  if (context.req.header('x-test-session') !== 'person') throw new ProtocolError('UNAUTHORIZED', 'Sign in.');
  await next();
};
const headers = { 'x-test-session': 'person' };
const prefix = '/api/agents/dist';
const file = `${prefix}/products/acme/versions/1.0.0/files/cli.tar.gz`;

describe('independent host without Agents, a database or background jobs', () => {
  it('defaults to protected downloads, with optional mint absent', async () => {
    const { artifacts } = await fixture();
    const app = new Hono().route(prefix, createDistributionRoutes({ artifacts }));
    expect((await app.request(`${prefix}/manifest`)).status).toBe(401);
    expect((await app.request(file)).status).toBe(401);
    expect((await app.request(`${prefix}/downloadTokens`, {method:'POST'})).status).toBe(404);
  });
  it('serves only allowed products through an explicit session fallback', async () => {
    const { artifacts } = await fixture();
    const app = new Hono().route(prefix, createDistributionRoutes({ artifacts, products:['acme'], fallback:session })).route(prefix, createInstallRoutes({cli:()=> 'acme'}));
    expect(await (await app.request(`${prefix}/manifest`, { headers })).json()).toEqual({data:{channel:'stable',products:{acme:{version:'1.0.0',targets:['linux-x64']}}}});
    const resolved = await app.request(`${prefix}/products/acme/targets/linux-x64?format=env`, {headers});
    expect(resolved.status).toBe(200); expect(await resolved.text()).toContain('product=acme\n');
    for (const product of ['nocobase-runner','other','missing']) {
      expect((await app.request(`${prefix}/products/${product}/targets/linux-x64`, {headers})).status).toBe(404);
      expect((await app.request(`${prefix}/products/${product}/versions/1.0.0/files/cli.tar.gz`, {headers})).status).toBe(404);
    }
    const download = await app.request(file, {headers});
    expect(download.headers.get('content-length')).toBe(String(8*1024*1024));
    expect(download.headers.get('x-checksum-sha256')).toMatch(/^[a-f0-9]{64}$/u);
    expect((await download.arrayBuffer()).byteLength).toBe(8*1024*1024);
    const script = await app.request(`${prefix}/installScript`);
    expect(script.headers.get('content-type')).toBe('text/x-shellscript; charset=utf-8');
    expect(await script.text()).not.toMatch(/runner|registration|@CLI@|@DEFAULT_SERVER@/iu);
  });
  it('mints and admits only download credentials, never bypassing a rejected credential', async () => {
    const { artifacts } = await fixture();
    const memory = memoryTokens();
    const tokens = createDownloadTokenService({product:'acme', store:memory.store, clock:{now:()=>new Date()}, ids:{next:()=> 'token-1'}});
    const app = new Hono().route(prefix, createDistributionRoutes({artifacts,products:['acme'], admissions:[downloadTokenAdmission(tokens,artifacts)], fallback:session, mint:{guard:session,tokens,createdBy:()=> 'person'}}));
    expect((await app.request(`${prefix}/downloadTokens`,{method:'POST'})).status).toBe(401);
    const minted = await app.request(`${prefix}/downloadTokens`,{method:'POST',headers});
    expect(minted.status).toBe(201);
    const {data} = await minted.json() as {data:{token:string}};
    expect([...memory.records.values()][0]?.tokenHash).not.toBe(data.token);
    const credential = {[HEADERS.downloadToken]: data.token};
    expect((await app.request(`${prefix}/products/acme/targets/linux-x64`,{headers:credential})).status).toBe(200);
    const downloaded = await app.request(file,{headers:credential}); expect(downloaded.status).toBe(200); await downloaded.body?.cancel();
    expect([...memory.records.values()][0]).toMatchObject({target:'linux-x64',downloads:1});
    expect((await app.request(file,{headers:{...headers,[HEADERS.downloadToken]:'invalid'}})).status).toBe(401);
    expect((await app.request('/api/business',{headers:credential})).status).toBe(404);
  });
  it('skips invalid manifests and refuses missing, unlisted and escaping files', async () => {
    const { artifacts, dir } = await fixture();
    await mkdir(path.join(dir,'stable','invalid')); await writeFile(path.join(dir,'stable','invalid','manifest.json'),'{}');
    const app = new Hono().route(prefix, createDistributionRoutes({artifacts,fallback:session}));
    expect((await artifacts.manifest()).products).not.toHaveProperty('invalid');
    expect((await app.request(file.replace('cli.tar.gz','unlisted.tar.gz'),{headers})).status).toBe(404);
    await expect(artifacts.file('acme','1.0.0','../manifest.json')).rejects.toMatchObject({code:'DIST_FILE_NOT_FOUND'});
    await rm(path.join(dir,'stable','acme','1.0.0','cli.tar.gz'));
    expect((await app.request(file,{headers})).status).toBe(404);
  });
  it('closes the file stream when a consumer cancels mid-download', async () => {
    const { artifacts } = await fixture();
    let opened: ReadStream | undefined;
    const tracked = { ...artifacts, file: async (...args: Parameters<typeof artifacts.file>) => {
      const found = await artifacts.file(...args);
      return {...found, open: () => { opened = found.open(); return opened; }};
    }};
    const app = new Hono().route(prefix,createDistributionRoutes({artifacts:tracked,fallback:session}));
    const response = await app.request(file,{headers});
    const reader = response.body!.getReader();
    expect((await reader.read()).value?.byteLength).toBeGreaterThan(0);
    expect(opened?.closed).toBe(false);
    const closed = once(opened!, 'close');
    await reader.cancel(); await closed;
    expect(opened?.closed).toBe(true); expect(opened?.destroyed).toBe(true);
  });
  it('keeps unsafe server addresses out of the shell script', () => {
    expect(installScript({cli:'acme',server:'https://example.test/$(bad)'})).toContain('server=""');
    expect(() => installScript({cli:'bad;command'})).toThrow('Not a CLI command name');
  });
});
