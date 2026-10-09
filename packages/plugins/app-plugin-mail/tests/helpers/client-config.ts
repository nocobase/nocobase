import { beforeEach } from 'vitest';

const RUNTIME_CONFIG_ELEMENT_ID = 'nocobase-runtime-config';

/**
 * The application server renders the client configuration into every page, and `resolveAppUrl` reads the mount path
 * from nowhere else. A test page has no server in front of it, so this puts the same block in place, mounted at the
 * origin root the expectations are written against. A test that needs another path removes it and renders its own.
 */
function renderClientConfig(): void {
  // Server-side tests run under `@vitest-environment node`, where there is no page to render into.
  if (typeof document === 'undefined') return;
  if (document.getElementById(RUNTIME_CONFIG_ELEMENT_ID)) return;
  const element = document.createElement('script');
  element.id = RUNTIME_CONFIG_ELEMENT_ID;
  element.type = 'application/json';
  element.textContent = JSON.stringify({
    version: 1,
    config: { app: { basePath: '' }, api: { baseURL: '/api' } },
  });
  document.head.append(element);
}

// Before the test file is imported: some modules resolve URLs at the top level.
renderClientConfig();
beforeEach(renderClientConfig);
