#!/usr/bin/env node
/* global console, document, process, setTimeout, URL, window */
// Acceptance screenshot tool: opens pages, performs actions and takes screenshots according to a configuration, and records console errors, page exceptions and failed requests.
//
// 1) Save the sign-in session (the user signs in themselves in the browser window that opens; the script never touches the password):
//    node .agents/skills/nocobase-app-development/references/frontend/scripts/capture.mjs login --base http://127.0.0.1:13000/main/ [--timeout 10]
// 2) Take screenshots from a configuration (--only a,b runs only the named shots):
//    node .agents/skills/nocobase-app-development/references/frontend/scripts/capture.mjs shoot --spec storage/ui-workflow/<feature>/capture.json [--only list,dark]
//
// Top-level configuration fields: base, out, locale, viewport, colorScheme, theme, hide (elements hidden in screenshots;
// the development toolbar by default), shots. Each shot: name, path, setup (steps run before the page opens), steps,
// waitUntil, viewport, colorScheme, theme, locale, fullPage, settle (milliseconds to wait before the screenshot),
// screenshot (false skips the final screenshot). colorScheme and theme are saved as the application's own appearance
// choices, so they win over client.app.defaultColorScheme and client.app.defaultTheme in config.yml.
// Steps: click, fill ([selector, value]), type ([selector, text] or { selector, text, delay }: types one key at a time
// into the focused field), ime ({ selector?, compose: ['z', 'zh', 'zhong'], commit: '中' }: Chinese IME composition),
// press, waitFor, wait, goto (a path within the application), offline (true/false), block (make matching requests fail
// at the network level), fulfill ({ url, status, json }: answer matching requests with that status and body), unblock
// (removes a block, fulfill or delay), delay ({ url, ms }: delay responses to matching requests), screenshot (file name of
// a mid-flow screenshot).
//
// The sign-in session is saved to storage/ui-workflow/auth.json by default (storage/ is gitignored). Do not commit or share it; delete it when the task ends.
// Run from the application root: the script loads @playwright/test from the application's node_modules. If Playwright's bundled browser is not installed, it uses the local Chrome instead.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const DEFAULT_STATE = 'storage/ui-workflow/auth.json';

// Format the log with the repository's Prettier configuration so that pnpm format:check does not fail; without Prettier, fall back to plain indentation.
async function formatJson(value, filePath) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  try {
    const prettier = await import('prettier');
    const config = (await prettier.resolveConfig(filePath)) ?? {};
    return await prettier.format(text, { ...config, parser: 'json' });
  } catch {
    return text;
  }
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const value = rest[index + 1];
    if (value === undefined || value.startsWith('--')) options[key] = true;
    else {
      options[key] = value;
      index += 1;
    }
  }
  return { command, options };
}

async function launch(options, headless) {
  // Prefer Playwright's bundled browser; if it is not installed, use the local Chrome (--channel chrome).
  const channel =
    typeof options.channel === 'string' ? options.channel : undefined;
  try {
    return await chromium.launch({ headless, channel });
  } catch (error) {
    if (channel) throw error;
    return chromium.launch({ headless, channel: 'chrome' });
  }
}

