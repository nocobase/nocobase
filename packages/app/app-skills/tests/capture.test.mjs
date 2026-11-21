import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';

const browser = vi.hoisted(() => ({ newContext: vi.fn(), close: vi.fn() }));
vi.mock('@playwright/test', () => ({
  chromium: { launch: vi.fn(async () => browser) },
}));
import { check } from '../skills/nocobase-app-development/references/frontend/scripts/capture.mjs';

let directory;
afterEach(async () => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  process.exitCode = 0;
  if (directory) await rm(directory, { recursive: true, force: true });
});

async function setup({
  signedIn = true,
  overflow = false,
  consoleError = false,
  failedRequest = false,
} = {}) {
  directory = await mkdtemp(path.join(os.tmpdir(), 'capture-test-'));
  const state = path.join(directory, 'state.json');
  await writeFile(state, '{}');
  const handlers = {};
  const page = {
    on: vi.fn((event, handler) => {
      handlers[event] = handler;
    }),
    goto: vi.fn(async () => {
      if (consoleError)
        handlers.console({ type: () => 'error', text: () => 'Page error' });
      if (failedRequest)
        handlers.response({
          status: () => 503,
          request: () => ({ method: () => 'GET' }),
          url: () => 'http://localhost/main/api/example',
        });
    }),
    waitForTimeout: vi.fn(),
    evaluate: vi.fn(async () => ({
      scrollWidth: overflow ? 500 : 390,
      viewportWidth: 390,
    })),
    screenshot: vi.fn(),
  };
  const context = {
    request: {
      get: vi.fn(async () => ({
        ok: () => true,
        json: async () => (signedIn ? { user: { id: 'ui-check' } } : null),
      })),
    },
    close: vi.fn(),
    newPage: vi.fn(async () => page),
    addInitScript: vi.fn(),
  };
  browser.newContext.mockResolvedValue(context);
  const output = vi.spyOn(console, 'log').mockImplementation(() => {});
  return {
    options: { base: 'http://localhost/main/', state, out: directory },
    page,
    context,
    output,
  };
}

it('checks both widths headlessly and emits one JSON result with screenshots', async () => {
  const { options, page, output } = await setup();
  await check(options, ['/customers']);
  const result = JSON.parse(output.mock.calls[0][0]);
  expect(output).toHaveBeenCalledTimes(1);
  expect(result.ok).toBe(true);
  expect(result.shots).toHaveLength(2);
  expect(
    browser.newContext.mock.calls
      .slice(1)
      .map(([options]) => [
        options.viewport.width,
        options.isMobile,
        options.hasTouch,
      ]),
  ).toEqual([
    [1440, false, false],
    [390, true, true],
  ]);
  expect(page.goto).toHaveBeenCalledWith(
    'http://localhost/main/customers',
    expect.anything(),
  );
  expect(page.screenshot).toHaveBeenCalledTimes(2);
  expect(JSON.parse(await readFile(result.logPath, 'utf8'))).toHaveLength(2);
  expect(browser.close).toHaveBeenCalled();
});

it('fails before screenshots when the session expired and closes the browser', async () => {
  const { options, page } = await setup({ signedIn: false });
  await expect(check(options, ['/'])).rejects.toThrow('dev-session');
  expect(page.screenshot).not.toHaveBeenCalled();
  expect(browser.close).toHaveBeenCalled();
});

it.each([{ overflow: true }, { consoleError: true }, { failedRequest: true }])(
  'fails checks with %j and retains evidence in JSON',
  async (problems) => {
    const { options, output } = await setup(problems);
    await check(options, ['/']);
    expect(JSON.parse(output.mock.calls[0][0]).ok).toBe(false);
    expect(process.exitCode).toBe(1);
  },
);
