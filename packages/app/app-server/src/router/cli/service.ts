import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { Context } from 'hono';

import type { ApiDocument } from '../openapi/document.js';
import {
  cliManifestOf,
  deriveAllCliCommands,
  type DeriveCliCommandsOptions,
} from './derive.js';
import type {
  CliCaller,
  CliCommand,
  CliDescription,
  CliExclusion,
  CliIdentity,
  CliManifest,
} from './types.js';

/**
 * Tells who calls the CLI manifest: a caller, `null` for a request it recognizes but refuses, or `undefined` to leave
 * the request to the other resolvers. It may throw an `ApiError` to answer with a status of its own.
 */
export type CliCallerResolver = (
  context: Context,
) => Promise<CliCaller | null | undefined> | CliCaller | null | undefined;

/**
 * The application's command-line surface: the commands its API document describes, filtered per caller. Who a caller is
 * comes from the resolvers plugins register (the framework knows no credential); which security schemes name which
 * identity from `addIdentityScheme()`; which documented
 * operations stay off the command line from `exclude()`.
 */
export class CliService {
  private readonly resolvers: CliCallerResolver[] = [];
  private readonly schemes: Record<string, CliIdentity> = {};
  private readonly exclusions: CliExclusion[] = [];
  private readonly listeners: (() => void)[] = [];
  private description: CliDescription = {};
  private derived:
    | { readonly document: ApiDocument; readonly commands: CliCommand[] }
    | undefined;

  /** Recognize callers with `resolver`. Returns a function that removes it. */
  public addCaller(resolver: CliCallerResolver): () => void {
    return this.track(this.resolvers, resolver);
  }

  /** An operation whose security names `scheme` is offered to `identity`. Returns a function that removes it. */
  public addIdentityScheme(scheme: string, identity: CliIdentity): () => void {
    this.schemes[scheme] = identity;
    this.changed();
    return () => {
      if (this.schemes[scheme] === identity) delete this.schemes[scheme];
      this.changed();
    };
  }

  /** The security schemes `addIdentityScheme()` named, beside the session and the API key. */
  public identitySchemes(): Readonly<Record<string, CliIdentity>> {
    return { ...this.schemes };
  }

  /** Keeps the operations `rule` matches off the command line; they stay documented. Returns what removes it. */
  public exclude(rule: CliExclusion): () => void {
    this.exclusions.push(rule);
    this.changed();
    return () => {
      const index = this.exclusions.indexOf(rule);
      if (index >= 0) this.exclusions.splice(index, 1);
      this.changed();
    };
  }

  /** Calls `listener` whenever the identity schemes or exclusions change. Returns what removes it. */
  public onChange(listener: () => void): () => void {
    return this.track(this.listeners, listener);
  }

  /** Names the application's CLI, for the agent-readable reference (`GET /api/cli/llms.txt`). */
  public describe(description: CliDescription): void {
    this.description = { ...this.description, ...description };
  }

  /** What `describe()` said. */
  public described(): CliDescription {
    return { ...this.description };
  }

  /** Whether any resolver is registered: without one, nobody can be told apart and there is no manifest. */
  public hasCallers(): boolean {
    return this.resolvers.length > 0;
  }

  /** Who calls, by the first resolver that recognizes the request; `null` when none does. */
  public async callerOf(context: Context): Promise<CliCaller | null> {
    for (const resolver of [...this.resolvers]) {
      const caller = await resolver(context);
      if (caller !== undefined) return caller;
    }
    return null;
  }

  /** Every command `document` describes, derived once per document. */
  public commandsOf(document: ApiDocument): readonly CliCommand[] {
    if (this.derived?.document !== document) {
      const options: DeriveCliCommandsOptions = {
        identitySchemes: { ...this.schemes },
        exclude: [...this.exclusions],
      };
      this.derived = {
        document,
        commands: deriveAllCliCommands(document, options),
      };
    }
    return this.derived.commands;
  }

  /** The manifest of `caller`: the commands `document` describes that it may run. */
  public manifestFor(document: ApiDocument, caller: CliCaller): CliManifest {
    return cliManifestOf(this.commandsOf(document), caller);
  }

  private changed(): void {
    this.derived = undefined;
    for (const listener of [...this.listeners]) listener();
  }

  private track<T>(list: T[], entry: T): () => void {
    list.push(entry);
    return () => {
      const index = list.indexOf(entry);
      if (index >= 0) list.splice(index, 1);
    };
  }
}

/** The application's `CliService`; a plugin resolves it to recognize callers or add commands. */
export const cliToken: ServiceToken<CliService> =
  createServiceToken<CliService>('@nocobase/app/cli');
