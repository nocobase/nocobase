import { Flags } from '@oclif/core';
import type { Command, Interfaces } from '@oclif/core';
import path from 'node:path';

import { AppCommand } from '../../context.ts';
import { readCliApplication, requireCliBrand } from '../../lib/cli-brand.ts';
import {
  CLI_TARGETS,
  packCli,
  RUNNER_COMMAND,
  type CliPackResult,
} from '../../lib/cli-pack.ts';

export default class CliBuild extends AppCommand {
  static override summary =
    "Pack this application's CLI, or the runner, into standalone tarballs the application serves.";
  static override description = `Packs the command line package.json declares under nocobase.cli (run by @nocobase/app-cli-client, with the skills nocobase.cli.skills names), or with --runner the agent runner, nocobase-runner (@nocobase/agent-runner), into one tarball per platform that bundles its own Node.js, and records each file's SHA-256 and size in the product's manifest:

  <out>/<channel>/<product>/manifest.json
  <out>/<channel>/<product>/<version>/<product>-v<version>-<target>.tar.gz

The agents plugin serves them from storage/runners/dist (agents.dist.dir) to its install script, to runners and to the CLI's own update. Workspace packages the tarball needs are built and vendored; other dependencies are installed from the registry with npm. Node.js for each platform is downloaded from nodejs.org and checked against its SHASUMS256.txt; --host-node uses this machine's Node.js for its own platform instead.`;

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --runner',
    '<%= config.bin %> <%= command.id %> --out /tmp/dist --targets darwin-arm64 --host-node',
  ];

  static override flags: {
    runner: Interfaces.BooleanFlag<boolean>;
    out: Interfaces.OptionFlag<string | undefined>;
    channel: Interfaces.OptionFlag<string>;
    targets: Interfaces.OptionFlag<string | undefined>;
    version: Interfaces.OptionFlag<string | undefined>;
    'node-version': Interfaces.OptionFlag<string | undefined>;
    'host-node': Interfaces.BooleanFlag<boolean>;
    'skip-build': Interfaces.BooleanFlag<boolean>;
    'keep-staging': Interfaces.BooleanFlag<boolean>;
  } = {
    runner: Flags.boolean({
      default: false,
      description: `Pack the runner, ${RUNNER_COMMAND}, instead of the application's CLI.`,
    }),
    out: Flags.string({
      description:
        'Where the channels go. Defaults to storage/runners/dist, which the application serves.',
    }),
    channel: Flags.string({
      default: 'stable',
      description: 'The channel to pack into.',
    }),
    targets: Flags.string({
      description: `Comma-separated platforms. Defaults to ${CLI_TARGETS.join(',')}.`,
    }),
    version: Flags.string({
      description:
        "The version to pack as. Defaults to nocobase.cli.version, else the application's version; with --runner, the runner's.",
    }),
    'node-version': Flags.string({
      description:
        'The Node.js version the tarballs carry. Defaults to the one running this command.',
    }),
    'host-node': Flags.boolean({
      default: false,
      description:
        "Use this machine's Node.js for its own platform instead of downloading it.",
    }),
    'skip-build': Flags.boolean({
      default: false,
      description: 'Do not build the workspace packages first.',
    }),
    'keep-staging': Flags.boolean({
      default: false,
      description: 'Keep the staging directory, and print where it is.',
    }),
  };

  public async run(): Promise<CliPackResult> {
    const { flags } = await this.parse(CliBuild);
    const application = await readCliApplication(this.rootDir);
    if (!flags.runner) requireCliBrand(application);
    const result = await packCli({
      application,
      runner: flags.runner,
      out: path.resolve(
        this.rootDir,
        flags.out ?? path.join('storage', 'runners', 'dist'),
      ),
      channel: flags.channel,
      targets: flags.targets
        ? flags.targets
            .split(',')
            .map((target) => target.trim())
            .filter(Boolean)
        : CLI_TARGETS,
      ...(flags.version === undefined ? {} : { version: flags.version }),
      nodeVersion: flags['node-version'] ?? process.versions.node,
      hostNode: flags['host-node'],
      skipBuild: flags['skip-build'],
      keepStaging: flags['keep-staging'],
      log: (line) => process.stderr.write(`${line}\n`),
    });
    this.log(
      [
        `Packed ${result.product} ${result.version} (${result.channel}, Node.js ${result.node}) into ${result.dir}:`,
        ...Object.entries(result.targets).map(
          ([target, packed]) =>
            `  ${target}  ${packed.file}  ${packed.size} bytes  sha256 ${packed.sha256}`,
        ),
      ].join('\n'),
    );
    return result;
  }
}
