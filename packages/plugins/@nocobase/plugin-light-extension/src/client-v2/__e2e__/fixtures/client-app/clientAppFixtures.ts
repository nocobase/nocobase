/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { build } from 'esbuild';
import fs from 'fs/promises';
import path from 'path';

import { createDeterministicZip, type DeterministicZipEntry } from './deterministicZip';
import { CLIENT_APP_FIXTURE_FONT_WOFF2 } from './fixtureFont';

export const CLIENT_APP_FIXTURE_IDS = [
  'root-v1',
  'root-v2',
  'nested-v1',
  'nested-v2',
  'bad-traversal',
  'bad-missing-entry',
  'bad-wrong-key',
] as const;

export type ClientAppFixtureId = (typeof CLIENT_APP_FIXTURE_IDS)[number];
export type ClientAppFixtureFamily = 'root' | 'nested';
export type ClientAppFixtureVersion = 'v1' | 'v2';

export interface ClientAppFixtureMetadata {
  id: ClientAppFixtureId;
  archiveName: string;
  key: string;
  entry: string;
  family?: ClientAppFixtureFamily;
  version?: ClientAppFixtureVersion;
  expectedFailure?: 'traversal' | 'missing-entry' | 'replacement-key-mismatch';
}

const ROOT_KEY = 'e2e-root-client-app';
const NESTED_KEY = 'e2e-nested-client-app';
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);
const EMPTY_WASM_MODULE = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);

const fixtureMetadata: Record<ClientAppFixtureId, ClientAppFixtureMetadata> = {
  'root-v1': validMetadata('root', 'v1', ROOT_KEY, 'index.html'),
  'root-v2': validMetadata('root', 'v2', ROOT_KEY, 'index.html'),
  'nested-v1': validMetadata('nested', 'v1', NESTED_KEY, 'dist/application.html'),
  'nested-v2': validMetadata('nested', 'v2', NESTED_KEY, 'dist/application.html'),
  'bad-traversal': {
    id: 'bad-traversal',
    archiveName: 'e2e-client-app-bad-traversal.zip',
    key: 'e2e-bad-traversal',
    entry: 'index.html',
    expectedFailure: 'traversal',
  },
  'bad-missing-entry': {
    id: 'bad-missing-entry',
    archiveName: 'e2e-client-app-bad-missing-entry.zip',
    key: 'e2e-bad-missing-entry',
    entry: 'missing.html',
    expectedFailure: 'missing-entry',
  },
  'bad-wrong-key': {
    id: 'bad-wrong-key',
    archiveName: 'e2e-client-app-bad-wrong-key.zip',
    key: 'e2e-wrong-key',
    entry: 'index.html',
    expectedFailure: 'replacement-key-mismatch',
  },
};

export function getClientAppFixtureMetadata(id: ClientAppFixtureId): ClientAppFixtureMetadata {
  return { ...fixtureMetadata[id] };
}

export async function generateClientAppFixtureZip(id: ClientAppFixtureId): Promise<Buffer> {
  const metadata = fixtureMetadata[id];
  return createDeterministicZip(await createFixtureEntries(metadata));
}

export async function writeClientAppFixtureZip(id: ClientAppFixtureId, outputPath: string): Promise<string> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, await generateClientAppFixtureZip(id));
  return outputPath;
}

export async function writeAllClientAppFixtureZips(
  outputDirectory: string,
): Promise<Record<ClientAppFixtureId, string>> {
  await fs.mkdir(outputDirectory, { recursive: true });
  const paths = {} as Record<ClientAppFixtureId, string>;
  for (const id of CLIENT_APP_FIXTURE_IDS) {
    const outputPath = path.join(outputDirectory, fixtureMetadata[id].archiveName);
    paths[id] = await writeClientAppFixtureZip(id, outputPath);
  }
  return paths;
}

