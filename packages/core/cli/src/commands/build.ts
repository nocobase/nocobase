/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';

export default class Build extends Command {
  static override args = {
    file: Args.string({ description: 'file to read' }),
  };
  static override description = 'describe the command here';
  static override examples = ['<%= config.bin %> <%= command.id %>'];
  static override flags = {
    // flag with no value (-f, --force)
    force: Flags.boolean({ char: 'f' }),
    // flag with a value (-n, --name=VALUE)
    name: Flags.string({ char: 'n', description: 'name to print' }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Build);

    const name = flags.name ?? 'world';
    this.log(`hello ${name} from cli/src/commands/build.ts`);
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`);
    }
  }
}
