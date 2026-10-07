import { createInterface } from 'node:readline/promises';

import { Flags, type Command } from '@oclif/core';

import { EXIT_CODES } from '@nocobase/agent-protocol';

import { authRouteOf, manifestPathOf, type AppCliConfig } from './config.ts';
import { CliManifestSchema } from './dynamic/manifest.ts';
import { loadDynamic } from './dynamic/index.ts';
import { serverPath } from './dynamic/session.ts';
import { AppCommand, UsageError } from './lib/command.ts';
import {
  credentialHeaders,
  DEFAULT_PROFILE,
  envValue,
  listProfiles,
  normalizeServer,
  saveUserConfig,
  userClient,
} from './lib/credentials.ts';
import {
  cliUserAgent,
  openBrowser,
  type IssuedSession,
  pollDeviceAuthorization,
  startDeviceAuthorization,
} from './lib/device.ts';
import { CliCommandError } from './lib/envelope.ts';
import { globalFlags } from './lib/globals.ts';
import { AppApiError } from './lib/http.ts';
import { askUpdateHint, printUpdateHint } from './lib/update-hint.ts';
import { describeStorage, type KeyStorage } from './lib/secrets/index.ts';

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8').trim();
}

/** A user code in two halves, `WDJB-MJHT`, as device sign-in pages show it; the server ignores the hyphen. */
function displayUserCode(code: string): string {
  return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

const interactive = (): boolean =>
  Boolean(process.stdin.isTTY) && Boolean(process.stderr.isTTY);

async function ask(question: string): Promise<string> {
  const lines = createInterface({
    input: process.stdin,
    output: process.stderr,
  });
  try {
    return (await lines.question(question)).trim();
  } finally {
    lines.close();
  }
}

/** What `login` answers. */
export interface LoginResult {
  readonly server: string;
  readonly profile: string;
  readonly storage: KeyStorage;
  readonly method: 'browser' | 'api-key';
  readonly userId?: string;
  readonly displayName?: string;
}

/** `<bin> login`: signs in through the browser, or stores an API key given on standard input. */
export function loginCommand(app: AppCliConfig): Command.Class {
  const example = app.exampleServer ?? 'https://app.example.com';
  const envServer =
    app.envPrefix === undefined ? undefined : `${app.envPrefix}_SERVER`;
  return class Login extends AppCommand {
    static override summary = `Sign in to a ${app.displayName} server.`;
    static override description =
      `Opens ${app.displayName} in the browser, where you approve the code it shows; the CLI then holds a session of ` +
      `its own, renewed while you use it, which it keeps in the system keychain (the macOS Keychain, the Secret ` +
      `Service on Linux or the Windows Credential Manager; where there is none, ~/${app.stateDir}/config.json, 0600, ` +
      `with a warning). Without a browser, open the address it prints anywhere you are signed in. For CI, create an ` +
      `API key in the application and pass it on standard input with --api-key-stdin` +
      (app.envPrefix === undefined
        ? '.'
        : `, or skip signing in: set ${app.envPrefix}_SERVER and ${app.envPrefix}_API_KEY.`) +
      ` Each server you sign in to is a profile (--profile <name>, "${DEFAULT_PROFILE}" at first).`;
    static override examples = [
      `<%= config.bin %> login --server ${example}`,
      `<%= config.bin %> login --server ${example} --profile staging`,
      `<%= config.bin %> login --server ${example} --api-key-stdin < key.txt`,
    ];
    static override flags = {
      server: Flags.string({
        description: `The ${app.displayName} server URL; the profile's own when it has one${envServer ? `, or ${envServer}` : ''}.`,
      }),
      'api-key-stdin': Flags.boolean({
        description:
          'Read an API key from standard input instead of signing in through the browser.',
      }),
      token: Flags.string({
        description:
          'An API key (prefer --api-key-stdin, which keeps it out of the shell history).',
        exclusive: ['api-key-stdin'],
      }),
      browser: Flags.boolean({
        description:
          'Open the browser to approve the sign-in; --no-browser prints the address instead.',
        allowNo: true,
        default: true,
      }),
      'skip-verify': Flags.boolean({
        description: 'Store an API key without checking it against the server.',
      }),
    };

    private async serverOf(given: string | undefined): Promise<string> {
      const profile = globalFlags().profile;
      const known = (
        await listProfiles({ paths: this.paths, config: app, profile })
      ).find((entry) => entry.current);
      const server =
        given ??
        envValue(app, process.env, 'SERVER') ??
        (known && (profile === undefined || known.name === profile)
          ? known.server
          : undefined) ??
        (interactive()
          ? await ask(`${app.displayName} server URL (such as ${example}): `)
          : undefined);
      if (!server)
        throw new CliCommandError(
          'MISSING_ARGUMENT',
          `Which ${app.displayName} server? Pass --server.`,
          {
            exit: EXIT_CODES.validation,
            suggestions: [
              {
                message: `Sign in with \`${app.bin} login --server ${example}\`.`,
              },
            ],
          },
        );
      try {
        return normalizeServer(server);
      } catch {
        throw new UsageError(`Not a server URL: ${server}`);
      }
    }

    async run(): Promise<LoginResult> {
      const { flags } = await this.parse(Login);
      const server = await this.serverOf(flags.server);
      const profile = globalFlags().profile;
      const byKey =
        flags['api-key-stdin'] === true || flags.token !== undefined;
      if (!byKey && app.auth === undefined)
        throw new UsageError(
          `${app.displayName} offers no browser sign-in here: pass an API key with --api-key-stdin.`,
        );
      let key: string;
      let identity: { userId: string; displayName: string } | undefined;
      if (byKey) {
        key = flags['api-key-stdin'] ? await readStdin() : (flags.token ?? '');
        if (key === '')
          throw new UsageError(
            'Pass the API key on standard input with --api-key-stdin.',
          );
        if (!flags['skip-verify'])
          identity = await this.verify(server, { key, kind: 'apiKey' });
      } else {
        key = (await this.device(server, !flags.browser)).token;
        identity = await this.verify(server, { key, kind: 'session' });
      }
      const kind = byKey ? 'apiKey' : 'session';
      const saved = await saveUserConfig(server, key, {
        paths: this.paths,
        config: app,
        profile,
        kind,
      });
      if (saved.warning !== undefined) this.warn(saved.warning);
      const hint = askUpdateHint({
        server,
        headers: credentialHeaders({ key, kind }),
      });
      // Fetches the commands now, so completion and `docs` have them before the first command runs.
      await loadDynamic().catch(() => undefined);
      const where = describeStorage(saved.storage, this.paths.userConfig);
      this.log(
        `Signed in to ${server}${identity ? ` as ${identity.displayName}` : ''} (profile ${saved.profile})` +
          `; the ${byKey ? 'key' : 'session'} is in ${where}.`,
      );
      const result: LoginResult = {
        server,
        profile: saved.profile,
        storage: saved.storage,
        method: byKey ? 'api-key' : 'browser',
        ...(identity ?? {}),
      };
      await printUpdateHint(hint);
      return result;
    }

    /** Checks a credential against the manifest; only an authentication failure is fatal. */
    private async verify(
      server: string,
      credential: { key: string; kind: 'apiKey' | 'session' },
    ): Promise<{ userId: string; displayName: string } | undefined> {
      try {
        const { identity } = await userClient({
          server,
          ...credential,
        }).get(manifestPathOf(app), CliManifestSchema);
        return identity;
      } catch (error) {
        if (
          !(error instanceof AppApiError) ||
          error.status === 401 ||
          error.status === 403 ||
          error.status === 0
        )
          throw error;
        this.warn(
          `Could not confirm the ${credential.kind === 'session' ? 'session' : 'key'} (${error.reason}); stored it anyway.`,
        );
        return undefined;
      }
    }

    private async device(
      server: string,
      noBrowser: boolean,
    ): Promise<IssuedSession> {
      const auth = app.auth!;
      // Kept with the session the server creates, so the person can tell this machine's sign-in from others.
      const options = { userAgent: cliUserAgent(app) };
      let started;
      try {
        started = await startDeviceAuthorization(server, auth, options);
      } catch (error) {
        if (
          error instanceof AppApiError &&
          (error.status === 404 || error.reason === 'INVALID_CLIENT')
        )
          throw new CliCommandError(
            'BROWSER_SIGN_IN_UNAVAILABLE',
            error.status === 404
              ? `${server} offers no browser sign-in (${serverPath(server, authRouteOf(auth, '/device/code'))} answered 404).`
              : `${server} does not accept ${app.bin} for browser sign-in (invalid_client).`,
            {
              exit: EXIT_CODES.notFound,
              suggestions: [
                {
                  message: `Create an API key in ${app.displayName} and pass it: \`${app.bin} login --server ${server} --api-key-stdin < key.txt\`.`,
                },
              ],
            },
          );
        throw error;
      }
      // The code and the address go to stderr, so `--json` keeps stdout to its one document.
      const say = (line: string) => process.stderr.write(`${line}\n`);
      say(`Your one-time code: ${displayUserCode(started.userCode)}`);
      const opened =
        !noBrowser &&
        interactive() &&
        openBrowser(started.verificationUriComplete);
      if (opened)
        say(
          `Opened the sign-in page in your browser; check the code there and approve. If it did not open, visit ${started.verificationUriComplete}`,
        );
      else
        say(
          `On any device where you are signed in, open ${started.verificationUri} and enter the code, or open ${started.verificationUriComplete}`,
        );
      say(
        `Waiting (the code expires in ${Math.round(started.expiresIn / 60)} minutes)…`,
      );
      try {
        return await pollDeviceAuthorization(server, auth, started, options);
      } catch (error) {
        if (error instanceof AppApiError && error.reason === 'ACCESS_DENIED')
          throw new CliCommandError(
            'ACCESS_DENIED',
            'The sign-in was declined in the browser; nothing was stored.',
            { exit: EXIT_CODES.auth },
          );
        if (
          error instanceof AppApiError &&
          (error.reason === 'EXPIRED_TOKEN' || error.reason === 'INVALID_GRANT')
        )
          throw new CliCommandError(
            'EXPIRED_TOKEN',
            'The code expired before it was approved; nothing was stored.',
            {
              exit: EXIT_CODES.auth,
              suggestions: [
                {
                  message: 'Sign in again.',
                  run: {
                    command: app.bin,
                    args: ['login', '--server', server],
                  },
                },
              ],
            },
          );
        throw error;
      }
    }
  };
}
