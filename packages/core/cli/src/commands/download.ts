/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import { Command, Flags } from '@oclif/core';
import path from 'node:path';
import { run } from '../lib/run-npm.ts';

type DownloadFlags = Record<string, unknown> & {
  source: string;
  version?: string;
  'force-overwrite': boolean;
  'dev': boolean;
  'env-file'?: string;
  'app-root-path'?: string;
  'git-url'?: string;
  'docker-registry'?: string;
};

export default class Download extends Command {
  static override description =
    'Download a NocoBase app from npm (create-nocobase-app), Docker Hub, or git.';

  static override examples = [
    '<%= config.bin %> <%= command.id %> -s npm -v latest --app-root-path=./app --env-file=.env',
    '<%= config.bin %> <%= command.id %> -s docker -v latest --docker-registry=nocobase/nocobase',
    '<%= config.bin %> <%= command.id %> -s git -v main --git-url=https://github.com/nocobase/nocobase.git --app-root-path=./my-nocobase-app',
  ];

  static override flags = {
    source: Flags.string({
      char: 's',
      description: 'Where to download from',
      options: ['docker', 'npm', 'git'],
      required: true,
    }),
    version: Flags.string({
      char: 'v',
      default: 'latest',
      description: 'Version or tag: npm package dist-tag/version, Docker image tag, or git branch/tag',
    }),
    'force-overwrite': Flags.boolean({
      char: 'f',
      description: 'Pass --force to create-nocobase-app (npm) or overwrite when supported',
      default: false,
    }),
    'dev': Flags.boolean({
      description: 'Include dev dependencies in the app directory',
      default: false,
    }),
    'env-file': Flags.string({
      description: 'Dotenv file whose variables are passed to create-nocobase-app as -e KEY=value (npm only)',
    }),
    'app-root-path': Flags.string({
      description: 'Project directory name or path for the new app (default: my-nocobase-app)',
      default: 'my-nocobase-app',
    }),
    'db-password': Flags.string({ description: 'DB password (npm: DB_PASSWORD)' }),
    'git-url': Flags.string({
      description: 'Git remote URL to clone (git source)',
    }),
    'docker-registry': Flags.string({
      description:
        'Docker image repository without tag (default: nocobase/nocobase). Example: ghcr.io/nocobase/nocobase',
    }),
  };

  async downloadFromDocker(flags: DownloadFlags): Promise<void> {
    const image = flags['docker-registry'] ?? 'nocobase/nocobase';
    const tag = flags.version ?? 'latest';
    await run('docker', ['pull', `${image}:${tag}`], process.cwd());
  }

  async downloadFromNpm(flags: DownloadFlags): Promise<void> {
    const appRoot = flags['app-root-path'] ?? 'my-nocobase-app';
    const versionSpec = flags.version || 'latest';
    const npxArgs = ['-y', `create-nocobase-app@${versionSpec}`, appRoot];
    if (!flags['--dev']) {
      npxArgs.push('--skip-dev-dependencies');
    }
    if (flags['force-overwrite']) {
      await fsp.rm(path.resolve(process.cwd(), appRoot), { recursive: true, force: true });
    }
    await run('npx', npxArgs, process.cwd());
    const installArgs = ['install'];
    if (!flags['--dev']) {
      installArgs.push('--production');
    }
    await run('yarn', installArgs, path.resolve(process.cwd(), appRoot));
  }

  async downloadFromGit(flags: DownloadFlags): Promise<void> {
    const repoUrl = flags['git-url'] ?? 'https://github.com/nocobase/nocobase.git';
    const appRoot = flags['app-root-path'] ?? 'my-nocobase-app';
    const versionToRef = {
      'latest': 'main',
      'beta': 'next',
      'alpha': 'develop',
    };
    if (flags['force-overwrite']) {
      await fsp.rm(path.resolve(process.cwd(), appRoot), { recursive: true, force: true });
    }
    const branch = versionToRef[flags.version || 'latest'] || flags.version || 'latest';
    const gitArgs = ['clone'];
    gitArgs.push('--branch', branch);
    gitArgs.push('--depth', '1', repoUrl, appRoot);
    await run('git', gitArgs, process.cwd());
    await run('yarn', ['install'], path.resolve(process.cwd(), appRoot));
  }

  async download(): Promise<void> {
    const { flags } = await this.parse(Download);

    switch (flags.source) {
      case 'npm':
        await this.downloadFromNpm(flags);
        break;
      case 'docker':
        await this.downloadFromDocker(flags);
        break;
      case 'git':
        await this.downloadFromGit(flags);
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
