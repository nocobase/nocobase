/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {Args, Command, Flags} from '@oclif/core'

export default class PmList extends Command {
  static override args = {}
  static override summary = 'List all plugins';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {}

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PmList);
    await this.config.runCommand('api:pm:list', ['--mode=summary']);
  }
}
