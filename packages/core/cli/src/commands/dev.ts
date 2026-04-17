/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core'
import { runNocoBaseCommand, runNpm } from '../lib/run-npm.ts'

export default class Dev extends Command {
  static override args = {
    file: Args.string({ description: 'file to read' }),
  }
  static override description = 'describe the command here'
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --db-sync',
    '<%= config.bin %> <%= command.id %> --port 12000',
    '<%= config.bin %> <%= command.id %> --client',
    '<%= config.bin %> <%= command.id %> --server',
    '<%= config.bin %> <%= command.id %> --inspect 9229',
  ]
  static override flags = {
    env: Flags.string({ description: 'Environment', char: 'e', required: false }),
    'db-sync': Flags.boolean({ description: 'Sync the database', required: false }),
    port: Flags.string({ description: 'Port', char: 'p', required: false }),
    client: Flags.boolean({ description: 'Client', char: 'c', required: false }),
    server: Flags.boolean({ description: 'Server', char: 's', required: false }),
    inspect: Flags.string({ description: 'Inspect port', char: 'i', required: false }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Dev)
    const npmArgs = ['dev', '--rsbuild'];
    if (flags['db-sync']) {
      npmArgs.push('--db-sync');
    }
    if (flags.port) {
      npmArgs.push('--port', flags.port);
    }
    if (flags.client) {
      npmArgs.push('--client');
    }
    if (flags.server) {
      npmArgs.push('--server');
    }
    if (flags.inspect) {
      npmArgs.push('--inspect', flags.inspect);
    }
    try {
      await runNocoBaseCommand(npmArgs, process.cwd());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(message);
    }
  }
}
