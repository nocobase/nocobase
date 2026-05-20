/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { buildSuggestedInitCommand, publishSourceSnapshot } from '../../lib/source-publish.js';
import { failTask, printInfo, startTask, succeedTask } from '../../lib/ui.js';

function formatPublishFailure(message: string): string {
  if (
    message.includes('The specified --cwd does not exist:')
    || message.includes('The specified --cwd is not a directory:')
    || message.includes('Couldn\'t find a NocoBase source project from --cwd:')
  ) {
    return message;
  }

  return [
    'Couldn\'t publish a source snapshot.',
    'Check that Docker is running, the target npm registry is reachable, and the current directory is a NocoBase source repo.',
    `Details: ${message}`,
  ].join('\n');
}

export default class SourcePublish extends Command {
  static override description =
    'Publish the current NocoBase source repo as a snapshot version to an npm registry for install testing.';

  static override examples = [
    '<%= config.bin %> <%= command.id %> --snapshot',
    '<%= config.bin %> <%= command.id %> --snapshot --no-build',
    '<%= config.bin %> <%= command.id %> --snapshot --build-dts',
    '<%= config.bin %> <%= command.id %> --snapshot --cwd /path/to/nocobase/source',
    '<%= config.bin %> <%= command.id %> --snapshot --npm-registry=http://127.0.0.1:4873',
    '<%= config.bin %> <%= command.id %> --snapshot --json',
  ];

  static override flags = {
    snapshot: Flags.boolean({
      description: 'Publish the current source repo as a unique snapshot version',
      required: true,
      default: false,
    }),
    'npm-registry': Flags.string({
      description: 'npm registry URL to publish to. Defaults to the running local source registry when available',
      required: false,
    }),
    cwd: Flags.string({
      description: 'Source repository path. Defaults to the nearest detected NocoBase source root from the current working directory',
      required: false,
    }),
    'no-build': Flags.boolean({
      description: 'Skip building the source repo before snapshot versioning and publish',
      default: false,
    }),
    'build-dts': Flags.boolean({
      description: 'Generate TypeScript declaration files during the source build',
      default: false,
    }),
    json: Flags.boolean({
      description: 'Print the publish result as JSON',
      default: false,
    }),
    verbose: Flags.boolean({
      description: 'Show detailed command output while versioning and publishing the snapshot',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(SourcePublish);
    if (!flags.snapshot) {
      this.error('`nb source publish` currently requires `--snapshot`.');
    }

    if (!flags.json) {
      startTask('Publishing a source snapshot...');
    }

    try {
      const result = await publishSourceSnapshot({
        cwd: flags.cwd,
        npmRegistry: flags['npm-registry'],
        build: !flags['no-build'],
        buildDts: flags['build-dts'],
        verbose: flags.verbose,
      });

      if (flags.json) {
        this.log(JSON.stringify({
          version: result.version,
          npmRegistry: result.npmRegistry,
          gitSha: result.gitSha,
          projectRoot: result.projectRoot,
          suggestedInitCommand: buildSuggestedInitCommand(result),
        }, null, 2));
        return;
      }

      succeedTask(`Published source snapshot ${result.version} to ${result.npmRegistry}.`);
      printInfo(`Source root: ${result.projectRoot}`);
      printInfo(`Snapshot version: ${result.version}`);
      printInfo(`npm registry: ${result.npmRegistry}`);
      printInfo(`Next: ${buildSuggestedInitCommand(result)}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (flags.json) {
        this.logToStderr(JSON.stringify({
          error: formatPublishFailure(message),
        }, null, 2));
        this.exit(1);
      }

      failTask('Failed to publish the source snapshot.');
      this.error(formatPublishFailure(message));
    }
  }
}
