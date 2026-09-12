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
  vi.unstubAllGlobals();
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
    expect(page.body).toMatch(
      /<span class="pwc-form-item-required" aria-hidden="true">\*<\/span><span class="pwc-l">Project name<\/span>/,
    );

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
      new Promise<never>((_resolve, reject) =>
        setTimeout(
          () =>
            reject(new Error('Web UI promise did not resolve after submit while a keep-alive socket was still open.')),
          750,
        ),
      ),
    ]);

    expect(resolved).toEqual({ projectName: 'demo-app' });
  } finally {
    agent.destroy();
  }
});

test('runPromptCatalogWebUI treats host as the browser URL host and listens on all interfaces', async () => {
  const { runPromptCatalogWebUI } = await import('../lib/prompt-web-ui.js');

  const catalog = {
    projectName: {
      type: 'text' as const,
      message: 'Project name',
      required: true,
    },
  };

  let publicUrl = '';
  let localUrl = '';
  const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });

  try {
    const webUiPromise = runPromptCatalogWebUI({
      catalog,
      host: '203.0.113.10',
      timeoutMs: 5_000,
      onServerStart: ({ listenHost, port, url }) => {
        publicUrl = url;
        localUrl = `http://127.0.0.1:${port}/`;
        expect(listenHost).toBe('0.0.0.0');
      },
      onOpenBrowserError: () => {
        // noop in tests
      },
    });

    await new Promise<void>((resolve, reject) => {
      const startedAt = Date.now();
      const timer = setInterval(() => {
        if (localUrl) {
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

    expect(publicUrl).toMatch(/^http:\/\/203\.0\.113\.10:\d+\/$/);

    const page = await requestWithAgent(localUrl, { agent });
    expect(page.statusCode).toBe(200);

    const submit = await requestWithAgent(`${localUrl}__pwc_ui_submit`, {
      method: 'POST',
      agent,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectName: 'demo' }),
    });
    expect(submit.statusCode).toBe(200);
    await expect(webUiPromise).resolves.toEqual({ projectName: 'demo' });
  } finally {
    agent.destroy();
  }
});

test('buildWebFormValuesFromCatalog resolves function defaults for password fields', async () => {
  const { buildWebFormValuesFromCatalog } = await import('../lib/prompt-web-ui.js');

  const values = buildWebFormValuesFromCatalog(
    {
      rootPassword: {
        type: 'password',
        message: 'Root password',
        required: true,
      },
      authType: {
        type: 'select',
        message: 'Authentication type',
        options: ['basic', 'oauth'],
        initialValue: 'basic',
        required: true,
      },
      installPassword: {
        type: 'password',
        message: 'Install password',
        required: true,
        hidden: (currentValues) => currentValues.authType !== 'basic',
        initialValue: (currentValues) => String(currentValues.rootPassword ?? ''),
      },
    },
    {
      rootPassword: 'admin123',
    },
  );

  expect(values.installPassword).toBe('admin123');
});

test('buildWebFormValuesFromCatalog resolves text defaults for app public path fields', async () => {
  const { buildWebFormValuesFromCatalog } = await import('../lib/prompt-web-ui.js');

  const values = buildWebFormValuesFromCatalog({
    appPublicPath: {
      type: 'text',
      message: 'App public path',
      initialValue: '/',
    },
  });

  expect(values.appPublicPath).toBe('/');
});

test('web UI renders a password visibility toggle next to the validation suffix for password fields', async () => {
  const { runPromptCatalogWebUI } = await import('../lib/prompt-web-ui.js');

  const catalog = {
    adminPassword: {
      type: 'password' as const,
      message: 'Admin password',
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
    expect(page.body).toContain('data-pwc-password-wrap="1"');
    expect(page.body).toContain('data-pwc-password-input="1"');
    expect(page.body).toMatch(/name="adminPassword" type="password"/);
    expect(page.body).toMatch(
      /<span class="pwc-form-item-suffix" data-pwc-suffix="1" aria-hidden="true"><\/span>\s*<button class="pwc-password-toggle" type="button" data-pwc-password-toggle="1" aria-label="Show password" title="Show password" aria-pressed="false">/,
    );

    const submitUrl = new URL('/__pwc_ui_submit', uiUrl).toString();
    const submit = await requestWithAgent(submitUrl, {
      method: 'POST',
      agent,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: 'secret123' }),
    });
    expect(submit.statusCode).toBe(200);

    const resolved = await Promise.race([
      webUiPromise,
      new Promise<never>((_resolve, reject) =>
        setTimeout(() => reject(new Error('Web UI promise did not resolve after password toggle test submit.')), 750),
      ),
    ]);

    expect(resolved).toEqual({ adminPassword: 'secret123' });
  } finally {
    agent.destroy();
  }
});

