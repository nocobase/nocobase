/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';

export default class Hello extends Command {
  static args = {
    person: Args.string({ description: 'Person to say hello to', required: true }),
  };
  static description = 'Say hello';
  static examples = [
    `<%= config.bin %> <%= command.id %> friend --from oclif
hello friend from oclif! (./src/commands/hello/index.ts)
`,
  ];
  static flags = {
    from: Flags.string({ char: 'f', description: 'Who is saying hello', required: true }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Hello);

    this.log(`hello ${args.person} from ${flags.from}! (./src/commands/hello/index.ts)`);
  }
}
