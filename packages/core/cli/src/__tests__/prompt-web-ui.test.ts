/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import http from 'node:http';
import net from 'node:net';
import { afterEach, beforeEach, test, vi, expect } from 'vitest';

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

const originalNbLocale = process.env.NB_LOCALE;

beforeEach(() => {
  process.env.NB_LOCALE = 'en-US';
});

afterEach(() => {
  if (originalNbLocale === undefined) {
    delete process.env.NB_LOCALE;
    return;
  }
  process.env.NB_LOCALE = originalNbLocale;
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
  expect(address && typeof address === 'object').toBeTruthy();

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
    expect(page.statusCode).toBe(200);
    expect(page.body).toMatch(/Submit &amp; continue in terminal/);
    expect(page.body).toMatch(/Saved\. This tab will close automatically in 5 seconds\./);

    const submitUrl = new URL('/__pwc_ui_submit', uiUrl).toString();
    const submit = await requestWithAgent(submitUrl, {
      method: 'POST',
      agent,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectName: 'demo-app' }),
    });
    expect(submit.statusCode).toBe(200);

    const resolved = await Promise.race([
      webUiPromise,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Web UI promise did not resolve after submit while a keep-alive socket was still open.')),
          750,
        ),
      ),
    ]);

    expect(resolved).toEqual({ projectName: 'demo-app' });
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
    expect(page.statusCode).toBe(200);
    expect(page.body).toMatch(/data-pwc-wrap="accessToken"[^>]*style="display:none"/);
    expect(page.body).toMatch(/name="accessToken" type="text"[^>]*required[^>]*disabled/);

    const submitUrl = new URL('/__pwc_ui_submit', uiUrl).toString();
    const submit = await requestWithAgent(submitUrl, {
      method: 'POST',
      agent,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'local',
        apiBaseUrl: 'http://localhost:13000/api',
        authType: 'oauth',
      }),
    });
    expect(submit.statusCode).toBe(200);

    const resolved = await Promise.race([
      webUiPromise,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Web UI promise did not resolve for the oauth flow with hidden accessToken.')),
          750,
        ),
      ),
    ]);

    expect(resolved).toEqual({
      name: 'local',
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
    expect(reflow.statusCode).toBe(200);
    const payload = JSON.parse(reflow.body) as {
      show?: Record<string, boolean>;
      values?: Record<string, string | boolean | number>;
    };
    expect(payload.show?.build).toBe(false);
    expect(payload.values?.build).toBe(undefined);
    expect(payload.show?.buildDts).toBe(true);
    expect(payload.values?.buildDts).toBe(false);

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

test('web UI renders disabled radio options for unavailable version presets', async () => {
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

    const page = await requestWithAgent(uiUrl, { agent });
    expect(page.statusCode).toBe(200);
    expect(page.body).toMatch(/name="version" type="radio" value="latest"[^>]*disabled/);
    expect(page.body).toMatch(/name="version" type="radio" value="latest"[^>]*data-pwc-static-disabled="1"/);

    const reflowUrl = new URL('/__pwc_ui_reflow', uiUrl).toString();
    const reflow = await requestWithAgent(reflowUrl, {
      method: 'POST',
      agent,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'docker',
      }),
    });
    expect(reflow.statusCode).toBe(200);

    const submitUrl = new URL('/__pwc_ui_submit', uiUrl).toString();
    await requestWithAgent(submitUrl, {
      method: 'POST',
      agent,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'docker',
        version: 'beta',
        dockerRegistry: 'nocobase/nocobase',
      }),
    });

    await Promise.race([
      webUiPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Web UI promise did not resolve after disabled-option test submit.')), 750),
      ),
    ]);
  } finally {
    agent.destroy();
  }
});

test('reflow reveals otherVersion and recomputes outputDir from the final version', async () => {
  const { reflowWebFormState } = await import('../lib/prompt-web-ui.js');
  const { default: Download } = await import('../commands/download.js');

  const presetState = reflowWebFormState(Download.prompts, {
    source: 'git',
  });
  expect(presetState.show.otherVersion).toBe(false);
  expect(presetState.values.version).toBe('beta');
  expect(presetState.values.outputDir).toBe('./nocobase-beta');

  const otherState = reflowWebFormState(Download.prompts, {
    source: 'git',
    version: 'other',
    otherVersion: 'fix/cli-v2',
  });
  expect(otherState.show.otherVersion).toBe(true);
  expect(otherState.values.otherVersion).toBe('fix/cli-v2');
  expect(otherState.values.outputDir).toBe('./nocobase-fix-cli-v2');
});

