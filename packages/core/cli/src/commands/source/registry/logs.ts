/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { run } from '../../../lib/run-npm.js';
import { printInfo } from '../../../lib/ui.js';
import { getSourceRegistryInfo } from '../../../lib/source-registry.js';

function formatLogsFailure(message: string): string {
  if (/does not exist/i.test(message)) {
    return [
      'Can\'t show source registry logs yet.',
      'The saved source registry container could not be found on this machine.',
      'Start the registry first with `nb source registry start`.',
      `Details: ${message}`,
    ].join('\n');
  }

  return [
    'Couldn\'t show source registry logs.',
    'Check that Docker is installed and the source registry container still exists, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

export default class SourceRegistryLogs extends Command {
  static override description =
    'Show logs for the local Docker-based npm registry used for source tests.';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --tail 200',
    '<%= config.bin %> <%= command.id %> --follow',
  ];

  static override flags = {
    tail: Flags.integer({
      description: 'Number of recent log lines to show before following',
      default: 100,
      min: 0,
    }),
    follow: Flags.boolean({
      char: 'f',
      description: 'Keep streaming new log lines',
      default: false,
      allowNo: true,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(SourceRegistryLogs);
    const info = getSourceRegistryInfo();

    printInfo(
      flags.follow
        ? `Showing source registry logs from "${info.containerName}" (press Ctrl+C to stop).`
        : `Showing recent source registry logs from "${info.containerName}".`,
    );

    const dockerArgs = ['logs', '--tail', String(flags.tail ?? 100)];
    if (flags.follow) {
      dockerArgs.push('--follow');
    }
    dockerArgs.push(info.containerName);

    try {
      await run('docker', dockerArgs, {
        errorName: 'docker logs',
        stdio: 'inherit',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(formatLogsFailure(message));
    }
  }
}
