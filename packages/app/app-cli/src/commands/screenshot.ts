import { randomUUID } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { Args, Command, Flags, type Interfaces } from '@oclif/core';

import { collectCliHooks } from '../lib/cli-hooks.ts';
import {
  appRelativeURL,
  readScreenshotSession,
  startScreenshotServer,
  writeScreenshotSession,
  type ScreenshotCredentials,
  type ScreenshotServer,
} from '../lib/screenshot/server.ts';
import { applicationState } from '../runtime/command-store.ts';

export default class Screenshot extends Command {
  static override summary =
    'Capture application pages in an isolated development instance.';
  static override description =
    'Capture in Chromium with a disposable SQLite database and Vite cache. Use --serve in one terminal and --url with the printed session file in another to reuse the server.';
  static override examples: Command.Example[] = [
    '<%= config.bin %> screenshot / /config --widths 1440,390 --locales en-US,zh-CN',
    '<%= config.bin %> screenshot --serve --sample-data',
    '<%= config.bin %> screenshot / --url <Local URL> --session <Session file>',
  ];
  static override strict = false;
  static override args: { path: Interfaces.Arg<string | undefined> } = {
    path: Args.string({
      description: 'Application-relative path. Repeat to capture more pages.',
    }),
  };
  static override flags: {
    widths: Interfaces.OptionFlag<string>;
    locales: Interfaces.OptionFlag<string | undefined>;
    themes: Interfaces.OptionFlag<string>;
    out: Interfaces.OptionFlag<string>;
    'full-page': Interfaces.BooleanFlag<boolean>;
    'wait-for': Interfaces.OptionFlag<string | undefined>;
    setup: Interfaces.OptionFlag<string | undefined>;
    script: Interfaces.OptionFlag<string | undefined>;
    'sample-data': Interfaces.BooleanFlag<boolean>;
    serve: Interfaces.BooleanFlag<boolean>;
    url: Interfaces.OptionFlag<string | undefined>;
    session: Interfaces.OptionFlag<string | undefined>;
    email: Interfaces.OptionFlag<string | undefined>;
    password: Interfaces.OptionFlag<string | undefined>;
    guest: Interfaces.BooleanFlag<boolean>;
  } = {
    widths: Flags.string({
      description: 'Comma-separated viewport widths.',
      default: '1440',
    }),
    locales: Flags.string({
      description:
        'Comma-separated application locales. Defaults to the application locale.',
    }),
    themes: Flags.string({
      description: 'Comma-separated color modes (light, dark).',
      default: 'light',
    }),
    out: Flags.string({
      description: 'Output directory relative to the application.',
      default: 'output/screenshots',
    }),
    'full-page': Flags.boolean({
      default: false,
      description: 'Capture the whole scrollable page.',
    }),
    'wait-for': Flags.string({
      description:
        'Wait for a visible Playwright selector, for example text=Dashboard.',
    }),
    setup: Flags.string({
      description:
        'Run an application-local module once after login and before navigation.',
    }),
    script: Flags.string({
      description:
        'Run an application-local module after each page opens and before capture.',
    }),
    'sample-data': Flags.boolean({
      allowNo: true,
      default: false,
      description: 'Enable the application’s optional sample seeds.',
    }),
    serve: Flags.boolean({
      default: false,
      description:
        'Keep an isolated development instance running in the foreground.',
    }),
    url: Flags.string({
      description:
        'Use an existing application entry URL, including its base path.',
    }),
    session: Flags.string({
      description:
        'Use the temporary administrator from the session file printed by --serve.',
    }),
    email: Flags.string({ description: 'Sign in with this account email.' }),
    password: Flags.string({
      description:
        'Account password. Alternatively set NOCOBASE_SCREENSHOT_PASSWORD.',
    }),
    guest: Flags.boolean({
      default: false,
      description: 'Capture without signing in.',
    }),
  };

