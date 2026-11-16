import { randomBytes } from 'node:crypto';
import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { AppCommand, CommandError } from '@nocobase/app-cli';
import { locateApp } from '@nocobase/app-cli/runtime';
import { Flags, type Interfaces } from '@oclif/core';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication/server';
import { authorizationToken } from '../server/tokens.js';

interface SessionCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'Strict' | 'Lax' | 'None';
}

export interface DevSessionResult {
  readonly revoked: boolean;
  readonly statePath: string;
  readonly userId?: string;
  readonly role?: string;
  readonly base: string;
}

const USERNAME = 'ui_check';
const EMAIL = 'ui-check@dev.invalid';

export default class DevSession extends AppCommand {
  static override summary =
    'Create or revoke a development-only browser session.';
  static override flags: {
    role: Interfaces.OptionFlag<string, Interfaces.CustomOptions>;
    revoke: Interfaces.BooleanFlag<boolean>;
    base: Interfaces.OptionFlag<string | undefined, Interfaces.CustomOptions>;
  } = {
    role: Flags.string({ default: 'root', summary: 'Permission Set key.' }),
    revoke: Flags.boolean({
      summary: 'Sign out and disable the UI check account.',
    }),
    base: Flags.string({
      summary: 'Running local development application entry URL.',
    }),
  };

  async run(): Promise<DevSessionResult> {
    const { flags } = await this.parse(DevSession);
    if (
      locateApp(this.rootDir).kind === 'deployment' ||
      process.env.NODE_ENV === 'production'
    )
      throw developmentOnly();
    return this.withApp(async ({ app, env }) => {
      if (app.nodeEnv === 'production' || env.NODE_ENV === 'production')
        throw developmentOnly();
      const base = new URL(
        flags.base ??
          `http://127.0.0.1:${env.APP_SERVER_PORT ?? 13000}${app.publicBasePath}/`,
      );
      // Credentials stay on the local development machine, even with an explicit --base.
      if (
        !['http:', 'https:'].includes(base.protocol) ||
        !['localhost', '127.0.0.1', '[::1]'].includes(base.hostname) ||
        base.username ||
        base.password ||
        base.search ||
        base.hash
      )
        throw new CommandError(
          'Use a local development application URL without credentials, query or fragment.',
          { code: 'INVALID_BASE_URL', exit: 2 },
        );
      base.pathname = `${base.pathname.replace(/\/+$/u, '')}/`;
      const statePath = app.paths.storage('ui-workflow/auth.json');
      await app.registerProviders();
      const users = app.container.resolve(userAdministrationServiceToken);
      const sets = app.container.resolve(authorizationToken).permissionSets;
      const connection = app.container
        .resolve(databaseManagerToken)
        .connection();
      const row = await connection.query
        .selectFrom('user')
        .select(['id', 'email', 'kind'])
        .where('username', '=', USERNAME)
        .where('deletedAt', 'is', null)
        .executeTakeFirst();
      if (row && (row.email !== EMAIL || row.kind === 'service'))
        throw new CommandError(
          'The ui_check username belongs to another account.',
          { code: 'DEV_ACCOUNT_CONFLICT' },
        );
      if (!flags.revoke && !(await sets.get(flags.role)))
        throw new CommandError('The requested Permission Set does not exist.', {
          code: 'ROLE_NOT_FOUND',
        });
      await signOutSavedSession(statePath, base);
      if (flags.revoke) {
        if (row) await users.disable(String(row.id));
        await rm(statePath, { force: true });
        this.log('Development browser session revoked.');
        return {
          revoked: true,
          statePath,
          base: base.href,
          ...(row ? { userId: String(row.id) } : {}),
        };
      }
      await rm(statePath, { force: true });
      const password = randomBytes(32).toString('base64url');
      const user = row
        ? await users.enable(String(row.id))
        : await users.create({
            name: 'UI check',
            username: USERNAME,
            email: EMAIL,
            password,
          });
      if (row) await users.resetPassword(user.id, password);
      await sets.replaceSubjectAssignments({
        subject: { type: 'user', id: user.id },
        managedPermissionSets: (await sets.list()).map((set) => set.key),
        permissionSets: [flags.role],
      });
      // Sign in through the serving process: its session cache must outlive this CLI process.
      const response = await request(base, 'api/auth/sign-in/username', {
        method: 'POST',
        body: JSON.stringify({ username: USERNAME, password }),
      });
      if (!response.ok)
        throw new CommandError(
          'Development sign-in failed. Check the running application and its authentication configuration.',
          { code: 'DEV_SIGN_IN_FAILED' },
        );
      const cookies = response.headers
        .getSetCookie()
        .map((value) => sessionCookie(value, base))
        .filter(
          (cookie) =>
            cookie.expires === -1 || cookie.expires > Date.now() / 1000,
        );
      if (!cookies.length)
        throw new CommandError('The application returned no session cookies.', {
          code: 'DEV_SIGN_IN_FAILED',
        });
      await mkdir(path.dirname(statePath), { recursive: true, mode: 0o700 });
      await writeFile(statePath, JSON.stringify({ cookies, origins: [] }), {
        mode: 0o600,
      });
      await chmod(statePath, 0o600);
      this.log(`Development browser session saved to ${statePath}`);
      return {
        revoked: false,
        statePath,
        userId: user.id,
        role: flags.role,
        base: base.href,
      };
    });
  }
}

