/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { failTask, startTask, succeedTask } from '../../../lib/ui.js';
import { getSourceRegistryInfo, startSourceRegistry } from '../../../lib/source-registry.js';

function formatStartFailure(message: string): string {
  if (/port is already allocated|address already in use/i.test(message)) {
    return [
      'Can\'t start the source registry.',
      'Port 4873 is already in use on this machine.',
      'Stop the conflicting process, or free the port before trying again.',
      `Details: ${message}`,
    ].join('\n');
  }

  return [
    'Couldn\'t start the source registry.',
    'Check that Docker is installed and running, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

export default class SourceRegistryStart extends Command {
  static override description =
    'Start the local Docker-based npm registry used for source snapshot publish and install tests.';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --verbose',
  ];

  static override flags = {
    verbose: Flags.boolean({
      description: 'Show raw Docker output while starting the registry container',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(SourceRegistryStart);
    const info = getSourceRegistryInfo();

    startTask(`Starting the source registry at ${info.url}...`);
    try {
      const state = await startSourceRegistry({
        stdio: flags.verbose ? 'inherit' : 'ignore',
      });
      succeedTask(
        state === 'already-running'
          ? `The source registry is already running at ${info.url}.`
          : `The source registry is running at ${info.url}.`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      failTask('Failed to start the source registry.');
      this.error(formatStartFailure(message));
    }
  }
}
