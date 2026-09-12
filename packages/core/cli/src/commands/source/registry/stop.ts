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
import { stopSourceRegistry } from '../../../lib/source-registry.js';

function formatStopFailure(message: string): string {
  return [
    'Couldn\'t stop the source registry.',
    'Check that Docker is installed and the saved registry container still exists, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

export default class SourceRegistryStop extends Command {
  static override description =
    'Stop the local Docker-based npm registry used for source snapshot tests.';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --verbose',
  ];

  static override flags = {
    verbose: Flags.boolean({
      description: 'Show raw Docker output while stopping the registry container',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(SourceRegistryStop);

    startTask('Stopping the source registry...');
    try {
      const state = await stopSourceRegistry({
        stdio: flags.verbose ? 'inherit' : 'ignore',
      });
      succeedTask(
        state === 'already-stopped'
          ? 'The source registry is already stopped.'
          : 'The source registry has stopped.',
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      failTask('Failed to stop the source registry.');
      this.error(formatStopFailure(message));
    }
  }
}
