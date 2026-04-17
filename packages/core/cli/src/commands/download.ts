/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core'
import { run } from '../lib/run-npm.ts';

export default class Download extends Command {
  static override args = {
    file: Args.string({ description: 'file to read' }),
  }
  static override description = 'describe the command here'
  static override examples = [
    '<%= config.bin %> <%= command.id %> --source=docker --version=latest --app-root-path=./app --env-file=.env',
    '<%= config.bin %> <%= command.id %> --source=npm --version=latest --app-root-path=./app --env-file=.env',
    '<%= config.bin %> <%= command.id %> --source=git --version=latest --app-root-path=./app --env-file=.env',
  ]
  static override flags = {
    source: Flags.string({ char: 's', description: 'source to download', options: ['docker', 'npm', 'git'] }),
    version: Flags.string({ char: 'v', description: 'version to download' }),
    // 'app-root-path': Flags.string({ description: 'app root path', required: true }),
  }

  async downloadFromNpm() {
    const npxArgs = ['-y', 'create-nocobase-app@beta', 'my-nocobase-app', '-d', 'postgres'];
    await run('npx', npxArgs, process.cwd());
  }

  async downloadFromDocker() {
    const dockerArgs = ['pull', 'nocobase/nocobase:latest'];
    await run('docker', dockerArgs, process.cwd());
  }

  async downloadFromGit() {
    const gitArgs = ['clone', 'https://github.com/nocobase/nocobase.git', '--branch', 'main', '--depth', '1', 'my-nocobase-app'];
    await run('git', gitArgs, process.cwd());
  }


  async download() {
    const { flags } = await this.parse(Download)
    switch (flags.source) {
      case 'npm':
        await this.downloadFromNpm();
        break;
      case 'docker':
        await this.downloadFromDocker();
        break;
      case 'git':
        await this.downloadFromGit();
        break;
      default:
        this.error(`Invalid source: ${flags.source}`);
    }
  }

  public async run(): Promise<void> {
    try {
      await this.download();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(message);
    }
  }
}

/*
--source
--version
--force-overwrite
--skip-dev-dependencies
--env-file
--app-root-path
--db-dialect
--db-host
--db-port
--db-database
--db-user
--db-password
--timezone

--git-url

--docker-registry
*/