  override async run(): Promise<void> {
    const { flags, argv } = await this.parse(Screenshot);
    const {
      location: { root },
      loadPlugins,
    } = applicationState();
    const routes = argv.map(String);
    if (
      flags.serve &&
      (flags.url ||
        routes.length ||
        flags.setup ||
        flags.script ||
        flags.guest ||
        flags.email ||
        flags.password ||
        flags.session)
    ) {
      this.error(
        '--serve starts the isolated instance only. Run the capture options separately with --url.',
      );
    }
    if (flags.url && flags['sample-data'])
      this.error('--sample-data requires a new isolated instance.');
    if (flags.session && !flags.url) this.error('--session requires --url.');
    const password =
      flags.password ??
      (flags.email ? process.env.NOCOBASE_SCREENSHOT_PASSWORD : undefined);
    if (Boolean(flags.email) !== Boolean(password)) {
      this.error(
        'Provide both --email and --password (or NOCOBASE_SCREENSHOT_PASSWORD).',
      );
    }
    if (
      Number(Boolean(flags.email)) +
        Number(flags.guest) +
        Number(Boolean(flags.session)) >
      1
    ) {
      this.error('Choose one sign-in mode: --email, --guest, or --session.');
    }
    if (flags.url && !flags.guest && !flags.session && !flags.email) {
      this.error(
        '--url requires --session, --guest, or --email with a password.',
      );
    }

    const widths = list(flags.widths).map((value) => {
      const width = Number(value);
      if (!/^\d+$/u.test(value) || width < 1 || width > 4096) {
        throw new Error('Viewport widths must be integers between 1 and 4096.');
      }
      return width;
    });
    const locales = flags.locales
      ? list(flags.locales).map((locale) => Intl.getCanonicalLocales(locale)[0])
      : [undefined];
    const themes = list(flags.themes).map((theme) => {
      if (theme !== 'light' && theme !== 'dark')
        throw new Error('Themes must be light or dark.');
      return theme;
    });
    const baseURL = flags.url ? parseBaseURL(flags.url) : undefined;
    for (const route of routes)
      appRelativeURL(baseURL ?? new URL('http://127.0.0.1/'), route);
    const out = path.resolve(root, flags.out);
    await mkdir(out, { recursive: true });
    const logPath = path.join(out, `screenshot-${randomUUID()}.log`);
    const controller = new AbortController();
    let exitCode = 0;
    const stop = (signal: NodeJS.Signals): void => {
      exitCode ||= signal === 'SIGINT' ? 130 : 143;
      controller.abort(new Error(`Screenshot interrupted by ${signal}.`));
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
    let server: ScreenshotServer | undefined;
    try {
      const capture = flags.serve
        ? undefined
        : await import('../lib/screenshot/capture.ts');
      const browserType = await capture?.loadChromium(root);
      if (!baseURL) {
        server = await startScreenshotServer({
          root,
          logPath,
          sampleData: flags['sample-data'],
          signal: controller.signal,
          hooks: JSON.stringify(collectCliHooks(await loadPlugins())),
        });
        this.log(`Local: ${server.baseURL.href}`);
      }
      if (flags.serve && server) {
        await writeScreenshotSession(server);
        this.log(`Session: ${server.sessionPath}`);
        this.log(`Development log: ${logPath}`);
        await Promise.race([
          new Promise<never>((_resolve, reject) => {
            controller.signal.throwIfAborted();
            controller.signal.addEventListener(
              'abort',
              () =>
                reject(
                  new Error('Screenshot server interrupted.', {
                    cause: controller.signal.reason,
                  }),
                ),
              { once: true },
            );
          }),
          server.exited.then((result) => {
            throw new Error(`Development server exited (${result}).`);
          }),
        ]);
      } else if (capture && browserType) {
        const target = baseURL ?? server?.baseURL;
        if (!target)
          throw new Error('No screenshot application URL is available.');
        let credentials: ScreenshotCredentials | undefined;
        if (flags.email && password)
          credentials = { email: flags.email, password };
        else if (flags.session)
          credentials = await readScreenshotSession(
            path.resolve(root, flags.session),
            target,
          );
        else if (!flags.guest) credentials = server?.credentials;
        await capture.captureScreenshots(
          {
            root,
            baseURL: target,
            out,
            routes: routes.length ? routes : ['/'],
            widths,
            locales,
            themes,
            credentials,
            restoreLocale: Boolean(baseURL),
            fullPage: flags['full-page'],
            waitFor: flags['wait-for'],
            setup: flags.setup,
            script: flags.script,
            signal: controller.signal,
            log: (message) => {
              appendFileSync(logPath, `${message}\n`, { mode: 0o600 });
              if (message.startsWith('Saved ')) this.log(message);
            },
          },
          browserType,
        );
      }
    } catch (error) {
      appendFileSync(logPath, `\n${String(error)}\n`, { mode: 0o600 });
      if (exitCode === 0) {
        this.error(
          `${error instanceof Error ? error.message : String(error)} See ${logPath}.`,
        );
      }
    } finally {
      try {
        await server?.close();
      } finally {
        process.off('SIGINT', stop);
        process.off('SIGTERM', stop);
      }
    }
    if (exitCode !== 0) this.exit(exitCode);
  }
}

function list(value: string): string[] {
  const entries = value.split(',').map((entry) => entry.trim());
  if (entries.some((entry) => !entry))
    throw new Error('Comma-separated values must be non-empty.');
  return [...new Set(entries)];
}

function parseBaseURL(value: string): URL {
  const url = new URL(value);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      '--url must be an HTTP(S) application entry URL without credentials, query, or fragment.',
    );
  }
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url;
}
