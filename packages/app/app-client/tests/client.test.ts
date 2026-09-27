import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveAppBase, resolveAppUrl } from '../src/client.js';

function renderConfig(config: unknown): void {
  document.body.innerHTML = `<script id="nocobase-runtime-config" type="application/json">${JSON.stringify(
    { version: 1, config },
  )}</script>`;
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('resolveAppBase', () => {
  it('reads the base path the server rendered into the client config', () => {
    renderConfig({ app: { basePath: '/main' } });

    expect(resolveAppBase()).toBe('/main/');
  });

  it('normalizes a base path missing its slashes', () => {
    renderConfig({ app: { basePath: 'main' } });

    expect(resolveAppBase()).toBe('/main/');
  });

  it('normalizes a nested base path with repeated slashes', () => {
    renderConfig({ app: { basePath: '///apps/demo//' } });

    expect(resolveAppBase()).toBe('/apps/demo/');
  });

  it('serves from the origin root when the base path is a single slash or empty', () => {
    renderConfig({ app: { basePath: '/' } });
    expect(resolveAppBase()).toBe('/');

    renderConfig({ app: { basePath: '' } });
    expect(resolveAppBase()).toBe('/');
  });

  it('follows a page whose config changed', () => {
    renderConfig({ app: { basePath: '/main' } });
    expect(resolveAppBase()).toBe('/main/');

    renderConfig({ app: { basePath: '/crm' } });
    expect(resolveAppBase()).toBe('/crm/');
  });

  it('refuses a page the application server did not render', () => {
    expect(() => resolveAppBase()).toThrow('no app.basePath');
  });

  it('refuses a base path that is not a string', () => {
    renderConfig({ app: { basePath: 42 } });

    expect(() => resolveAppBase()).toThrow('no app.basePath');
  });

  it('ignores the legacy window global', () => {
    vi.stubGlobal('APP_BASE_PATH', '/legacy/');
    renderConfig({ app: { basePath: '/main' } });

    expect(resolveAppBase()).toBe('/main/');
  });

  it('serves from the origin root outside a browser', () => {
    vi.stubGlobal('document', undefined);

    expect(resolveAppBase()).toBe('/');
  });
});

describe('resolveAppUrl', () => {
  it('resolves paths inside the mount path', () => {
    renderConfig({ app: { basePath: '/crm' } });

    expect(resolveAppUrl('/api')).toBe('/crm/api');
    expect(resolveAppUrl('reset-password?token=1#top')).toBe(
      '/crm/reset-password?token=1#top',
    );
  });

  it('leaves absolute URLs alone', () => {
    renderConfig({ app: { basePath: '/crm' } });

    expect(resolveAppUrl('https://example.com/a')).toBe(
      'https://example.com/a',
    );
  });
});
