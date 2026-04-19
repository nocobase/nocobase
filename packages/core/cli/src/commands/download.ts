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
  replace: boolean;
  'dev': boolean;
  'output-dir'?: string;
  'git-url'?: string;
  'docker-registry'?: string;
};

export default class Download extends Command {
  static override description =
    'Scaffold or fetch NocoBase: npm (create-nocobase-app), docker (image pull), or git (shallow clone).';

  static override examples = [
    '<%= config.bin %> <%= command.id %> --source npm --version latest',
    '<%= config.bin %> <%= command.id %> --source npm --version latest --output-dir=./app',
    '<%= config.bin %> <%= command.id %> --source docker --version latest --docker-registry=nocobase/nocobase',
    '<%= config.bin %> <%= command.id %> --source git --version latest --git-url=https://github.com/nocobase/nocobase.git',
  ];

  static override flags = {
    source: Flags.string({
      char: 's',
      description:
        'Distribution: npm runs create-nocobase-app, docker runs docker pull, git clones the repository',
      options: ['docker', 'npm', 'git'],
      required: true,
    }),
    version: Flags.string({
      char: 'v',
      default: 'latest',
      description:
        'npm: dist-tag or version for create-nocobase-app; docker: image tag; git: branch or tag (latest→main, beta→next, alpha→develop)',
    }),
    replace: Flags.boolean({
      char: 'r',
      description:
        'npm/git: delete the target project directory if it exists, then scaffold or clone again; docker: ignored',
      default: false,
    }),
    'dev': Flags.boolean({
      description:
        'npm: install devDependencies in create-nocobase-app and run a non-production yarn install; git/docker: ignored',
      default: false,
    }),
    'output-dir': Flags.string({
      char: 'o',
      description:
        'npm/git: output directory (relative to cwd); default ./nocobase-<version> using the same value as --version; docker: ignored',
    }),
    'git-url': Flags.string({
      description:
        'git: remote URL to clone (default: https://github.com/nocobase/nocobase.git)',
    }),
    'docker-registry': Flags.string({
      description:
        'docker: image reference without tag (default: nocobase/nocobase); use -v for the tag, e.g. ghcr.io/nocobase/nocobase',
    }),
  };

  resolveOutputDir(flags: DownloadFlags): string {
    const explicit = flags['output-dir'];
    if (explicit) {
      return explicit;
    }
    const tag = flags.version || 'latest';
    const safe = tag.replace(/[/\\]/g, '-');
    return `./nocobase-${safe}`;
  }

  async downloadFromDocker(flags: DownloadFlags): Promise<void> {
    const image = flags['docker-registry'] ?? 'nocobase/nocobase';
    const tag = flags.version ?? 'latest';
    await run('docker', ['pull', `${image}:${tag}`], process.cwd());
  }

  async downloadFromNpm(flags: DownloadFlags): Promise<void> {
    const versionSpec = flags.version || 'latest';
    const outputDir = this.resolveOutputDir(flags);
    const npxArgs = ['-y', `create-nocobase-app@${versionSpec}`, outputDir];
    if (!flags['dev']) {
      npxArgs.push('--skip-dev-dependencies');
    }
    if (flags.replace) {
      await fsp.rm(path.resolve(process.cwd(), outputDir), { recursive: true, force: true });
    }
    await run('npx', npxArgs, process.cwd());
    const installArgs = ['install'];
    if (!flags['dev']) {
      installArgs.push('--production');
    }
    await run('yarn', installArgs, path.resolve(process.cwd(), outputDir));
  }

  async downloadFromGit(flags: DownloadFlags): Promise<void> {
    const repoUrl = flags['git-url'] ?? 'https://github.com/nocobase/nocobase.git';
    const versionSpec = flags.version || 'latest';
    const outputDir = this.resolveOutputDir(flags);
    const versionToRef = {
      'latest': 'main',
      'beta': 'next',
      'alpha': 'develop',
    };
    if (flags.replace) {
      await fsp.rm(path.resolve(process.cwd(), outputDir), { recursive: true, force: true });
    }
    const branch = versionToRef[versionSpec] || versionSpec;
    const gitArgs = ['clone'];
    gitArgs.push('--branch', branch);
    gitArgs.push('--depth', '1', repoUrl, outputDir);
    await run('git', gitArgs, process.cwd());
    await run('yarn', ['install'], path.resolve(process.cwd(), outputDir));
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
        this.error(`Invalid --source: ${flags.source}`);
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
