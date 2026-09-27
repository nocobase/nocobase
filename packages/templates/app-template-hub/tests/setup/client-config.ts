import { beforeEach } from 'vitest';

const RUNTIME_CONFIG_ELEMENT_ID = 'nocobase-runtime-config';

/**
 * The application server renders the client configuration into every page, and the client reads its mount path and
 * API URL from nowhere else. A test page has no server in front of it, so this puts the same block in place, mounted
 * at `/main`. A test that needs other values removes it and renders its own.
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
    config: { app: { basePath: '/main' }, api: { baseURL: '/main/api' } },
  });
  document.head.append(element);
}

// Before the test file is imported, as the server renders it before the entry module runs: some modules resolve
// URLs at the top level.
renderClientConfig();
beforeEach(renderClientConfig);
