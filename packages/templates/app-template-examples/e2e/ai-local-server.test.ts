import {
  test,
  expect,
  request as playwrightRequest,
  type APIRequestContext,
} from '@playwright/test';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';

const employeeName = process.env.AI_E2E_EMPLOYEE ?? 'viz';
const llmService = process.env.AI_E2E_LLM_SERVICE;
const model = process.env.AI_E2E_MODEL;
const enabled = process.env.AI_LOCAL_E2E === '1';
const apiKey = process.env.AI_E2E_API_KEY;

test.describe('local AI application server', () => {
  test.skip(
    !enabled,
    'Set AI_LOCAL_E2E=1 after configuring the test application and building it to run this E2E.',
  );

  let child: ChildProcess;
  let client: APIRequestContext;
  let baseURL: string;

  test.beforeAll(async () => {
    if (!llmService || !model || !apiKey) {
      throw new Error(
        'AI_E2E_LLM_SERVICE, AI_E2E_MODEL, and AI_E2E_API_KEY are required.',
      );
    }
    const port = await getFreePort();
    baseURL = `http://127.0.0.1:${port}/ai-e2e/`;
    child = spawn(
      process.execPath,
      [path.resolve('dist/server/standalone.js')],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          APP_NAME: 'ai-e2e',
          APP_BASE_PATH: '/ai-e2e',
          APP_SERVER_HOST: '127.0.0.1',
          APP_SERVER_PORT: String(port),
          APP_VITE_DEV_URL: 'false',
        },
        stdio: 'ignore',
      },
    );
    await waitFor(`${baseURL}api/healthz`);
    client = await playwrightRequest.newContext({
      baseURL,
      extraHTTPHeaders: { 'x-api-key': apiKey },
      timeout: 90_000,
    });
    const session = await client.get('api/auth/get-session');
    expect(session.ok()).toBeTruthy();
    expect(await session.json()).toHaveProperty('user.id');
  });

  test.afterAll(async () => {
    await client?.dispose();
    child?.kill('SIGTERM');
  });

  test('runs employee discovery and a streamed conversation without the legacy AI server', async () => {
    const headers = {
      'content-type': 'application/json',
    };
    const employees = await client.get('api/ai/aiEmployees:listByUser', {
      headers,
    });
    expect(employees.ok()).toBeTruthy();
    const employeeList = (await employees.json()) as Array<{
      username: string;
    }>;
    expect(
      employeeList.some((employee) => employee.username === employeeName),
    ).toBeTruthy();

    const created = await client.post('api/ai/aiConversations:create', {
      headers,
      data: {
        aiEmployee: { username: employeeName },
        modelSettings: { llmService, model },
      },
    });
    expect(created.ok()).toBeTruthy();
    const sessionId = (await created.json()).sessionId;
    expect(typeof sessionId).toBe('string');

    try {
      const stream = await client.post('api/ai/aiConversations:sendMessages', {
        headers: { ...headers, accept: 'text/event-stream' },
        data: {
          sessionId,
          aiEmployee: employeeName,
          model: { llmService, model },
          messages: [
            { role: 'user', content: { type: 'text', content: 'e2e hello' } },
          ],
        },
      });
      expect(stream.ok()).toBeTruthy();
      const body = await stream.text();
      expect(body).toContain('"type":"stream_start"');
      const content = body
        .split(/\n\n+/)
        .flatMap((chunk) => {
          const data = chunk
            .split(/\r?\n/)
            .find((line) => line.startsWith('data: '))
            ?.slice(6);
          if (!data) return [];
          const event = JSON.parse(data) as {
            type?: string;
            body?: unknown;
          };
          return event.type === 'content' && typeof event.body === 'string'
            ? [event.body]
            : [];
        })
        .join('');
      expect(body).not.toContain('"type":"error"');
      expect(content.trim().length).toBeGreaterThan(0);
      expect(body).toContain('"type":"stream_end"');
    } finally {
      const removed = await client.delete('api/ai/aiConversations:destroy', {
        params: { sessionId },
      });
      expect(removed.ok()).toBeTruthy();
    }
  });
});

async function getFreePort(): Promise<number> {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Could not resolve a free port');
  const port = address.port;
  server.close();
  await once(server, 'close');
  return port;
}

async function waitFor(url: string): Promise<void> {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The compiled standalone server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${url}`);
}
