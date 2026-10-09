// `nocobase-runner env set|unset|list`: the runner's local variables, the values it provides to a run that asks for
// them by name (`workspace.passthrough`). They are kept in each registration's file (`apps/<key>.json`, 0600), never
// sent to an application: a heartbeat reports their names only. `list` shows names, never values.
import { Args, Flags, type Interfaces } from '@oclif/core';

import { RunnerCommand, UsageError } from '../lib/command.ts';
import {
  normalizeServer,
  readConnections,
  readSettings,
  writeConnection,
  writeSettings,
  type AppConnection,
} from '../lib/config.ts';
import type { RunnerPaths } from '../lib/home.ts';
import { checkEnvName } from '../lib/pass-env.ts';
import { EXIT_CODES } from '../protocol/index.ts';

const serverFlag = Flags.string({
  description:
    'The application server URL the runner registered with; every registration when left out.',
});

/** The registrations a command applies to: the one with `server`, or every one. */
async function targets(
  paths: RunnerPaths,
  server: string | undefined,
): Promise<AppConnection[]> {
  const connections = await readConnections(paths);
  if (connections.length === 0)
    throw new UsageError(
      'This runner is not registered with any application.',
      EXIT_CODES.notFound,
    );
  if (server === undefined) return connections;
  const url = normalizeServer(server);
  const match = connections.filter(
    (connection) => connection.registration.server === url,
  );
  if (match.length === 0)
    throw new UsageError(`Not registered with ${url}.`, EXIT_CODES.notFound);
  return match;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks)
    .toString('utf8')
    .replace(/\r?\n$/u, '');
}

export class EnvSet extends RunnerCommand {
  static override summary: string =
    'Set a local variable, provided to a run that asks this runner for it by name.';
  static override description: string =
    'The value stays on this machine, in the registration file (readable by you only); applications learn the name ' +
    'only. Leave VALUE out to read it from standard input, so it stays out of your shell history: ' +
    '`printf %s "$KEY" | nocobase-runner env set MY_API_KEY`. A running runner uses it from its next run.';
  static override args: {
    name: Interfaces.Arg<string>;
    value: Interfaces.Arg<string | undefined>;
  } = {
    name: Args.string({ description: 'The variable name.', required: true }),
    value: Args.string({
      description: 'The value; read from standard input when left out.',
    }),
  };
  static override flags: { server: Interfaces.OptionFlag<string | undefined> } =
    { server: serverFlag };

  async run(): Promise<{ name: string; apps: string[] }> {
    const { args, flags } = await this.parse(EnvSet);
    const name = checkEnvName(args.name);
    const value = args.value ?? (await readStdin());
    const connections = await targets(this.paths, flags.server);
    for (const connection of connections)
      await writeConnection(
        {
          ...connection,
          registration: {
            ...connection.registration,
            variables: { ...connection.registration.variables, [name]: value },
          },
        },
        this.paths,
      );
    const apps = connections.map((connection) => connection.registration.key);
    this.log(`Set ${name} for ${apps.join(', ')}.`);
    return { name, apps };
  }
}

export class EnvUnset extends RunnerCommand {
  static override summary: string =
    'Remove a local variable, or stop passing a name from the environment (--pass-env).';
  static override args: { name: Interfaces.Arg<string> } = {
    name: Args.string({ description: 'The variable name.', required: true }),
  };
  static override flags: { server: Interfaces.OptionFlag<string | undefined> } =
    { server: serverFlag };

  async run(): Promise<{ name: string; apps: string[]; passEnv: boolean }> {
    const { args, flags } = await this.parse(EnvUnset);
    const name = args.name;
    const connections = await targets(this.paths, flags.server);
    const apps: string[] = [];
    for (const connection of connections) {
      if (!(name in connection.registration.variables)) continue;
      const { [name]: _removed, ...variables } =
        connection.registration.variables;
      await writeConnection(
        {
          ...connection,
          registration: { ...connection.registration, variables },
        },
        this.paths,
      );
      apps.push(connection.registration.key);
    }
    // A passed name belongs to the machine, not to one application.
    const settings = await readSettings(this.paths);
    const passEnv =
      flags.server === undefined && (settings.passEnv ?? []).includes(name);
    if (passEnv) {
      const rest = (settings.passEnv ?? []).filter((each) => each !== name);
      const { passEnv: _old, ...others } = settings;
      await writeSettings(
        rest.length > 0 ? { ...others, passEnv: rest } : others,
        this.paths,
      );
    }
    if (apps.length === 0 && !passEnv)
      throw new UsageError(`${name} is not set.`, EXIT_CODES.notFound);
    this.log(
      [
        apps.length > 0 ? `Removed ${name} for ${apps.join(', ')}.` : '',
        passEnv
          ? `${name} is no longer passed from the environment; restart the runner (or install its service again).`
          : '',
      ]
        .filter(Boolean)
        .join(' '),
    );
    return { name, apps, passEnv };
  }
}

export interface EnvListEntry {
  readonly name: string;
  /** `local`: a local variable of the applications in `apps`; `passEnv`: passed from the runner's environment. */
  readonly source: 'local' | 'passEnv';
  readonly apps?: string[];
  /** For `passEnv`: whether this shell has it set (a service has what was set when it was installed). */
  readonly set?: boolean;
}

export class EnvList extends RunnerCommand {
  static override summary: string =
    'List the variables this runner provides to runs that ask for them, by name: never their values.';
  static override flags: { server: Interfaces.OptionFlag<string | undefined> } =
    { server: serverFlag };

  async run(): Promise<EnvListEntry[]> {
    const { flags } = await this.parse(EnvList);
    const connections = await targets(this.paths, flags.server);
    const local = new Map<string, string[]>();
    for (const connection of connections)
      for (const name of Object.keys(connection.registration.variables))
        local.set(name, [
          ...(local.get(name) ?? []),
          connection.registration.key,
        ]);
    const settings = await readSettings(this.paths);
    const entries: EnvListEntry[] = [
      ...[...local.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, apps]) => ({ name, source: 'local' as const, apps })),
      ...(settings.passEnv ?? []).map((name) => ({
        name,
        source: 'passEnv' as const,
        set: process.env[name] !== undefined,
      })),
    ];
    if (entries.length === 0)
      this.log(
        'No variables. Add one with `env set NAME`, or pass one with `start --pass-env NAME`.',
      );
    for (const entry of entries)
      this.log(
        entry.source === 'local'
          ? `${entry.name}\tlocal\t${entry.apps!.join(', ')}`
          : `${entry.name}\t--pass-env${entry.set ? '' : '\t(not set in this shell)'}`,
      );
    return entries;
  }
}
