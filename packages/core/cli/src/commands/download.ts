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

/** Allowed `--docker-platform` values (passed to `docker pull --platform`). */
const DOCKER_PLATFORMS = ['linux/amd64', 'linux/arm64'] as const;
export type DockerPlatform = (typeof DOCKER_PLATFORMS)[number];

function isDockerPlatform(value: string): value is DockerPlatform {
  return (DOCKER_PLATFORMS as readonly string[]).includes(value);
}

/**
 * Detect explicit `--build` / `--no-build` on `nb download` so interactive prompts
 * use them as the confirm initial value when set before prompts run.
 */
function explicitBuildFromArgv(argv: string[]): boolean | undefined {
  const hasNoBuild = argv.includes('--no-build');
  const hasBuild = argv.includes('--build');
  if (hasNoBuild && hasBuild) {
    return undefined;
  }
  if (hasNoBuild) {
    return false;
  }
  if (hasBuild) {
    return true;
  }
  return undefined;
}

/**
 * Explicit `--build-dts` / `--no-build-dts` before interactive prompts.
 * `true` = emit `.d.ts` (do not pass `--no-dts` to `nb build`).
 */
function explicitBuildDtsFromArgv(argv: string[]): boolean | undefined {
  const hasNoBuildDts = argv.includes('--no-build-dts');
  const hasBuildDts = argv.includes('--build-dts');
  if (hasNoBuildDts && hasBuildDts) {
    return undefined;
  }
  if (hasNoBuildDts) {
    return false;
  }
  if (hasBuildDts) {
    return true;
  }
  return undefined;
}

/** Explicit `--docker-save` / `--no-docker-save` for interactive defaults (docker only). */
function explicitDockerSaveFromArgv(argv: string[]): boolean | undefined {
  const hasNo = argv.includes('--no-docker-save');
  const hasYes = argv.includes('--docker-save');
  if (hasNo && hasYes) {
    return undefined;
  }
  if (hasNo) {
    return false;
  }
  if (hasYes) {
    return true;
  }
  return undefined;
}

/** Explicit `--dev-dependencies` / `--no-dev-dependencies` / `-D` (npm only) for interactive defaults. */
function explicitDevDependenciesFromArgv(argv: string[]): boolean | undefined {
  const hasNo = argv.includes('--no-dev-dependencies');
  const hasYes = argv.includes('--dev-dependencies') || argv.includes('-D');
  if (hasNo && hasYes) {
    return undefined;
  }
  if (hasNo) {
    return false;
  }
  if (hasYes) {
    return true;
  }
  return undefined;
}

/** `build-dts` only applies when `build` is true and source is npm/git. */
function normalizeBuildDts(source: DownloadSource, build: boolean, wantDts: boolean): boolean {
  if (source !== 'npm' && source !== 'git') {
    return false;
  }
  return Boolean(build && wantDts);
}

