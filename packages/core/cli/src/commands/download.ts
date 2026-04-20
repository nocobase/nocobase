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
import * as p from '@clack/prompts';
import path from 'node:path';
import { stdin as stdinStream, stdout as stdoutStream } from 'node:process';
import { run } from '../lib/run-npm.ts';

type DownloadSource = 'docker' | 'npm' | 'git';

/** Final download options after CLI parse, defaults, and interactive prompts. */
export type DownloadResolvedFlags = Record<string, unknown> & {
  source: string;
  version?: string;
  replace: boolean;
  'dev': boolean;
  'output-dir'?: string;
  'git-url'?: string;
  'docker-registry'?: string;
};

/** Return value of `nb download` (and `runCommand('download', …)`): resolved flags plus local project path when applicable. */
export type DownloadCommandResult = {
  resolved: DownloadResolvedFlags;
  /** Absolute path to the scaffolded/cloned project (npm/git only). */
  projectRoot?: string;
};

export default class Download extends Command {
  static override description =
    'Scaffold or fetch NocoBase: npm (create-nocobase-app), docker (image pull), or git (shallow clone).';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -y --source npm --version latest',
    '<%= config.bin %> <%= command.id %> --source npm --version latest',
    '<%= config.bin %> <%= command.id %> --source npm --version latest --output-dir=./app',
    '<%= config.bin %> <%= command.id %> --source docker --version latest --docker-registry=nocobase/nocobase',
    '<%= config.bin %> <%= command.id %> --source git --version latest --git-url=https://github.com/nocobase/nocobase.git',
  ];

  static override flags = {
    yes: Flags.boolean({
      char: 'y',
      description: 'Skip interactive prompts; use flags only (non-TTY implies -y)',
      default: false,
    }),
    source: Flags.string({
      char: 's',
      description:
        'Distribution: npm runs create-nocobase-app, docker runs docker pull, git clones the repository',
      options: ['docker', 'npm', 'git'],
      required: false,
    }),
    version: Flags.string({
      char: 'v',
      description:
        'npm: dist-tag or version for create-nocobase-app; docker: image tag; git: branch or tag (latest→main, beta→next, alpha→develop); default: latest',
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

  resolveOutputDir(flags: DownloadResolvedFlags): string {
    const explicit = flags['output-dir'];
    if (explicit) {
      return explicit;
    }
    const tag = flags.version || 'latest';
    const safe = tag.replace(/[/\\]/g, '-');
    return `./nocobase-${safe}`;
  }

  private defaultOutputDir(versionTag: string): string {
    const safe = versionTag.replace(/[/\\]/g, '-');
    return `./nocobase-${safe}`;
  }

  /**
   * When stdin/stdout are TTY and not `-y`, prompt for any missing download options.
   */
  private async resolveDownloadFlags(flags: {
    yes: boolean;
    source?: string;
    version?: string;
    replace: boolean;
    'dev': boolean;
    'output-dir'?: string;
    'git-url'?: string;
    'docker-registry'?: string;
  }): Promise<DownloadResolvedFlags> {
    const interactive = Boolean(stdinStream.isTTY && stdoutStream.isTTY && !flags.yes);

    let source = flags.source?.trim() as DownloadSource | '' | undefined;
    if (source === '') {
      source = undefined;
    }
    let version = flags.version?.trim() || undefined;
    let replace = flags.replace;
    let dev = flags['dev'];
    let outputDir = flags['output-dir']?.trim() || undefined;
    if (outputDir === '') {
      outputDir = undefined;
    }
    let gitUrl = flags['git-url']?.trim() || undefined;
    if (gitUrl === '') {
      gitUrl = undefined;
    }
    let dockerRegistry = flags['docker-registry']?.trim() || undefined;
    if (dockerRegistry === '') {
      dockerRegistry = undefined;
    }

    if (!interactive) {
      if (!source) {
        this.error(
          'Distribution is required (--source npm|git|docker). Use a terminal for interactive setup, or pass -s/--source.',
        );
      }
      const v = version || 'latest';
      return {
        source,
        version: v,
        replace,
        'dev': dev,
        'output-dir': outputDir,
        'git-url': gitUrl,
        'docker-registry': dockerRegistry,
      } as DownloadResolvedFlags;
    }

    p.intro('nb download');

    if (!source) {
      const src = await p.select<DownloadSource>({
        message: 'How do you want to get NocoBase?',
        options: [
          { value: 'npm', label: 'npm — create-nocobase-app' },
          { value: 'git', label: 'git — shallow clone' },
          { value: 'docker', label: 'docker — pull image' },
        ],
        initialValue: 'npm',
      });
      if (p.isCancel(src)) {
        p.cancel('Download cancelled.');
        this.exit(0);
      }
      source = src;
    }

    if (version === undefined) {
      const verAns = await p.text({
        message: 'Version / dist-tag / image tag / branch alias (-v)',
        placeholder: 'latest',
        initialValue: 'latest',
      });
      if (p.isCancel(verAns)) {
        p.cancel('Download cancelled.');
        this.exit(0);
      }
      version = (verAns as string).trim() || 'latest';
    }

    const versionResolved = version || 'latest';

    if (source === 'docker') {
      if (dockerRegistry === undefined) {
        const reg = await p.text({
          message: 'Docker image without tag (--docker-registry)',
          placeholder: 'nocobase/nocobase',
          initialValue: 'nocobase/nocobase',
        });
        if (p.isCancel(reg)) {
          p.cancel('Download cancelled.');
          this.exit(0);
        }
        dockerRegistry = (reg as string).trim() || 'nocobase/nocobase';
      }
    }

    if (source === 'git') {
      if (gitUrl === undefined) {
        const urlAns = await p.text({
          message: 'Git remote URL (--git-url)',
          placeholder: 'https://github.com/nocobase/nocobase.git',
          initialValue: 'https://github.com/nocobase/nocobase.git',
        });
        if (p.isCancel(urlAns)) {
          p.cancel('Download cancelled.');
          this.exit(0);
        }
        gitUrl = (urlAns as string).trim() || 'https://github.com/nocobase/nocobase.git';
      }
    }

    if (source === 'npm' || source === 'git') {
      if (outputDir === undefined) {
        const initialOut = this.defaultOutputDir(versionResolved);
        const outAns = await p.text({
          message: 'Output directory relative to cwd (-o)',
          placeholder: initialOut,
          initialValue: initialOut,
        });
        if (p.isCancel(outAns)) {
          p.cancel('Download cancelled.');
          this.exit(0);
        }
        outputDir = (outAns as string).trim() || initialOut;
      }

      const replaceAns = await p.confirm({
        message: 'Delete existing output directory if present, then retry? (--replace)',
        initialValue: replace,
      });
      if (p.isCancel(replaceAns)) {
        p.cancel('Download cancelled.');
        this.exit(0);
      }
      replace = replaceAns;
    }

    if (source === 'npm') {
      const devAns = await p.confirm({
        message: 'Install devDependencies and run a non-production yarn install? (--dev)',
        initialValue: dev,
      });
      if (p.isCancel(devAns)) {
        p.cancel('Download cancelled.');
        this.exit(0);
      }
      dev = devAns;
    }

    return {
      source,
      version: versionResolved,
      replace,
      'dev': dev,
      'output-dir': outputDir,
      'git-url': gitUrl,
      'docker-registry': dockerRegistry,
    } as DownloadResolvedFlags;
  }

  async downloadFromDocker(flags: DownloadResolvedFlags): Promise<void> {
    const image = flags['docker-registry'] ?? 'nocobase/nocobase';
    const tag = flags.version ?? 'latest';
    await run('docker', ['pull', `${image}:${tag}`]);
  }

  async downloadFromNpm(flags: DownloadResolvedFlags): Promise<string> {
    const versionSpec = flags.version || 'latest';
    const outputDir = this.resolveOutputDir(flags);
    const projectRoot = path.resolve(process.cwd(), outputDir);
    const npxArgs = ['-y', `create-nocobase-app@${versionSpec}`, outputDir];
    if (!flags['dev']) {
      npxArgs.push('--skip-dev-dependencies');
    }
    if (flags.replace) {
      await fsp.rm(projectRoot, { recursive: true, force: true });
    }
    await run('npx', npxArgs);
    const installArgs = ['install'];
    if (!flags['dev']) {
      installArgs.push('--production');
    }
    await run('yarn', installArgs, { cwd: projectRoot });
    return projectRoot;
  }

  async downloadFromGit(flags: DownloadResolvedFlags): Promise<string> {
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
    await run('git', gitArgs);
    const projectRoot = path.resolve(process.cwd(), outputDir);
    await run('yarn', ['install'], { cwd: projectRoot });
    return projectRoot;
  }

  /**
   * @returns Final resolved flags and, for npm/git, the absolute project directory.
   */
  async download(): Promise<DownloadCommandResult> {
    const { flags } = await this.parse(Download);
    const resolved = await this.resolveDownloadFlags(flags);

    switch (resolved.source) {
      case 'npm': {
        const projectRoot = await this.downloadFromNpm(resolved);
        return { resolved, projectRoot };
      }
      case 'docker': {
        await this.downloadFromDocker(resolved);
        return { resolved, projectRoot: undefined };
      }
      case 'git': {
        const projectRoot = await this.downloadFromGit(resolved);
        return { resolved, projectRoot };
      }
      default:
        this.error(`Invalid --source: ${resolved.source}`);
    }
  }

  public async run(): Promise<DownloadCommandResult> {
    try {
      return await this.download();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(message);
    }
  }
}