async function createFixtureEntries(metadata: ClientAppFixtureMetadata): Promise<DeterministicZipEntry[]> {
  if (metadata.family && metadata.version) {
    return createValidFixtureEntries(metadata);
  }
  const descriptor = createDescriptor(metadata);
  if (metadata.expectedFailure === 'traversal') {
    return [
      { name: '../escape.txt', content: 'This file must never escape ZIP staging.\n' },
      { name: 'entry.json', content: descriptor },
      { name: 'index.html', content: minimalHtml('Traversal fixture') },
    ];
  }
  if (metadata.expectedFailure === 'missing-entry') {
    return [
      { name: 'entry.json', content: descriptor },
      { name: 'index.html', content: minimalHtml('The descriptor intentionally points elsewhere') },
    ];
  }
  return [
    { name: 'entry.json', content: descriptor },
    { name: 'index.html', content: minimalHtml('Wrong replacement key fixture') },
  ];
}

async function createValidFixtureEntries(metadata: ClientAppFixtureMetadata): Promise<DeterministicZipEntry[]> {
  const assetPrefix = metadata.family === 'nested' ? 'dist/assets' : 'assets';
  const htmlPath = metadata.entry;
  const source = createBrowserSource(metadata);
  const bundle = await bundleBrowserSource(source, metadata.id);
  return [
    { name: 'entry.json', content: createDescriptor(metadata) },
    { name: htmlPath, content: createFixtureHtml(metadata) },
    { name: `${assetPrefix}/app.css`, content: createFixtureCss(metadata) },
    { name: `${assetPrefix}/app.js`, content: bundle },
    { name: `${assetPrefix}/main.source.ts`, content: source },
    { name: `${assetPrefix}/fixture-font.woff2`, content: CLIENT_APP_FIXTURE_FONT_WOFF2 },
    { name: `${assetPrefix}/module.wasm`, content: EMPTY_WASM_MODULE },
    { name: `${assetPrefix}/pixel.png`, content: PNG_1X1 },
    {
      name: `${assetPrefix}/version.txt`,
      content: `${metadata.family} client-app fixture ${metadata.version}\n`,
    },
  ];
}

async function bundleBrowserSource(source: string, fixtureId: ClientAppFixtureId): Promise<Buffer> {
  const result = await build({
    absWorkingDir: __dirname,
    bundle: true,
    charset: 'utf8',
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    format: 'iife',
    legalComments: 'none',
    minify: false,
    platform: 'browser',
    sourcemap: false,
    stdin: {
      contents: source,
      loader: 'ts',
      resolveDir: __dirname,
      sourcefile: `${fixtureId}.ts`,
    },
    target: ['es2020'],
    treeShaking: true,
    write: false,
  });
  const output = result.outputFiles?.[0];
  if (!output) {
    throw new Error(`Failed to bundle client-app fixture "${fixtureId}"`);
  }
  return Buffer.from(output.contents);
}