function developmentOnly(): CommandError {
  return new CommandError(
    'Browser development sessions are unavailable in production or deployments.',
    { code: 'DEVELOPMENT_ONLY' },
  );
}

async function request(
  base: URL,
  route: string,
  init: RequestInit,
): Promise<Response> {
  try {
    return await fetch(new URL(route, base), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Origin: base.origin,
        ...init.headers,
      },
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    // Never include a request body or a third-party error in CLI diagnostics.
    throw new CommandError(
      'Cannot reach the local application. Start pnpm dev and use its Local URL with --base.',
      { code: 'DEV_SERVER_UNAVAILABLE' },
    );
  }
}

async function signOutSavedSession(
  statePath: string,
  base: URL,
): Promise<void> {
  let saved: { cookies: SessionCookie[] };
  try {
    saved = JSON.parse(await readFile(statePath, 'utf8')) as typeof saved;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw new CommandError('Cannot read the saved development session.', {
      code: 'INVALID_SESSION_STATE',
    });
  }
  const cookies = saved.cookies.filter(
    (cookie) =>
      cookie.domain.replace(/^\./u, '') === base.hostname &&
      base.pathname.startsWith(cookie.path),
  );
  if (!cookies.length)
    throw new CommandError(
      'Use the same host and base path as the saved development session.',
      { code: 'SESSION_BASE_MISMATCH' },
    );
  const response = await request(base, 'api/auth/sign-out', {
    method: 'POST',
    body: '{}',
    headers: {
      Cookie: cookies
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join('; '),
    },
  });
  if (!response.ok)
    throw new CommandError(
      'Could not revoke the saved session on the running application.',
      { code: 'DEV_SIGN_OUT_FAILED' },
    );
}

function sessionCookie(header: string, base: URL): SessionCookie {
  const [pair, ...attributes] = header.split(';');
  const separator = pair!.indexOf('=');
  const cookie: SessionCookie = {
    name: pair!.slice(0, separator).trim(),
    value: pair!.slice(separator + 1).trim(),
    domain: base.hostname,
    path: '/',
    expires: -1,
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  };
  for (const attribute of attributes) {
    const [rawName, ...parts] = attribute.trim().split('=');
    const value = parts.join('=');
    switch (rawName!.toLowerCase()) {
      case 'domain':
        cookie.domain = value;
        break;
      case 'path':
        cookie.path = value;
        break;
      case 'expires':
        cookie.expires = Date.parse(value) / 1000;
        break;
      case 'max-age':
        cookie.expires = Date.now() / 1000 + Number(value);
        break;
      case 'httponly':
        cookie.httpOnly = true;
        break;
      case 'secure':
        cookie.secure = true;
        break;
      case 'samesite':
        cookie.sameSite =
          value.toLowerCase() === 'none'
            ? 'None'
            : value.toLowerCase() === 'strict'
              ? 'Strict'
              : 'Lax';
        break;
    }
  }
  return cookie;
}