test('init reflow reveals otherVersion when version is set to other', async () => {
  const { reflowWebFormState } = await import('../lib/prompt-web-ui.js');
  const { default: Init } = await import('../commands/init.js');

  const state = reflowWebFormState(Init.prompts, {
    hasNocobase: 'no',
    fetchSource: true,
    source: 'docker',
    version: 'other',
  });

  expect(state.show.otherVersion).toBe(true);
});

test('reflow recomputes init app paths from the current app name', async () => {
  const { reflowWebFormState } = await import('../lib/prompt-web-ui.js');
  const { default: Init } = await import('../commands/init.js');

  const state = reflowWebFormState(Init.prompts, {
    appName: 'demoapp',
  });

  expect(state.show.appRootPath).toBe(true);
  expect(state.show.storagePath).toBe(true);
  expect(state.values.appRootPath).toBe('./demoapp/source/');
  expect(state.values.storagePath).toBe('./demoapp/storage/');
});

test('reflow recomputes the built-in database image from the current database dialect until the field is edited', async () => {
  const { reflowWebFormState } = await import('../lib/prompt-web-ui.js');
  const { default: Init } = await import('../commands/init.js');

  const initial = reflowWebFormState(Init.prompts, {
    hasNocobase: 'no',
    fetchSource: true,
    dbDialect: 'mysql',
    builtinDb: true,
  });

  expect(initial.show.builtinDbImage).toBe(true);
  expect(initial.values.builtinDbImage).toBe('mysql:8');

  const updated = reflowWebFormState(Init.prompts, {
    hasNocobase: 'no',
    fetchSource: true,
    dbDialect: 'mariadb',
    builtinDb: true,
  });

  expect(updated.values.builtinDbImage).toBe('mariadb:11');

  const customized = reflowWebFormState(Init.prompts, {
    hasNocobase: 'no',
    fetchSource: true,
    dbDialect: 'mariadb',
    builtinDb: true,
    builtinDbImage: 'registry.example.com/custom-mariadb:11',
  });

  expect(customized.values.builtinDbImage).toBe('registry.example.com/custom-mariadb:11');

  const kingbase = reflowWebFormState(Init.prompts, {
    hasNocobase: 'no',
    fetchSource: true,
    dbDialect: 'kingbase',
    builtinDb: true,
  });

  expect(kingbase.values.builtinDbImage).toBe(
    'registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86',
  );
});

test('reflow uses locale-aware built-in database images when NB_LOCALE is zh-CN', async () => {
  process.env.NB_LOCALE = 'zh-CN';
  const { reflowWebFormState } = await import('../lib/prompt-web-ui.js');
  const { default: Init } = await import('../commands/init.js');

  const state = reflowWebFormState(Init.prompts, {
    hasNocobase: 'no',
    fetchSource: true,
    dbDialect: 'postgres',
    builtinDb: true,
  });

  expect(state.values.builtinDbImage).toBe(
    'registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16',
  );
});

test('reflow uses CLI locale-aware docker registry defaults even when app language is en-US', async () => {
  process.env.NB_LOCALE = 'zh-CN';
  const { reflowWebFormState } = await import('../lib/prompt-web-ui.js');
  const { default: Init } = await import('../commands/init.js');

  const state = reflowWebFormState(Init.prompts, {
    hasNocobase: 'no',
    lang: 'en-US',
    fetchSource: true,
    source: 'docker',
    version: 'alpha',
  });

  expect(state.values.dockerRegistry).toBe(
    'registry.cn-shanghai.aliyuncs.com/nocobase/nocobase',
  );
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
    expect(busyAddress && typeof busyAddress === 'object').toBeTruthy();

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

    expect(validateField.statusCode).toBe(400);
    expect(validateField.body).toMatch(/fieldKey\":\"appPort\"/);
    expect(validateField.body).toMatch(/already in use/i);

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