function createBrowserSource(metadata: ClientAppFixtureMetadata): string {
  return `
import { createClient } from '@nocobase/sdk/client';

type FixtureRequestName = 'native-get' | 'native-post' | 'sdk-get';
type FixtureResult = { ok: boolean; payload: unknown };
type FixtureWindow = Window & {
  __nocobase_api_base_url__?: string;
  __nocobase_public_path__?: string;
  __nocobase_client_app_e2e_results__?: Partial<Record<FixtureRequestName | 'assets', FixtureResult>>;
};

const fixture = ${JSON.stringify({ family: metadata.family, id: metadata.id, version: metadata.version })};
const runtimeWindow = window as FixtureWindow;
const client = createClient();
const query = new URLSearchParams(window.location.search);
const getAction = query.get('getAction') || 'auth:check';
const postAction = query.get('postAction') || 'auth:check';
const sdkAction = query.get('sdkAction') || getAction;

function apiUrl(action: string): string {
  const base = runtimeWindow.__nocobase_api_base_url__ || '/api/';
  return new URL('./' + action.replace(/^\\/+/, ''), new URL(base, window.location.origin)).toString();
}

function inferAppName(): string {
  const base = runtimeWindow.__nocobase_api_base_url__ || '/api/';
  const match = base.match(/\\/__app\\/([^/]+)/u);
  return match ? decodeURIComponent(match[1]) : 'main';
}

function readCookie(name: string): string | undefined {
  const prefix = name + '=';
  return document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length);
}

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    throw new Error('HTTP ' + response.status + ': ' + text);
  }
  return body;
}

async function nativeGet(): Promise<unknown> {
  const url = new URL(apiUrl(getAction));
  url.searchParams.set('fixture', fixture.id);
  url.searchParams.set('transport', 'native-get');
  return readResponse(await fetch(url, { credentials: 'include', method: 'GET' }));
}

async function nativePost(): Promise<unknown> {
  const csrfToken = readCookie('nb_csrf_token_' + inferAppName());
  if (!csrfToken) {
    throw new Error('CSRF cookie is unavailable');
  }
  return readResponse(
    await fetch(apiUrl(postAction), {
      body: JSON.stringify({ fixture: fixture.id, transport: 'native-post' }),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      method: 'POST',
    }),
  );
}

async function sdkGet(): Promise<unknown> {
  const response = await client.request({
    method: 'get',
    params: { fixture: fixture.id, transport: 'sdk-get' },
    url: sdkAction,
  });
  return response.data;
}

function report(name: FixtureRequestName | 'assets', result: FixtureResult): void {
  runtimeWindow.__nocobase_client_app_e2e_results__ ||= {};
  runtimeWindow.__nocobase_client_app_e2e_results__[name] = result;
  const output = document.querySelector<HTMLElement>('[data-result="' + name + '"]');
  if (output) {
    output.dataset.status = result.ok ? 'success' : 'error';
    output.textContent = JSON.stringify(result.payload);
  }
  window.dispatchEvent(new CustomEvent('nocobase-client-app-e2e-result', { detail: { name, ...result } }));
}

async function run(name: FixtureRequestName, request: () => Promise<unknown>): Promise<void> {
  try {
    report(name, { ok: true, payload: await request() });
  } catch (error) {
    report(name, { ok: false, payload: error instanceof Error ? error.message : String(error) });
  }
}

async function loadBinaryAssets(): Promise<void> {
  const fontMarker = document.querySelector<HTMLElement>('[data-testid="fixture-font"]');
  try {
    const [imageResponse, wasmResponse, fontResponse] = await Promise.all([
      fetch('./assets/pixel.png'),
      fetch('./assets/module.wasm'),
      fetch('./assets/fixture-font.woff2'),
    ]);
    if (!imageResponse.ok || !wasmResponse.ok || !fontResponse.ok) {
      throw new Error('Binary asset request failed');
    }
    const image = await imageResponse.arrayBuffer();
    const wasm = await wasmResponse.arrayBuffer();
    const font = await fontResponse.arrayBuffer();
    await WebAssembly.instantiate(wasm);
    const fontDeclaration = '16px "ClientAppFixtureFont"';
    const loadedFonts = await document.fonts.load(fontDeclaration, 'Client app font marker');
    const fontLoaded = loadedFonts.length > 0 && document.fonts.check(fontDeclaration, 'Client app font marker');
    if (!fontLoaded) {
      throw new Error('Fixture font failed to load');
    }
    if (fontMarker) {
      fontMarker.dataset.fontStatus = 'loaded';
    }
    report('assets', {
      ok: true,
      payload: { fontBytes: font.byteLength, fontLoaded, imageBytes: image.byteLength, wasmBytes: wasm.byteLength },
    });
  } catch (error) {
    if (fontMarker) {
      fontMarker.dataset.fontStatus = 'error';
    }
    report('assets', { ok: false, payload: error instanceof Error ? error.message : String(error) });
  }
}

function renderRoute(): void {
  const output = document.querySelector<HTMLElement>('[data-testid="fixture-route"]');
  if (output) {
    output.textContent = window.location.pathname + window.location.search + window.location.hash;
  }
}

document.querySelector('[data-action="native-get"]')?.addEventListener('click', () => run('native-get', nativeGet));
document.querySelector('[data-action="native-post"]')?.addEventListener('click', () => run('native-post', nativePost));
document.querySelector('[data-action="sdk-get"]')?.addEventListener('click', () => run('sdk-get', sdkGet));
document.querySelector('[data-route-link]')?.addEventListener('click', (event) => {
  event.preventDefault();
  const anchor = event.currentTarget as HTMLAnchorElement;
  const next = new URL(anchor.href);
  const current = new URL(window.location.href);
  for (const [name, value] of current.searchParams) {
    if (!next.searchParams.has(name)) {
      next.searchParams.append(name, value);
    }
  }
  window.history.pushState({}, '', next.pathname + next.search + next.hash);
  renderRoute();
});
window.addEventListener('popstate', renderRoute);
renderRoute();
loadBinaryAssets();

if (query.get('autorun') === '1') {
  Promise.all([run('native-get', nativeGet), run('native-post', nativePost), run('sdk-get', sdkGet)]);
}
`;
}

