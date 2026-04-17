/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {Args, Command, Flags} from '@oclif/core'

export default class Download extends Command {
  static override args = {
    file: Args.string({description: 'file to read'}),
  }
  static override description = 'describe the command here'
  static override examples = [
    '<%= config.bin %> <%= command.id % --source=docker --version=latest',
    '<%= config.bin %> <%= command.id % --source=npm --version=latest',
    '<%= config.bin %> <%= command.id % --source=git --version=latest',
  ]
  static override flags = {
    source: Flags.string({char: 's', description: 'source to download', options: ['docker', 'npm', 'git']}),
    version: Flags.string({char: 'v', description: 'version to download'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Download)

    const source = flags.source ?? 'docker'
    const version = flags.version ?? 'latest'
    this.log(`download ${source} ${version}`)
  }
}
