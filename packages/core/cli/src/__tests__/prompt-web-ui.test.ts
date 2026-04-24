/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import { afterEach, test, vi } from 'vitest';

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return {
    ...actual,
    spawn: vi.fn(() => {
      const child = {
        stdout: {
          on() {
            return child.stdout;
          },
        },
        once(event: string, callback: (...args: any[]) => void) {
          if (event === 'close') {
            setImmediate(() => callback(0));
          }
          return child;
        },
        unref() {
          // noop in tests
        },
      };
      return child;
    }),
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

function requestWithAgent(
  url: string,
  options: {
    method?: 'GET' | 'POST';
    agent: http.Agent;
    headers?: Record<string, string>;
    body?: string;
  },
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method: options.method ?? 'GET',
        agent: options.agent,
        headers: options.headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk as Buffer));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function allocateLocalTcpPort(): Promise<string> {
  const server = net.createServer();

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  assert.ok(address && typeof address === 'object');

  const port = String(address.port);
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  return port;
}

test('runPromptCatalogWebUI resolves after submit even when the browser keeps a keep-alive socket open', async () => {
  const { runPromptCatalogWebUI } = await import('../lib/prompt-web-ui.js');

  const catalog = {
    projectName: {
      type: 'text' as const,
      message: 'Project name',
      required: true,
    },
  };

  let uiUrl = '';
  const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });

  try {
    const webUiPromise = runPromptCatalogWebUI({
      catalog,
      host: '127.0.0.1',
      timeoutMs: 5_000,
      onServerStart: ({ url }) => {
        uiUrl = url;
      },
      onOpenBrowserError: () => {
        // noop in tests
      },
    });

    await new Promise<void>((resolve, reject) => {
      const startedAt = Date.now();
      const timer = setInterval(() => {
        if (uiUrl) {
          clearInterval(timer);
          resolve();
          return;
        }
        if (Date.now() - startedAt > 1_000) {
          clearInterval(timer);
          reject(new Error('Timed out waiting for the local web UI server to start.'));
        }
      }, 10);
    });

    const page = await requestWithAgent(uiUrl, { agent });
    assert.equal(page.statusCode, 200);
    assert.match(page.body, /Submit &amp; continue in terminal/);

    const submitUrl = new URL('/__pwc_ui_submit', uiUrl).toString();
    const submit = await requestWithAgent(submitUrl, {
      method: 'POST',
      agent,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectName: 'demo-app' }),
    });
    assert.equal(submit.statusCode, 200);

    const resolved = await Promise.race([
      webUiPromise,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Web UI promise did not resolve after submit while a keep-alive socket was still open.')),
          750,
        ),
      ),
    ]);

    assert.deepEqual(resolved, { projectName: 'demo-app' });
  } finally {
    agent.destroy();
  }
});

test('hidden required fields are rendered disabled so browser validation does not block submit', async () => {
  const { runPromptCatalogWebUI } = await import('../lib/prompt-web-ui.js');
  const { default: EnvAdd } = await import('../commands/env/add.js');

  let uiUrl = '';
  const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });

  try {
    const webUiPromise = runPromptCatalogWebUI({
      catalog: EnvAdd.prompts,
      host: '127.0.0.1',
      timeoutMs: 5_000,
      onServerStart: ({ url }) => {
        uiUrl = url;
      },
      onOpenBrowserError: () => {
        // noop in tests
      },
    });

    await new Promise<void>((resolve, reject) => {
      const startedAt = Date.now();
      const timer = setInterval(() => {
        if (uiUrl) {
          clearInterval(timer);
          resolve();
          return;
        }
        if (Date.now() - startedAt > 1_000) {
          clearInterval(timer);
          reject(new Error('Timed out waiting for the local web UI server to start.'));
        }
      }, 10);
    });

    const page = await requestWithAgent(uiUrl, { agent });
    assert.equal(page.statusCode, 200);
    assert.match(
      page.body,
      /data-pwc-wrap="accessToken"[^>]*style="display:none"/,
    );
    assert.match(
      page.body,
      /name="accessToken" type="text"[^>]*required[^>]*disabled/,
    );

    const submitUrl = new URL('/__pwc_ui_submit', uiUrl).toString();
    const submit = await requestWithAgent(submitUrl, {
      method: 'POST',
      agent,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'local',
        scope: 'project',
        apiBaseUrl: 'http://localhost:13000/api',
        authType: 'oauth',
      }),
    });
    assert.equal(submit.statusCode, 200);

    const resolved = await Promise.race([
      webUiPromise,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Web UI promise did not resolve for the oauth flow with hidden accessToken.')),
          750,
        ),
      ),
    ]);

    assert.deepEqual(resolved, {
      name: 'local',
      scope: 'project',
      apiBaseUrl: 'http://localhost:13000/api',
      authType: 'oauth',
    });
  } finally {
    agent.destroy();
  }
});

