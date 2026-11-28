import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type {
  APIRequestContext,
  APIResponse,
  BrowserContext,
  Page,
  chromium,
} from '@playwright/test';

import { appRelativeURL, type ScreenshotCredentials } from './server.ts';

interface ScreenshotOptions {
  readonly root: string;
  readonly baseURL: URL;
  readonly out: string;
  readonly routes: readonly string[];
  readonly widths: readonly number[];
  readonly locales: readonly (string | undefined)[];
  readonly themes: readonly ('light' | 'dark')[];
  readonly credentials?: ScreenshotCredentials;
  readonly restoreLocale: boolean;
  readonly fullPage: boolean;
  readonly waitFor?: string;
  readonly script?: string;
  readonly setup?: string;
  readonly signal: AbortSignal;
  readonly log: (message: string) => void;
}

interface ScreenshotHookContext {
  readonly page: Page;
  readonly context: BrowserContext;
  readonly baseURL: string;
  readonly api: (
    route: string,
    options?: Parameters<APIRequestContext['fetch']>[1],
  ) => Promise<APIResponse>;
  readonly signal: AbortSignal;
}

type ScreenshotHook = (options: ScreenshotHookContext) => unknown;

const PREFERENCES = 'users/me/preferences';
const LOCALE_KEY = 'i18n.locale';

export async function loadChromium(root: string): Promise<typeof chromium> {
  const manifestPath = path.join(root, 'package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
    devDependencies?: Record<string, string>;
  };
  const require = createRequire(manifestPath);
  for (const name of ['playwright', '@playwright/test']) {
    if (!manifest.devDependencies?.[name]) continue;
    try {
      require.resolve(name);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'MODULE_NOT_FOUND')
        throw error;
      continue;
    }
    const playwright = require(name) as { chromium: typeof chromium };
    return playwright.chromium;
  }
  throw new Error(
    'Install Playwright in this application with `pnpm add -D playwright`, then run `pnpm exec playwright install chromium`.',
  );
}

async function loadHook(
  root: string,
  file?: string,
): Promise<ScreenshotHook | undefined> {
  if (!file) return undefined;
  const module = (await import(
    pathToFileURL(path.resolve(root, file)).href
  )) as {
    default?: ScreenshotHook;
  };
  if (typeof module.default !== 'function') {
    throw new Error(`${file} must default-export a screenshot hook function.`);
  }
  return module.default;
}

