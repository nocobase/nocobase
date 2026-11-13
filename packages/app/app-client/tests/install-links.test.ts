import { afterEach, describe, expect, it } from 'vitest';

import { mountInstallLinks } from '../src/install-links.js';

function renderConfig(config: unknown): void {
  document.body.innerHTML = `<script id="nocobase-runtime-config" type="application/json">${JSON.stringify(
    { version: 1, config },
  )}</script>`;
}

function links(rel: string): string[] {
  return [...document.head.querySelectorAll(`link[rel="${rel}"]`)].map(
    (element) => element.getAttribute('href') ?? '',
  );
}

afterEach(() => {
  document.head.innerHTML = '';
  document.body.innerHTML = '';
});

describe('mountInstallLinks', () => {
  it('links the manifest and home-screen icon under the rendered base path', () => {
    renderConfig({ app: { basePath: '/tenants/acme/crm' } });

    const dispose = mountInstallLinks({ appleTouchIcon: 'assets/pwa-192.png' });

    expect(links('manifest')).toEqual([
      '/tenants/acme/crm/manifest.webmanifest',
    ]);
    expect(links('apple-touch-icon')).toEqual([
      '/tenants/acme/crm/assets/pwa-192.png',
    ]);
    dispose();
    expect(links('manifest')).toEqual([]);
    expect(links('apple-touch-icon')).toEqual([]);
  });

  it('serves from the origin root and keeps an absolute icon URL', () => {
    const dispose = mountInstallLinks({
      basePath: '/',
      appleTouchIcon: 'https://cdn.example.com/touch.png',
    });

    expect(links('manifest')).toEqual(['/manifest.webmanifest']);
    expect(links('apple-touch-icon')).toEqual([
      'https://cdn.example.com/touch.png',
    ]);
    dispose();
  });

  it('adds nothing when mounted again and removes only its own links', () => {
    const first = mountInstallLinks({ basePath: '/main' });
    const second = mountInstallLinks({ basePath: '/main' });
    expect(links('manifest')).toEqual(['/main/manifest.webmanifest']);

    second();
    expect(links('manifest')).toEqual(['/main/manifest.webmanifest']);
    first();
    first();
    expect(links('manifest')).toEqual([]);
  });

  it('keeps a manifest and icon the page links itself', () => {
    document.head.innerHTML =
      '<link rel="manifest" href="/custom.webmanifest"><link rel="apple-touch-icon" href="/custom.png">';

    const dispose = mountInstallLinks({
      basePath: '/main',
      appleTouchIcon: 'assets/pwa-192.png',
    });
    expect(links('manifest')).toEqual(['/custom.webmanifest']);
    dispose();
    expect(links('manifest')).toEqual(['/custom.webmanifest']);
    expect(links('apple-touch-icon')).toEqual(['/custom.png']);
  });
});
