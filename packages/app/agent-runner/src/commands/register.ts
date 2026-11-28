import { Flags, type Command, type Interfaces } from '@oclif/core';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { loadAdapters } from '../agent/adapters/registry.ts';
import { providedNames } from '../agent/env.ts';
import { parseFreeSpace } from '../lib/size.ts';
import { RunnerCommand, UsageError } from '../lib/command.ts';
import {
  appKey,
  normalizeServer,
  readConnection,
  readConnections,
  readSettings,
  writeConnection,
  writeSettings,
  type AppRegistration,
} from '../lib/config.ts';
import { ApiClient } from '../lib/http.ts';
import {
  CLI_NAME_PATTERN,
  EXIT_CODES,
  RUNNER_ROUTES,
  PROTOCOL_VERSION,
  RegisterResponseSchema,
  type RegisterRequest,
} from '../protocol/index.ts';
import { isolationProblem } from '../core/isolation.ts';
import { policyReport } from '../core/local-policy.ts';
import { runnerFeatures, runnerVersion } from '../core/loop.ts';
import { runnerCommandLine, runnerHost } from '../host.ts';

/** `acme=/path/to/acme` → ['acme', '/path/to/acme']. */
function parseCliOverride(value: string): [string, string] {
  const equals = value.indexOf('=');
  const name = value.slice(0, equals);
  const target = value.slice(equals + 1);
  if (equals <= 0 || target === '' || !CLI_NAME_PATTERN.test(name))
    throw new UsageError(
      `--cli takes <name>=<path>, such as acme=/usr/local/bin/acme; got ${value}.`,
    );
  const resolved = path.resolve(target);
  if (!existsSync(resolved))
    throw new UsageError(`--cli ${name}: ${resolved} does not exist.`);
  return [name, resolved];
}

export default class Register extends RunnerCommand {
  static override summary: string =
    'Register this runner with an application, as one of its runtimes.';
  static override description: string =
    'Connect this runner using a one-time registration token. Configure total and tool slots in each application’s Runtimes page.';
  static override examples: Command.Example[] = [
    '<%= config.bin %> register --server https://app.example.com --token <token>',
    '<%= config.bin %> register --server http://localhost:3000 --token <token> --cli acme=./acme/node_modules/.bin/acme',
  ];
  static override flags: {
    server: Interfaces.OptionFlag<string>;
    token: Interfaces.OptionFlag<string>;
    name: Interfaces.OptionFlag<string | undefined>;
    cli: Interfaces.OptionFlag<string[] | undefined>;
    'min-free-disk': Interfaces.OptionFlag<string | undefined>;
    force: Interfaces.BooleanFlag<boolean>;
  } = {
    server: Flags.string({
      description: 'The application server URL.',
      required: true,
    }),
    token: Flags.string({
      description: 'The one-time registration token.',
      required: true,
    }),
    name: Flags.string({
      description:
        'The runner name, the same for every application. Defaults to the host name.',
    }),
    cli: Flags.string({
      description:
        'Use a local application CLI instead of installing the one a run names: <name>=<path>. Repeatable.',
      multiple: true,
    }),
    'min-free-disk': Flags.string({
      description:
        'How much of the disk holding the working directories to keep free: a size (5G, the default), a share of the disk (10%), or off. Below it, the runner warns which directories are left for `gc` to remove.',
    }),
    force: Flags.boolean({
      description:
        'Replace an existing registration with the same application.',
    }),
  };

  async run(): Promise<{
    app: string;
    runnerId: string;
    name: string;
    server: string;
  }> {
    const { flags } = await this.parse(Register);
    const server = normalizeServer(flags.server);
    const overrides = Object.fromEntries(
      (flags.cli ?? []).map(parseCliOverride),
    );
    const settings = await readSettings(this.paths);
    if (flags.name !== undefined) settings.name = flags.name;
    if (flags['min-free-disk'] !== undefined)
      settings.minFreeDisk = parseFreeSpace(
        flags['min-free-disk'],
        '--min-free-disk',
      );
    const existing = (await readConnections(this.paths)).find(
      (connection) => connection.registration.server === server,
    );
    if (
      existing !== undefined &&
      existing.registration.revoked === undefined &&
      !flags.force
    ) {
      throw new UsageError(
        `This runner is already registered with ${server} as runner ${existing.registration.runnerId}. Pass --force to replace it.`,
        EXIT_CODES.conflict,
      );
    }
    const adapters = loadAdapters(
      process.env,
      settings.passEnv,
      existing?.registration.variables,
    );
    // The owner's local policy as it reads before the application is known; the first heartbeat sends its own.
    const policy = await policyReport(
      this.paths,
      '',
      runnerFeatures(adapters),
      isolationProblem,
    );
    const request: RegisterRequest = {
      registrationToken: flags.token,
      name: settings.name,
      hostname: os.hostname(),
      os: process.platform,
      arch: process.arch,
      version: runnerVersion(),
      product: runnerHost().product,
      protocolVersion: PROTOCOL_VERSION,
      features: policy.features,
      toolsRefreshSupported: true,
      tools: [],
      ...(policy.policy.reported ? { policy: policy.policy.reported } : {}),
      variables: providedNames(
        process.env,
        settings.passEnv,
        existing?.registration.variables,
      ),
    };
    const client = new ApiClient({ server, headers: {} });
    const response = await client.post(
      RUNNER_ROUTES.register,
      request,
      RegisterResponseSchema,
    );
    const key = appKey(server, response.app);
    const previous = await readConnection(key, this.paths);
    if (
      previous !== undefined &&
      previous.registration.server !== server &&
      previous.registration.revoked === undefined &&
      !flags.force
    )
      throw new UsageError(
        `This runner is already registered with ${previous.registration.app.name || key} at ${previous.registration.server}. Pass --force to replace it.`,
        EXIT_CODES.conflict,
      );
    const registration: AppRegistration = {
      key,
      app: response.app ?? { id: key, name: new URL(server).host },
      server,
      runnerId: response.runnerId,
      heartbeatIntervalMs: response.heartbeatIntervalMs,
      pollTimeoutMs: response.pollTimeoutMs,
      variables:
        previous?.registration.variables ??
        existing?.registration.variables ??
        {},
      cli: {
        ...(previous?.registration.cli ?? existing?.registration.cli),
        ...overrides,
      },
      registeredAt: new Date().toISOString(),
      ...(response.enabledTools ? { enabledTools: response.enabledTools } : {}),
    };
    await writeSettings(settings, this.paths);
    await writeConnection(
      { registration, runnerKey: response.runnerKey },
      this.paths,
    );
    this.log(
      `Registered ${settings.name} (${response.runnerId}) with ${registration.app.name || server} at ${server}. Start it with \`${runnerCommandLine('start')}\`.`,
    );
    return {
      app: key,
      runnerId: response.runnerId,
      name: settings.name,
      server,
    };
  }
}