export async function captureScreenshots(
  options: ScreenshotOptions,
  browserType: typeof chromium,
): Promise<void> {
  const { signal, baseURL, credentials, root, log } = options;
  const setup = await loadHook(root, options.setup);
  const script = await loadHook(root, options.script);
  signal.throwIfAborted();
  const browser = await browserType
    .launch({
      handleSIGINT: false,
      handleSIGTERM: false,
      handleSIGHUP: false,
    })
    .catch((error: unknown) => {
      throw new Error(
        `Chromium could not launch. Run \`pnpm exec playwright install chromium\` in this application. ${String(error)}`,
      );
    });
  const authContext = await browser.newContext({ locale: options.locales[0] });
  const apiFor =
    (context: BrowserContext): ScreenshotHookContext['api'] =>
    (route, requestOptions) =>
      context.request.fetch(
        appRelativeURL(new URL('api/', baseURL), route).href,
        {
          ...requestOptions,
          headers: {
            ...requestOptions?.headers,
            origin: baseURL.origin,
            connection: 'close',
          },
          timeout: 10_000,
          maxRedirects: 0,
        },
      );
  const authApi = apiFor(authContext);
  let restore: (() => Promise<void>) | undefined;
  try {
    signal.throwIfAborted();
    if (credentials) {
      await expectOK(
        await authApi('auth/sign-in/email', {
          method: 'POST',
          data: credentials,
        }),
        'Email sign-in',
      );
    }
    if (setup) {
      const page = await authContext.newPage();
      try {
        await runWithSignal(
          () =>
            setup({
              page,
              context: authContext,
              baseURL: baseURL.href,
              api: authApi,
              signal,
            }),
          signal,
        );
      } finally {
        await page.close();
      }
    }
    const state = await authContext.storageState();
    if (credentials && options.restoreLocale && options.locales.some(Boolean)) {
      const response = await authApi(PREFERENCES);
      await expectOK(response, 'Reading the account locale');
      const preferences = (await response.json()) as {
        data: Record<string, unknown>;
      };
      const prior = preferences.data[LOCALE_KEY];
      restore = async () => {
        await expectOK(
          prior === undefined
            ? await authApi(`${PREFERENCES}/${LOCALE_KEY}`, {
                method: 'DELETE',
              })
            : await authApi(`${PREFERENCES}/${LOCALE_KEY}`, {
                method: 'PUT',
                data: { value: prior },
              }),
          'Restoring the account locale',
        );
      };
    }
    for (const locale of options.locales) {
      signal.throwIfAborted();
      if (locale && credentials) {
        await expectOK(
          await authApi(PREFERENCES, {
            method: 'PATCH',
            data: { [LOCALE_KEY]: locale },
          }),
          `Setting the account locale to ${locale}`,
        );
      }
      for (const width of options.widths) {
        for (const theme of options.themes) {
          signal.throwIfAborted();
          const context = await browser.newContext({
            storageState: state,
            viewport: { width, height: width <= 600 ? 844 : 900 },
            colorScheme: theme,
            locale,
          });
          try {
            const scope = encodeURIComponent(
              baseURL.pathname.replace(/^\/+|\/+$/gu, '') || '/',
            );
            await context.addInitScript(
              ({ origin, base, scope, theme, locale }) => {
                const { location } = globalThis as typeof globalThis & {
                  location: { origin: string };
                };
                if (location.origin !== origin) return;
                localStorage.setItem(
                  `nocobase:${scope}:theme:color-scheme`,
                  theme,
                );
                if (locale) {
                  localStorage.setItem(`nocobase.guest-locale:${base}`, locale);
                  localStorage.setItem(`nocobase.locale:${base}`, locale);
                }
              },
              {
                origin: baseURL.origin,
                base: baseURL.pathname,
                scope,
                theme,
                locale,
              },
            );
            const page = await context.newPage();
            const api = apiFor(context);
            for (const [index, route] of options.routes.entries()) {
              signal.throwIfAborted();
              const url = appRelativeURL(baseURL, route);
              const name =
                route
                  .split(/[?#]/u)[0]
                  .replace(/[^\w-]+/gu, '-')
                  .replace(/^-+|-+$/gu, '')
                  .slice(0, 80) || 'home';
              const file = path.join(
                options.out,
                `${index + 1}-${name}-${width}-${locale ?? 'default'}-${theme}`,
              );
              await capturePage(
                { page, context, baseURL: baseURL.href, api, signal },
                options,
                url,
                file,
                script,
              );
              log(`Saved ${file}.png`);
            }
          } finally {
            await context.close();
          }
        }
      }
    }
  } finally {
    try {
      await restore?.();
    } finally {
      await browser.close();
    }
  }
}

async function capturePage(
  hookContext: ScreenshotHookContext,
  options: ScreenshotOptions,
  url: URL,
  file: string,
  script?: ScreenshotHook,
): Promise<void> {
  const { page, signal } = hookContext;
  const details: string[] = [];
  let rejectPageError: (error: Error) => void = () => undefined;
  const pageFailed = new Promise<never>((_resolve, reject) => {
    rejectPageError = reject;
  });
  const onPageError = (error: Error): void => {
    details.push(error.stack ?? error.message);
    rejectPageError(new Error(`Uncaught page error: ${error.message}`));
  };
  const events = {
    console: (message: import('@playwright/test').ConsoleMessage) => {
      if (message.type() === 'error') details.push(message.text());
    },
    requestfailed: (request: import('@playwright/test').Request) => {
      const { origin, pathname } = new URL(request.url());
      details.push(
        `Request failed: ${request.method()} ${origin}${pathname} (${request.failure()?.errorText})`,
      );
    },
  };
  page.on('pageerror', onPageError);
  page.on('console', events.console);
  page.on('requestfailed', events.requestfailed);
  try {
    await Promise.race([
      pageFailed,
      runWithSignal(async () => {
        const response = await page.goto(url.href, { waitUntil: 'load' });
        if (response && !response.ok())
          throw new Error(`Navigation returned HTTP ${response.status()}.`);
        await page
          .locator('#root > :not(.app-bootstrap-loading)')
          .first()
          .waitFor({ state: 'attached' });
        if (!options.waitFor) {
          // Authentication can replace the bootstrap element with an empty shell while a route loads.
          const content = page.locator(
            '#root :is(main, [role="main"]), #root:not(:has(main, [role="main"]))',
          );
          await content
            .getByText(/\S/u)
            .filter({ visible: true })
            .first()
            .waitFor({ state: 'visible' });
          await page
            .locator('#root [data-slot="loading"][aria-busy="true"]:visible')
            .first()
            .waitFor({ state: 'hidden' });
        }
        await script?.(hookContext);
        if (options.waitFor)
          await page
            .locator(options.waitFor)
            .first()
            .waitFor({ state: 'visible' });
        await page.screenshot({
          path: `${file}.png`,
          fullPage: options.fullPage,
          animations: 'disabled',
        });
      }, signal),
    ]);
  } catch (error) {
    signal.throwIfAborted();
    await page
      .screenshot({ path: `${file}.failed.png`, timeout: 3_000 })
      .catch(() => undefined);
    throw new Error(`Screenshot failed at ${url.pathname}. ${String(error)}`, {
      cause: error,
    });
  } finally {
    page.off('pageerror', onPageError);
    page.off('console', events.console);
    page.off('requestfailed', events.requestfailed);
    for (const detail of details) options.log(detail);
  }
}

async function expectOK(response: APIResponse, label: string): Promise<void> {
  const status = response.status();
  if (response.ok()) return;
  throw new Error(`${label} failed (HTTP ${status}).`);
}

async function runWithSignal<T>(
  operation: () => T | Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  signal.throwIfAborted();
  let onAbort: () => void = () => undefined;
  const aborted = new Promise<never>((_resolve, reject) => {
    onAbort = () =>
      reject(new Error('Screenshot interrupted.', { cause: signal.reason }));
    signal.addEventListener('abort', onAbort, { once: true });
  });
  try {
    return await Promise.race([aborted, operation()]);
  } finally {
    signal.removeEventListener('abort', onAbort);
  }
}