function createFixtureHtml(metadata: ClientAppFixtureMetadata): string {
  const title = `${metadata.family} client-app fixture ${metadata.version}`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="./assets/app.css">
    <script defer src="./assets/app.js"></script>
  </head>
  <body data-fixture="${metadata.id}">
    <main id="fixture-card">
      <h1 data-testid="fixture-version">${title}</h1>
      <p data-testid="fixture-route"></p>
      <p data-font-status="pending" data-testid="fixture-font">Client app font marker</p>
      <img alt="Client app fixture pixel" height="1" src="./assets/pixel.png" width="1">
      <nav><a data-route-link href="./orders/42?from=${metadata.version}#details">Open history route</a></nav>
      <section aria-label="API requests">
        <button data-action="native-get" type="button">Native GET</button>
        <output data-result="native-get"></output>
        <button data-action="native-post" type="button">Native CSRF POST</button>
        <output data-result="native-post"></output>
        <button data-action="sdk-get" type="button">SDK GET</button>
        <output data-result="sdk-get"></output>
      </section>
      <output data-result="assets"></output>
    </main>
  </body>
</html>
`;
}

function createFixtureCss(metadata: ClientAppFixtureMetadata): string {
  const color = metadata.version === 'v1' ? '#1677ff' : '#52c41a';
  return `@font-face {
  font-family: 'ClientAppFixtureFont';
  font-style: normal;
  font-weight: 400;
  font-display: block;
  src: url('./fixture-font.woff2') format('woff2');
}
:root { color-scheme: light; font-family: sans-serif; }
body { margin: 0; padding: 24px; }
#fixture-card { border: 4px solid ${color}; background-image: url('./pixel.png'); padding: 20px; }
[data-testid='fixture-font'] { font-family: 'ClientAppFixtureFont', monospace; }
button { margin: 4px; }
output { display: block; min-height: 1.5em; overflow-wrap: anywhere; }
`;
}

function createDescriptor(metadata: ClientAppFixtureMetadata): string {
  return `${JSON.stringify(
    {
      schemaVersion: 1,
      key: metadata.key,
      title: metadata.family
        ? `${metadata.family === 'root' ? 'Root' : 'Nested'} client app ${metadata.version}`
        : metadata.key,
      description: `Deterministic fixture ${metadata.id}`,
      category: 'e2e',
      tags: ['client-app', 'e2e', ...(metadata.version ? [metadata.version] : [])],
      entry: metadata.entry,
    },
    null,
    2,
  )}\n`;
}

function minimalHtml(title: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>${title}</title></head><body>${title}</body></html>\n`;
}

function validMetadata(
  family: ClientAppFixtureFamily,
  version: ClientAppFixtureVersion,
  key: string,
  entry: string,
): ClientAppFixtureMetadata {
  const id = `${family}-${version}` as ClientAppFixtureId;
  return {
    id,
    archiveName: `e2e-${family}-client-app-${version}.zip`,
    key,
    entry,
    family,
    version,
  };
}