test('reflow returns default values for fields that become visible later', async () => {
  const { runPromptCatalogWebUI } = await import('../lib/prompt-web-ui.js');
  const { default: Download } = await import('../commands/download.js');

  let uiUrl = '';
  const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });

  try {
    const webUiPromise = runPromptCatalogWebUI({
      catalog: Download.prompts,
      host: '127.0.0.1',
      timeoutMs: 5_000,
      onServerStart: ({ url }) => {
        uiUrl = url;
      },
      onOpenBrowserError: () => {
        // noop in tests
      },
    });

    await new Promise<void>((resolve, reject) => {
      const startedAt = Date.now();
      const timer = setInterval(() => {
        if (uiUrl) {
          clearInterval(timer);
          resolve();
          return;
        }
        if (Date.now() - startedAt > 1_000) {
          clearInterval(timer);
          reject(new Error('Timed out waiting for the local web UI server to start.'));
        }
      }, 10);
    });

    const reflowUrl = new URL('/__pwc_ui_reflow', uiUrl).toString();
    const reflow = await requestWithAgent(reflowUrl, {
      method: 'POST',
      agent,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'git',
        version: 'latest',
      }),
    });
    assert.equal(reflow.statusCode, 200);
    const payload = JSON.parse(reflow.body) as {
      show?: Record<string, boolean>;
      values?: Record<string, string | boolean | number>;
    };
    assert.equal(payload.show?.build, false);
    assert.equal(payload.values?.build, undefined);
    assert.equal(payload.show?.buildDts, true);
    assert.equal(payload.values?.buildDts, false);

    const submitUrl = new URL('/__pwc_ui_submit', uiUrl).toString();
    await requestWithAgent(submitUrl, {
      method: 'POST',
      agent,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'docker',
        version: 'latest',
        dockerRegistry: 'nocobase/nocobase',
      }),
    });

    await Promise.race([
      webUiPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Web UI promise did not resolve after reflow test submit.')), 750),
      ),
    ]);
  } finally {
    agent.destroy();
  }
});

test('reflow recomputes init app paths from the current app name', async () => {
  const { reflowWebFormState } = await import('../lib/prompt-web-ui.js');
  const { default: Init } = await import('../commands/init.js');

  const state = reflowWebFormState(Init.prompts, {
    appName: 'demoapp',
  });

  assert.equal(state.show.appRootPath, true);
  assert.equal(state.show.storagePath, true);
  assert.equal(state.values.appRootPath, './demoapp/source/');
  assert.equal(state.values.storagePath, './demoapp/storage/');
});

test('validate_field returns a field error for an occupied app port in web UI mode', async () => {
  const { runPromptCatalogWebUI } = await import('../lib/prompt-web-ui.js');
  const { default: Install } = await import('../commands/install.js');

  let uiUrl = '';
  const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });
  const busyServer = net.createServer();

  await new Promise<void>((resolve, reject) => {
    busyServer.once('error', reject);
    busyServer.listen(0, '127.0.0.1', () => resolve());
  });

  try {
    const busyAddress = busyServer.address();
    assert.ok(busyAddress && typeof busyAddress === 'object');

    const webUiPromise = runPromptCatalogWebUI({
      catalog: {
        appPort: Install.appPrompts.appPort,
      },
      host: '127.0.0.1',
      timeoutMs: 5_000,
      onServerStart: ({ url }) => {
        uiUrl = url;
      },
      onOpenBrowserError: () => {
        // noop in tests
      },
    });

    await new Promise<void>((resolve, reject) => {
      const startedAt = Date.now();
      const timer = setInterval(() => {
        if (uiUrl) {
          clearInterval(timer);
          resolve();
          return;
        }
        if (Date.now() - startedAt > 1_000) {
          clearInterval(timer);
          reject(new Error('Timed out waiting for the local web UI server to start.'));
        }
      }, 10);
    });

    const validateFieldUrl = new URL('/__pwc_ui_validate_field', uiUrl).toString();
    const validateField = await requestWithAgent(validateFieldUrl, {
      method: 'POST',
      agent,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appPort: String(busyAddress.port),
        _pwcField: 'appPort',
      }),
    });

    assert.equal(validateField.statusCode, 400);
    assert.match(validateField.body, /fieldKey\":\"appPort\"/);
    assert.match(validateField.body, /already in use/i);

    const freePort = await allocateLocalTcpPort();
    const submitUrl = new URL('/__pwc_ui_submit', uiUrl).toString();
    await requestWithAgent(submitUrl, {
      method: 'POST',
      agent,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appPort: freePort,
      }),
    });

    await Promise.race([
      webUiPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Web UI promise did not resolve after occupied-port validation test submit.')), 750),
      ),
    ]);
  } finally {
    agent.destroy();
    await new Promise<void>((resolve, reject) => {
      busyServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
});