async function login(options) {
  const base = String(options.base ?? '').replace(/\/$/u, '');
  if (!base)
    throw new Error(
      'Missing --base, for example --base http://127.0.0.1:13000/main/',
    );
  const statePath = String(options.state ?? DEFAULT_STATE);
  const browser = await launch(options, false);
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${base}/`);
  console.log(
    'Sign in using the browser window that just opened. Once you are signed in, the script saves the sign-in session and closes the window automatically.',
  );

  const timeoutMinutes = Number(options.timeout ?? 10);
  const sessionPath = String(
    options['session-path'] ?? '/api/auth/get-session',
  );
  const deadline = Date.now() + timeoutMinutes * 60 * 1000;
  let signedIn = false;
  while (!signedIn && Date.now() < deadline) {
    await page.waitForTimeout(1000);
    // The session endpoint returns null when signed out, and an object containing user once signed in.
    const response = await context.request
      .get(`${base}${sessionPath}`)
      .catch(() => null);
    const session = response?.ok()
      ? await response.json().catch(() => null)
      : null;
    signedIn = Boolean(session?.user);
  }
  if (!signedIn) {
    await browser.close();
    throw new Error(
      `Sign-in was not completed within ${timeoutMinutes} minutes.`,
    );
  }
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  await context.storageState({ path: statePath });
  await browser.close();
  console.log(`Sign-in session saved to ${statePath}`);
}

async function runStep(page, context, step, state) {
  if (step.click) await page.locator(step.click).first().click();
  else if (step.fill)
    await page.locator(step.fill[0]).first().fill(step.fill[1]);
  // Type one key at a time, the way a person does: fill() sets the value in one go and cannot reveal an input that
  // falls out of sync with its state. The selector is optional; without it, typing goes to the focused element, so
  // a preceding press such as ArrowLeft can place the caret in the middle of existing text.
  else if (step.type) {
    const { selector, text, delay } = Array.isArray(step.type)
      ? { selector: step.type[0], text: step.type[1], delay: undefined }
      : step.type;
    if (selector) await page.locator(selector).first().focus();
    await page.keyboard.type(String(text), { delay: delay ?? 50 });
  }
  // Chinese IME composition through the Chrome DevTools Protocol: each compose entry is one intermediate state
  // (compositionstart/compositionupdate with isComposing true), and commit ends the composition with the chosen text
  // (compositionend). Chromium only, which is the browser this script launches.
  else if (step.ime) {
    const { selector, compose = [], commit } = step.ime;
    if (selector) await page.locator(selector).first().focus();
    const cdp = await context.newCDPSession(page);
    for (const text of compose) {
      await cdp.send('Input.imeSetComposition', {
        text,
        selectionStart: text.length,
        selectionEnd: text.length,
      });
      await page.waitForTimeout(step.ime.delay ?? 50);
    }
    await cdp.send('Input.insertText', { text: String(commit ?? '') });
    await cdp.detach();
  } else if (step.press) await page.keyboard.press(step.press);
  else if (step.waitFor) await page.locator(step.waitFor).first().waitFor();
  else if (step.wait) await page.waitForTimeout(step.wait);
  else if (step.goto) {
    await page.goto(`${state.base}${step.goto}`, {
      waitUntil: step.waitUntil ?? 'networkidle',
    });
  } else if ('offline' in step) await context.setOffline(Boolean(step.offline));
  // Make matching requests fail (to simulate an unavailable endpoint), for example "**/api/customers*".
  else if (step.block) await page.route(step.block, (route) => route.abort());
  // Answer matching requests with a status and JSON body, for the states a network failure cannot show: 403 (no
  // permission, no "Retry"), 404 (record deleted), 409 (a business error code) and 500.
  else if (step.fulfill) {
    const { url, status = 500, json = {} } = step.fulfill;
    await page.route(url, (route) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(json),
      }),
    );
  } else if (step.unblock) await page.unroute(step.unblock);
  // Delay responses to matching requests (to observe the loading and submitting states).
  else if (step.delay) {
    const { url, ms } = step.delay;
    await page.route(url, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, ms));
      await route.continue().catch(() => undefined);
    });
  }
  // Take a screenshot mid-flow; the file name is the value of screenshot.
  else if (step.screenshot) {
    const file = path.join(state.out, `${step.screenshot}.png`);
    await page.screenshot({ path: file, fullPage: Boolean(step.fullPage) });
    state.entry.files.push(file);
  } else throw new Error(`Unrecognized step: ${JSON.stringify(step)}`);
}

function toContextColorScheme(value) {
  if (value === undefined) return 'light';
  if (value === 'system') return null;
  if (value === 'light' || value === 'dark') return value;
  throw new Error(
    `colorScheme must be light, dark or system, not ${JSON.stringify(value)}`,
  );
}

async function shoot(options) {
  const specPath = String(options.spec ?? '');
  if (!specPath)
    throw new Error(
      'Missing --spec, for example --spec storage/ui-workflow/customers/capture.json',
    );
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  const base = String(spec.base ?? '').replace(/\/$/u, '');
  const out = String(
    spec.out ?? path.join(path.dirname(specPath), 'screenshots'),
  );
  const statePath = String(options.state ?? spec.state ?? DEFAULT_STATE);
  if (!fs.existsSync(statePath)) {
    throw new Error(
      `No sign-in session found at ${statePath}; run the login command first.`,
    );
  }
  fs.mkdirSync(out, { recursive: true });
  const only =
    typeof options.only === 'string' ? options.only.split(',') : null;

  const browser = await launch(options, true);
  const log = [];
  for (const shot of spec.shots) {
    if (only && !only.includes(shot.name)) continue;
    const context = await browser.newContext({
      storageState: statePath,
      viewport: shot.viewport ?? spec.viewport ?? { width: 1440, height: 900 },
      // Playwright emulates only light and dark; for system, leave the browser's own preference in place.
      colorScheme: toContextColorScheme(shot.colorScheme ?? spec.colorScheme),
      deviceScaleFactor: shot.deviceScaleFactor ?? spec.deviceScaleFactor ?? 1,
    });
    const hide = spec.hide ?? ['#agent-annotations-root'];
    if (hide.length > 0) {
      await context.addInitScript((selectors) => {
        const apply = () => {
          const style = document.createElement('style');
          style.textContent = `${selectors.join(',')} { display: none !important; }`;
          document.documentElement.appendChild(style);
        };
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', apply);
        } else apply();
      }, hide);
    }
    const locale = shot.locale ?? spec.locale;
    if (locale) {
      await context.addInitScript((value) => {
        window.localStorage.setItem('nocobase.locale', value);
      }, locale);
    }
    // Save the color mode and preset the way the Appearance popover does, under keys scoped to the deployment base
    // path (client/theme/theme-preferences.ts), so a default in config.yml does not override the requested look.
    const appearance = {
      'color-scheme': shot.colorScheme ?? spec.colorScheme,
      preset: shot.theme ?? spec.theme,
    };
    if (appearance['color-scheme'] || appearance.preset) {
      const basePath = new URL(base).pathname.replace(/^\/+|\/+$/gu, '');
      const scope = basePath ? encodeURIComponent(basePath) : '%2F';
      await context.addInitScript(
        ({ values, keyScope }) => {
          for (const [name, value] of Object.entries(values)) {
            if (value)
              window.localStorage.setItem(
                `nocobase:${keyScope}:theme:${name}`,
                value,
              );
          }
        },
        { values: appearance, keyScope: scope },
      );
    }
    const page = await context.newPage();
    const entry = {
      name: shot.name,
      files: [],
      consoleErrors: [],
      failedRequests: [],
      pageErrors: [],
    };
    page.on('console', (message) => {
      if (message.type() === 'error') entry.consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => entry.pageErrors.push(String(error)));
    page.on('response', (response) => {
      if (response.status() >= 400) {
        entry.failedRequests.push(
          `${response.status()} ${response.request().method()} ${response.url()}`,
        );
      }
    });
    page.on('requestfailed', (request) => {
      entry.failedRequests.push(
        `FAILED ${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`,
      );
    });
    const state = { base, out, entry };
    try {
      // setup runs before the page opens; suited to block, fulfill and delay.
      for (const step of shot.setup ?? [])
        await runStep(page, context, step, state);
      await page.goto(`${base}${shot.path ?? '/'}`, {
        waitUntil: shot.waitUntil ?? 'networkidle',
      });
      for (const step of shot.steps ?? [])
        await runStep(page, context, step, state);
      if (shot.screenshot !== false) {
        await page.waitForTimeout(shot.settle ?? 500);
        const file = path.join(out, `${shot.name}.png`);
        await page.screenshot({ path: file, fullPage: shot.fullPage ?? false });
        entry.files.push(file);
      }
    } catch (error) {
      entry.error = String(error);
    }
    log.push(entry);
    await context.close();
  }
  await browser.close();

  const logPath = path.join(out, 'capture-log.json');
  // When --only reruns some shots, keep the earlier entries of the other shots.
  const previous =
    only && fs.existsSync(logPath)
      ? JSON.parse(fs.readFileSync(logPath, 'utf8'))
      : [];
  const merged = [
    ...previous.filter(
      (item) => !log.some((entry) => entry.name === item.name),
    ),
    ...log,
  ];
  fs.writeFileSync(logPath, await formatJson(merged, logPath));
  for (const entry of log) {
    const problems =
      entry.consoleErrors.length +
      entry.pageErrors.length +
      entry.failedRequests.length;
    const status = entry.error
      ? `Failed: ${entry.error}`
      : problems
        ? `${problems} entries logged`
        : 'OK';
    console.log(`${entry.name}: ${status}`);
  }
  console.log(`Detailed log: ${logPath}`);
}

const { command, options } = parseArgs(process.argv.slice(2));
if (command === 'login') await login(options);
else if (command === 'shoot') await shoot(options);
else {
  console.log(
    'Usage: capture.mjs login --base <url> | capture.mjs shoot --spec <file>',
  );
  process.exitCode = 1;
}
