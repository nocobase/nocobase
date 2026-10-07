/**
 * The plugin's part of the application's command line (`cliToken`, `@nocobase/app-server/router`):
 *
 * - who calls the manifest: a run, by its run token, or a person, by the application's authentication (a session or an
 *   API key, scoped keys included, with the key's scope); each holds the business actions the caller gate allows;
 * - that operations whose security lists `runToken` are offered to runs.
 *
 * Every command is an API route with an `x-cli` extension; the plugin registers none of its own.
 */
import { HEADERS } from '@nocobase/agent-protocol';
import type { Auth, AuthEnv } from '@nocobase/app-plugin-authentication';
import type { AuthorizationEnv } from '@nocobase/app-plugin-authorization';
import type {
  CliCaller,
  CliIdentity,
  CliService,
} from '@nocobase/app-server/router';
import type { Context, MiddlewareHandler } from 'hono';

import type {
  CallerGate,
  CallerIdentity,
  CallerKind,
} from '../core/callers/index.js';
import { SECURITY_SCHEMES } from '../routes/openapi.js';
import { runIdentityOf } from './run-credential.js';

const IDENTITY_OF: Readonly<Record<CallerKind, CliIdentity>> = {
  run: 'run',
  user: 'person',
};

export interface CliSurfaceOptions {
  readonly cli: CliService;
  readonly auth: () => Auth;
  /** Authenticates a person the way the application does, and sets the authorization context. */
  readonly authenticatePerson: MiddlewareHandler;
  readonly gate: CallerGate;
}

type PersonEnv = {
  Variables: AuthEnv['Variables'] & AuthorizationEnv['Variables'];
};

export interface CliSurface {
  /** The manifest caller of `identity`, with the business actions it holds. */
  callerOf(identity: CallerIdentity): Promise<CliCaller>;
  /** Disconnects the plugin from the command line. */
  release(): void;
}

/** Connects the plugin to the application's command line. */
export function bindCliSurface(options: CliSurfaceOptions): CliSurface {
  const { cli } = options;

  async function callerOf(identity: CallerIdentity): Promise<CliCaller> {
    const caller: CliCaller = {
      kind: IDENTITY_OF[identity.kind],
      userId: identity.userId,
      displayName: identity.displayName,
      ...(identity.run ? { runId: identity.run.run.id } : {}),
      actions: await options.gate.allowed(identity),
    };
    return caller;
  }

  async function personOf(
    context: Context,
  ): Promise<CallerIdentity | undefined> {
    let identity: CallerIdentity | undefined;
    // A refusal the authentication answers itself (no credential, a rejected key) leaves nobody.
    await options.authenticatePerson(context, async () => {
      const plain = context as unknown as Context<PersonEnv>;
      const auth = plain.get('auth');
      if (!auth) return;
      const keyScope = plain.get('authz')?.identity.keyScope;
      identity = {
        kind: 'user',
        userId: auth.user.id,
        displayName: auth.user.name || auth.user.email,
        ...(keyScope ? { keyScope } : {}),
      };
    });
    return identity;
  }

  const releases = [
    cli.addIdentityScheme(SECURITY_SCHEMES.runToken, 'run'),
    cli.addCaller(async (context) => {
      const identity = context.req.header(HEADERS.runToken)
        ? runIdentityOf(
            (await options.auth().getSession(context.req.raw.headers)) ??
              undefined,
          )
        : await personOf(context);
      return identity ? callerOf(identity) : null;
    }),
  ];
  return {
    callerOf,
    release: () => {
      for (const release of releases.splice(0).reverse()) release();
    },
  };
}