test('web UI normalizes select controls to the same custom control height as text inputs', async () => {
  const { runPromptCatalogWebUI } = await import('../lib/prompt-web-ui.js');

  const catalog = {
    language: {
      type: 'select' as const,
      message: 'Language',
      required: true,
      options: ['en-US', 'zh-CN'],
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
    expect(page.body).toContain('.pwc-input-affix-wrapper--select::after');
    expect(page.body).toContain('appearance: none;');
    expect(page.body).toContain('height: 40px;');
    expect(page.body).toContain('.pwc-input-affix-wrapper--select .pwc-form-item-suffix { right: 36px; }');

    const submitUrl = new URL('/__pwc_ui_submit', uiUrl).toString();
    const submit = await requestWithAgent(submitUrl, {
      method: 'POST',
      agent,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'en-US' }),
    });
    expect(submit.statusCode).toBe(200);

    const resolved = await Promise.race([
      webUiPromise,
      new Promise<never>((_resolve, reject) =>
        setTimeout(() => reject(new Error('Web UI promise did not resolve after select height test submit.')), 750),
      ),
    ]);

    expect(resolved).toEqual({ language: 'en-US' });
  } finally {
    agent.destroy();
  }
});

test('hidden required fields are rendered disabled so browser validation does not block submit', async () => {
  const { runPromptCatalogWebUI } = await import('../lib/prompt-web-ui.js');
  const { default: EnvAdd } = await import('../commands/env/add.js');

  let uiUrl = '';
  const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url === 'http://localhost:13000/api/__health_check') {
      return {
        status: 200,
        json: vi.fn(),
      } as any;
    }
    throw new Error(`Unexpected fetch url: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);

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
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:13000/api/__health_check',
      expect.objectContaining({ method: 'GET' }),
    );

    const resolved = await Promise.race([
      webUiPromise,
      new Promise<never>((_resolve, reject) =>
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
  const { default: Download } = await import('../commands/source/download.js');

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
      new Promise<never>((_resolve, reject) =>
        setTimeout(() => reject(new Error('Web UI promise did not resolve after reflow test submit.')), 750),
      ),
    ]);
  } finally {
    agent.destroy();
  }
});

test('web UI renders enabled radio options for version presets', async () => {
  const { runPromptCatalogWebUI } = await import('../lib/prompt-web-ui.js');
  const { default: Download } = await import('../commands/source/download.js');

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
    expect(page.body).toMatch(/name="version" type="radio" value="latest"/);
    expect(page.body).not.toMatch(/name="version" type="radio" value="latest"[^>]*disabled/);
    expect(page.body).not.toMatch(/name="version" type="radio" value="latest"[^>]*data-pwc-static-disabled="1"/);

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
      new Promise<never>((_resolve, reject) =>
        setTimeout(() => reject(new Error('Web UI promise did not resolve after disabled-option test submit.')), 750),
      ),
    ]);
  } finally {
    agent.destroy();
  }
});

test('reflow reveals otherVersion and recomputes outputDir from the final version', async () => {
  const { reflowWebFormState } = await import('../lib/prompt-web-ui.js');
  const { default: Download } = await import('../commands/source/download.js');

  const presetState = reflowWebFormState(Download.prompts, {
    source: 'git',
  });
  expect(presetState.show.otherVersion).toBe(false);
  expect(presetState.values.version).toBe('latest');
  expect(presetState.values.outputDir).toBe('./nocobase-latest');

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
    source: 'docker',
    version: 'other',
  });

  expect(state.show.otherVersion).toBe(true);
});

test('init reflow keeps source prompts visible and hides download execution prompts when skipDownload is enabled', async () => {
  const { reflowWebFormState } = await import('../lib/prompt-web-ui.js');
  const { default: Init } = await import('../commands/init.js');

  const state = reflowWebFormState(Init.prompts, {
    hasNocobase: 'no',
    skipDownload: true,
    source: 'git',
    version: 'beta',
  });

  expect(state.show.skipDownload).toBe(true);
  expect(state.values.skipDownload).toBe(true);
  expect(state.show.source).toBe(true);
  expect(state.show.version).toBe(true);
  expect(state.show.gitUrl).toBe(true);
  expect(state.show.npmRegistry).toBe(true);
  expect(state.show.outputDir).toBe(false);
  expect(state.show.replace).toBe(false);
  expect(state.show.devDependencies).toBe(false);
  expect(state.show.build).toBe(false);
  expect(state.show.buildDts).toBe(false);
});

test('reflow recomputes init app paths from the current app name', async () => {
  const { reflowWebFormState } = await import('../lib/prompt-web-ui.js');
  const { default: Init } = await import('../commands/init.js');

  const state = reflowWebFormState(Init.prompts, {
    appName: 'demoapp',
  });

  expect(state.show.appPath).toBe(true);
  expect(state.values.appPath).toBe('./demoapp/');
});

test('reflow recomputes the built-in database image from the current database dialect until the field is edited', async () => {
  const { reflowWebFormState } = await import('../lib/prompt-web-ui.js');
  const { default: Init } = await import('../commands/init.js');

  const initial = reflowWebFormState(Init.prompts, {
    hasNocobase: 'no',
    dbDialect: 'mysql',
    builtinDb: true,
  });

  expect(initial.show.builtinDbImage).toBe(true);
  expect(initial.values.builtinDbImage).toBe('mysql:8');

  const updated = reflowWebFormState(Init.prompts, {
    hasNocobase: 'no',
    dbDialect: 'mariadb',
    builtinDb: true,
  });

  expect(updated.values.builtinDbImage).toBe('mariadb:11');

  const customized = reflowWebFormState(Init.prompts, {
    hasNocobase: 'no',
    dbDialect: 'mariadb',
    builtinDb: true,
    builtinDbImage: 'registry.example.com/custom-mariadb:11',
  });

  expect(customized.values.builtinDbImage).toBe('registry.example.com/custom-mariadb:11');

  const kingbase = reflowWebFormState(Init.prompts, {
    hasNocobase: 'no',
    dbDialect: 'kingbase',
    builtinDb: true,
  });

  expect(kingbase.values.builtinDbImage).toBe(
    'registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86',
  );
});

test('reflow uses dockerhub-compatible built-in database images by default', async () => {
  process.env.NB_LOCALE = 'zh-CN';
  const { reflowWebFormState } = await import('../lib/prompt-web-ui.js');
  const { default: Init } = await import('../commands/init.js');

  const state = reflowWebFormState(Init.prompts, {
    hasNocobase: 'no',
    dbDialect: 'postgres',
    builtinDb: true,
  });

  expect(state.values.builtinDbImage).toBe('postgres:16');
});

test('reflow uses CLI locale-aware docker registry defaults even when app language is en-US', async () => {
  process.env.NB_LOCALE = 'zh-CN';
  const { reflowWebFormState } = await import('../lib/prompt-web-ui.js');
  const { default: Init } = await import('../commands/init.js');

  const state = reflowWebFormState(Init.prompts, {
    hasNocobase: 'no',
    lang: 'en-US',
    source: 'docker',
    version: 'alpha',
  });

  expect(state.values.dockerRegistry).toBe('registry.cn-shanghai.aliyuncs.com/nocobase/nocobase');
});

test('reflow recomputes the built-in database image from the configured registry seed', async () => {
  const { reflowWebFormState } = await import('../lib/prompt-web-ui.js');
  const { default: Init } = await import('../commands/init.js');

  const state = reflowWebFormState(
    Init.prompts,
    {
      hasNocobase: 'no',
      dbDialect: 'mariadb',
      builtinDb: true,
    },
    {
      builtinDbImageRegistry: 'registry.cn-shanghai.aliyuncs.com/nocobase/nocobase',
    },
  );

  expect(state.values.builtinDbImage).toBe('registry.cn-shanghai.aliyuncs.com/nocobase/mariadb:11');
});

test('reflow recomputes the built-in database image from the zh-CN registry fallback seed', async () => {
  const { reflowWebFormState } = await import('../lib/prompt-web-ui.js');
  const { default: Init } = await import('../commands/init.js');

  const state = reflowWebFormState(
    Init.prompts,
    {
      hasNocobase: 'no',
      dbDialect: 'postgres',
      builtinDb: true,
    },
    {
      builtinDbImageRegistry: 'registry.cn-shanghai.aliyuncs.com/nocobase/nocobase',
    },
  );

  expect(state.values.builtinDbImage).toBe('registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16');
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
    expect(validateField.body).toMatch(/fieldKey":"appPort"/);
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
      new Promise<never>((_resolve, reject) =>
        setTimeout(
          () => reject(new Error('Web UI promise did not resolve after occupied-port validation test submit.')),
          750,
        ),
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