/** Final download options after CLI parse, defaults, and interactive prompts. */
export type DownloadResolvedFlags = Record<string, unknown> & {
  source: string;
  version?: string;
  replace: boolean;
  /** npm only; install devDependencies and non-production `yarn install`; git/docker omit this key */
  'dev-dependencies'?: boolean;
  /** npm/git: run `nb build` after install; docker: ignored */
  'build': boolean;
  /** npm/git: emit `.d.ts` during `nb build` when true; when false, `nb build` uses `--no-dts`. Only if `build`; docker: ignored */
  'build-dts': boolean;
  'output-dir'?: string;
  'git-url'?: string;
  'docker-registry'?: string;
  /** docker only: `docker pull --platform` (`linux/amd64` or `linux/arm64`); npm/git omit this key */
  'docker-platform'?: DockerPlatform;
  /** docker only: after `docker pull`, run `docker save` into `--output-dir`; npm/git omit this key */
  'docker-save'?: boolean;
  /** npm/git: optional; omit or empty string means use npm/yarn default registry */
  'npm-registry'?: string;
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
    '<%= config.bin %> <%= command.id %> -y --source npm --version latest --no-build',
    '<%= config.bin %> <%= command.id %> --source npm --version latest',
    '<%= config.bin %> <%= command.id %> --source npm --version latest --output-dir=./app',
    '<%= config.bin %> <%= command.id %> --source docker --version latest --docker-registry=nocobase/nocobase',
    '<%= config.bin %> <%= command.id %> -y --source docker -v latest --docker-platform=linux/amd64',
    '<%= config.bin %> <%= command.id %> -y --source docker -v latest --docker-save -o ./docker-images',
    '<%= config.bin %> <%= command.id %> --source git --version alpha --git-url=git@github.com:nocobase/nocobase.git',
    '<%= config.bin %> <%= command.id %> -y --source git --version latest --no-build',
    '<%= config.bin %> <%= command.id %> -y --source npm --version latest --build-dts',
    '<%= config.bin %> <%= command.id %> -y --source npm --version latest --npm-registry=https://registry.npmmirror.com',
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
    'dev-dependencies': Flags.boolean({
      char: 'D',
      allowNo: true,
      description:
        'npm only: install devDependencies in create-nocobase-app and run a non-production `yarn install`; git/docker ignore this flag',
      default: false,
    }),
    'output-dir': Flags.string({
      char: 'o',
      description:
        'npm/git: project directory (relative to cwd); default ./nocobase-<version> from --version. docker: with `--docker-save`, directory for the saved `.tar` (same default when omitted)',
    }),
    'git-url': Flags.string({
      description:
        'git: remote URL to clone (default: https://github.com/nocobase/nocobase.git)',
    }),
    'docker-registry': Flags.string({
      description:
        'docker: image reference without tag (default: nocobase/nocobase); use -v for the tag, e.g. ghcr.io/nocobase/nocobase',
    }),
    'docker-platform': Flags.string({
      description:
        'docker: `docker pull --platform` — linux/amd64 or linux/arm64 only; omit for the host default. npm/git ignored.',
      options: [...DOCKER_PLATFORMS],
    }),
    'docker-save': Flags.boolean({
      allowNo: true,
      description:
        'docker only: after pull, run `docker save` and write a `.tar` under `--output-dir` (default ./nocobase-<version>). npm/git ignored.',
      default: false,
    }),
    'npm-registry': Flags.string({
      description:
        'npm/git: optional npm registry URL (`npm_config_registry` for npx/yarn). Omit or pass empty to use defaults. Docker: ignored.',
    }),
    'build': Flags.boolean({
      allowNo: true,
      description:
        'npm/git: run `nb build` after `yarn install` (same as `nb build --cwd <dir>`); docker: ignored. Default on; use `--no-build` to skip. npm: ignored when `--no-dev-dependencies` (production install cannot run the build).',
      default: true,
    }),
    'build-dts': Flags.boolean({
      description:
        'npm/git: when running `nb build`, emit TypeScript declaration files (omit `nb build --no-dts`). Default off (faster); use `--build-dts` to emit `.d.ts`. Only with `--build` (ignored with `--no-build`). Interactive: asked only if you enable build. Docker: ignored.',
      default: false,
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
    'dev-dependencies': boolean;
    'build': boolean;
    'build-dts': boolean;
    'output-dir'?: string;
    'git-url'?: string;
    'docker-registry'?: string;
    'docker-platform'?: string;
    'docker-save'?: boolean;
    'npm-registry'?: string;
  }): Promise<DownloadResolvedFlags> {
    const interactive = Boolean(stdinStream.isTTY && stdoutStream.isTTY && !flags.yes);

    let source = flags.source?.trim() as DownloadSource | '' | undefined;
    if (source === '') {
      source = undefined;
    }
    let version = flags.version?.trim() || undefined;
    let replace = flags.replace;
    let devDependencies = flags['dev-dependencies'];
    let build = flags['build'];
    let buildDts = flags['build-dts'];
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
    const dockerPlatformRaw = flags['docker-platform'];
    let dockerPlatform: DockerPlatform | undefined;
    if (typeof dockerPlatformRaw === 'string') {
      const t = dockerPlatformRaw.trim();
      if (t) {
        if (!isDockerPlatform(t)) {
          this.error(
            `--docker-platform must be ${DOCKER_PLATFORMS.join(' or ')} (or omit for the default platform).`,
          );
        }
        dockerPlatform = t;
      }
    }
    const npmRegistryRaw = flags['npm-registry'];
    let npmRegistry =
      typeof npmRegistryRaw === 'string' ? (npmRegistryRaw.trim() || undefined) : undefined;
    let dockerSave = flags['docker-save'] ?? false;

    if (!interactive) {
      if (!source) {
        this.error(
          'Distribution is required (--source npm|git|docker). Use a terminal for interactive setup, or pass -s/--source.',
        );
      }
      if (dockerSave && source !== 'docker') {
        this.error('--docker-save can only be used with --source docker.');
      }
      const v = version || 'latest';
      const effectiveBuild = source === 'npm' && !devDependencies ? false : build;
      return {
        source,
        version: v,
        replace,
        ...(source === 'npm' ? { 'dev-dependencies': devDependencies } : {}),
        'build': effectiveBuild,
        'build-dts': normalizeBuildDts(source as DownloadSource, effectiveBuild, flags['build-dts']),
        'output-dir': outputDir,
        'git-url': gitUrl,
        'docker-registry': dockerRegistry,
        ...(source === 'docker' && dockerPlatform ? { 'docker-platform': dockerPlatform } : {}),
        ...(source === 'docker' ? { 'docker-save': dockerSave } : {}),
        ...(npmRegistry ? { 'npm-registry': npmRegistry } : {}),
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
      if (dockerPlatform === undefined) {
        const platAns = await p.select({
          message: 'Docker platform for `docker pull --platform` (--docker-platform)',
          options: [
            { value: '', label: 'Default (host platform)' },
            { value: 'linux/amd64', label: 'linux/amd64' },
            { value: 'linux/arm64', label: 'linux/arm64' },
          ],
          initialValue: '',
        });
        if (p.isCancel(platAns)) {
          p.cancel('Download cancelled.');
          this.exit(0);
        }
        const pStr = typeof platAns === 'string' ? platAns : '';
        dockerPlatform = pStr && isDockerPlatform(pStr) ? pStr : undefined;
      }
      const explicitSave = explicitDockerSaveFromArgv(process.argv.slice(2));
      const saveAns = await p.confirm({
        message:
          'After pull, save the image as a tarball under `--output-dir`? (--docker-save / --no-docker-save)',
        initialValue: explicitSave !== undefined ? explicitSave : dockerSave,
      });
      if (p.isCancel(saveAns)) {
        p.cancel('Download cancelled.');
        this.exit(0);
      }
      dockerSave = saveAns;
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

    if (source === 'npm' || source === 'git' || (source === 'docker' && dockerSave)) {
      if (outputDir === undefined) {
        const initialOut = this.defaultOutputDir(versionResolved);
        const outAns = await p.text({
          message:
            source === 'docker'
              ? 'Directory for the saved image tarball, relative to cwd (-o)'
              : 'Output directory relative to cwd (-o)',
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

    if (source === 'npm' || source === 'git') {
      const regAns = await p.text({
        message:
          'npm registry URL for npx / yarn (`npm_config_registry`; optional — leave empty for defaults) (--npm-registry)',
        placeholder: '(empty = default registry)',
        initialValue: npmRegistry ?? '',
      });
      if (p.isCancel(regAns)) {
        p.cancel('Download cancelled.');
        this.exit(0);
      }
      npmRegistry = String(regAns ?? '').trim() || undefined;
    }

    if (source === 'npm') {
      const argvSlice = process.argv.slice(2);
      const explicitDev = explicitDevDependenciesFromArgv(argvSlice);
      const devAns = await p.confirm({
        message:
          'Install devDependencies and run a non-production yarn install? (npm only; -D / --dev-dependencies / --no-dev-dependencies)',
        initialValue: explicitDev !== undefined ? explicitDev : devDependencies,
      });
      if (p.isCancel(devAns)) {
        p.cancel('Download cancelled.');
        this.exit(0);
      }
      devDependencies = devAns;
    }

    if (source === 'npm' || source === 'git') {
      if (source === 'npm' && !devDependencies) {
        build = false;
        buildDts = false;
      } else {
        const explicitBuild = explicitBuildFromArgv(process.argv.slice(2));
        const buildAns = await p.confirm({
          message: 'Run `nb build` after install? (--build / --no-build)',
          initialValue: explicitBuild !== undefined ? explicitBuild : true,
        });
        if (p.isCancel(buildAns)) {
          p.cancel('Download cancelled.');
          this.exit(0);
        }
        build = buildAns;

        if (build) {
          const explicitDts = explicitBuildDtsFromArgv(process.argv.slice(2));
          const dtsAns = await p.confirm({
            message: 'Emit TypeScript declaration files during `nb build`? (--build-dts / --no-build-dts)',
            initialValue: explicitDts !== undefined ? explicitDts : buildDts,
          });
          if (p.isCancel(dtsAns)) {
            p.cancel('Download cancelled.');
            this.exit(0);
          }
          buildDts = dtsAns;
        } else {
          buildDts = false;
        }
      }
    }

    return {
      source,
      version: versionResolved,
      replace,
      ...(source === 'npm' ? { 'dev-dependencies': devDependencies } : {}),
      'build': build,
      'build-dts': normalizeBuildDts(source, build, buildDts),
      'output-dir': outputDir,
      'git-url': gitUrl,
      'docker-registry': dockerRegistry,
      ...(source === 'docker' && dockerPlatform ? { 'docker-platform': dockerPlatform } : {}),
      ...(source === 'docker' ? { 'docker-save': dockerSave } : {}),
      ...(npmRegistry ? { 'npm-registry': npmRegistry } : {}),
    } as DownloadResolvedFlags;
  }

  private npmRegistryUrl(flags: DownloadResolvedFlags): string | undefined {
    const url = flags['npm-registry']?.trim();
    return url || undefined;
  }

  /** Env for `npx` and `yarn` — both respect `npm_config_registry`. */
  private npmRegistryEnv(flags: DownloadResolvedFlags): Record<string, string> | undefined {
    const url = this.npmRegistryUrl(flags);
    if (!url) {
      return undefined;
    }
    return { npm_config_registry: url };
  }

  private runOptionsWithCwd(cwd: string, registryEnv: Record<string, string> | undefined) {
    if (registryEnv) {
      return { cwd, env: registryEnv };
    }
    return { cwd };
  }

  /** Args for `nb build` after download (cwd + `--no-dts` unless emitting `.d.ts`). */
  private buildCommandArgv(projectRoot: string, flags: DownloadResolvedFlags): string[] {
    const argv = ['--cwd', projectRoot];
    if (!flags['build-dts']) {
      argv.push('--no-dts');
    }
    return argv;
  }

  async downloadFromDocker(flags: DownloadResolvedFlags): Promise<void> {
    const image = flags['docker-registry'] ?? 'nocobase/nocobase';
    const tag = flags.version ?? 'latest';
    const imageRef = `${image}:${tag}`;
    const platform = flags['docker-platform'];
    const pullArgs = ['pull'];
    if (platform) {
      pullArgs.push('--platform', platform);
    }
    pullArgs.push(imageRef);
    await run('docker', pullArgs);

    if (!flags['docker-save']) {
      return;
    }

    const outputDir = this.resolveOutputDir(flags);
    const outAbs = path.resolve(process.cwd(), outputDir);
    if (flags.replace) {
      await fsp.rm(outAbs, { recursive: true, force: true });
    }
    await fsp.mkdir(outAbs, { recursive: true });
    const safeBase = `${image.replace(/[/:]/g, '-')}-${tag.replace(/[/\\]/g, '-')}`;
    const tarPath = path.join(outAbs, `${safeBase}.tar`);
    this.log(`Saving ${imageRef} to ${tarPath}`);
    await run('docker', ['save', '-o', tarPath, imageRef]);
  }

  async downloadFromNpm(flags: DownloadResolvedFlags): Promise<string> {
    const versionSpec = flags.version || 'latest';
    const outputDir = this.resolveOutputDir(flags);
    const projectRoot = path.resolve(process.cwd(), outputDir);
    /** create-nocobase-app scaffolds at `join(cwd, name)`; run npx with `cwd = parentDir` so nested `output-dir` is correct */
    const parentDir = path.dirname(projectRoot);
    const appName = path.basename(projectRoot);
    const npxArgs = ['-y', `create-nocobase-app@${versionSpec}`, appName];
    if (!flags['dev-dependencies']) {
      npxArgs.push('--skip-dev-dependencies');
    }
    if (flags.replace) {
      await fsp.rm(projectRoot, { recursive: true, force: true });
    }
    await fsp.mkdir(parentDir, { recursive: true });
    const registryEnv = this.npmRegistryEnv(flags);
    this.log(`Running npx create-nocobase-app@${versionSpec} (app: ${appName}, cwd: ${parentDir})`);
    await run('npx', npxArgs, { ...this.runOptionsWithCwd(parentDir, registryEnv) });
    const installArgs = ['install'];
    if (!flags['dev-dependencies']) {
      installArgs.push('--production');
    }
    await run('yarn', installArgs, this.runOptionsWithCwd(projectRoot, registryEnv));
    if (flags.build && flags['dev-dependencies']) {
      await this.config.runCommand('build', this.buildCommandArgv(projectRoot, flags));
    }
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
    const registryEnv = this.npmRegistryEnv(flags);
    await run('yarn', ['install'], this.runOptionsWithCwd(projectRoot, registryEnv));
    if (flags.build) {
      await this.config.runCommand('build', this.buildCommandArgv(projectRoot, flags));
    }
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
