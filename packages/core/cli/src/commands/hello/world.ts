/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';

export default class World extends Command {
  static args = {};
  static description = 'Say hello world';
  static examples = [
    `<%= config.bin %> <%= command.id %>
hello world! (./src/commands/hello/world.ts)
`,
  ];
  static flags = {};

  async run(): Promise<void> {
    await this.parse();
    this.log('hello world! (./src/commands/hello/world.ts)');
  }
}
