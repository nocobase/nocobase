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
import {
  type PromptInitialValues,
  type PromptsCatalog,
  type PromptValue,
  runPromptCatalog,
} from '../lib/prompt-catalog.ts';
import { run } from '../lib/run-npm.ts';

type DownloadSource = 'docker' | 'npm' | 'git';

/** Allowed `--docker-platform` values (passed to `docker pull --platform`). */
const DOCKER_PLATFORMS = ['linux/amd64', 'linux/arm64'] as const;
export type DockerPlatform = (typeof DOCKER_PLATFORMS)[number];

function isDockerPlatform(value: string): value is DockerPlatform {
  return (DOCKER_PLATFORMS as readonly string[]).includes(value);
}

function defaultOutputDirForVersion(versionTag: string): string {
  const safe = versionTag.replace(/[/\\]/g, '-');
  return `./nocobase-${safe}`;
}

function argvHasToken(argv: string[], tokens: string[]): boolean {
  return tokens.some((t) => argv.includes(t));
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

export type DownloadParsedFlags = {
  yes: boolean;
  source?: string;
  version?: string;
  replace: boolean;
  'dev-dependencies': boolean;
  build: boolean;
  'build-dts': boolean;
  'output-dir'?: string;
  'git-url'?: string;
  'docker-registry'?: string;
  'docker-platform'?: string;
  'docker-save': boolean;
  'npm-registry'?: string;
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
      description:
        'Accept defaults only (no prompts); same as non-TTY. Uses `runPromptCatalog` with merged `initialValues` / per-block defaults.',
      default: false,
    }),
    source: Flags.string({
      char: 's',
      description:
        'Merged into `initialValues.source` / preset `values` when set (skips the source prompt). npm | docker | git.',
      options: ['docker', 'npm', 'git'],
      required: false,
    }),
    version: Flags.string({
      char: 'v',
      description:
        'Merged into `initialValues.version` / preset when set. npm: dist-tag or version; docker: image tag; git: branch or tag (latest→main, beta→next, alpha→develop).',
    }),
    replace: Flags.boolean({
      char: 'r',
      description:
        'Merged into `initialValues.replace`. npm/git: delete the target directory if present, then retry; docker: when saving a tarball.',
      default: false,
    }),
    'dev-dependencies': Flags.boolean({
      char: 'D',
      allowNo: true,
      description:
        'Merged into `initialValues.devDependencies` (npm only). Install devDependencies and non-production `yarn install`.',
      default: false,
    }),
    'output-dir': Flags.string({
      char: 'o',
      description:
        'Merged into `initialValues.outputDir` / preset when set. npm/git: project dir; docker: tarball dir with `--docker-save`.',
    }),
    'git-url': Flags.string({
      description: 'Merged into `initialValues.gitUrl` / preset when set (git only).',
    }),
    'docker-registry': Flags.string({
      description: 'Merged into `initialValues.dockerRegistry` / preset when set (docker only). Image without tag; use `-v` for tag.',
    }),
    'docker-platform': Flags.string({
      description:
        'Merged into `initialValues.dockerPlatform` / preset when set (docker only). `docker pull --platform`.',
      options: [...DOCKER_PLATFORMS],
    }),
    'docker-save': Flags.boolean({
      allowNo: true,
      description:
        'Merged into `initialValues.dockerSave` (docker only). After pull, `docker save` a `.tar` under `--output-dir`.',
      default: false,
    }),
    'npm-registry': Flags.string({
      description:
        'Merged into `initialValues.npmRegistry` (npm/git). Optional `npm_config_registry`; empty uses defaults.',
    }),
    'build': Flags.boolean({
      allowNo: true,
      description:
        'Merged into `initialValues.build` (npm/git). Run `nb build` after install. Ignored for npm when `--no-dev-dependencies`.',
      default: true,
    }),
    'build-dts': Flags.boolean({
      description:
        'Merged into `initialValues.buildDts` when that prompt runs (npm/git, after build). Emit `.d.ts` during `nb build`.',
      default: false,
    }),
  };

  static prompts: PromptsCatalog = {
    intro: {
      type: 'intro',
      title: 'nb download',
    },
    source: {
      type: 'select',
      message: 'How do you want to get NocoBase?',
      options: [
        { value: 'npm', label: 'npm — create-nocobase-app' },
        { value: 'git', label: 'git — shallow clone' },
        { value: 'docker', label: 'docker — pull image' },
      ],
      initialValue: 'npm',
      required: true,
    },
    version: {
      type: 'text',
      message: 'Version / dist-tag / image tag / branch alias (-v)',
      placeholder: 'latest',
      initialValue: 'latest',
      yesInitialValue: 'latest',
      required: true,
    },
    dockerRegistry: {
      type: 'text',
      message: 'Docker image without tag (--docker-registry)',
      placeholder: 'nocobase/nocobase',
      initialValue: 'nocobase/nocobase',
      yesInitialValue: 'nocobase/nocobase',
      required: true,
      hidden: (values) => values.source !== 'docker',
    },
    dockerPlatform: {
      type: 'select',
      message: 'Docker platform for `docker pull --platform` (--docker-platform)',
      options: [
        { value: '', label: 'Default (host platform)' },
        { value: 'linux/amd64', label: 'linux/amd64' },
        { value: 'linux/arm64', label: 'linux/arm64' },
      ],
      yesInitialValue: '',
      initialValue: '',
      required: true,
      hidden: (values) => values.source !== 'docker',
    },
    dockerSave: {
      type: 'boolean',
      message:
        'After pull, save the image as a tarball under `--output-dir`? (--docker-save / --no-docker-save)',
      initialValue: false,
      hidden: (values) => values.source !== 'docker',
    },
    gitUrl: {
      type: 'text',
      message: 'Git remote URL (--git-url)',
      placeholder: 'https://github.com/nocobase/nocobase.git',
      initialValue: 'https://github.com/nocobase/nocobase.git',
      yesInitialValue: 'https://github.com/nocobase/nocobase.git',
      required: true,
      hidden: (values) => values.source !== 'git',
    },
    outputDir: {
      type: 'text',
      message:
        'Directory relative to cwd (-o) (for Docker: where to save the `.tar` when saving the image)',
      placeholder: 'e.g. ./nocobase-latest',
      initialValue: (values) =>
        defaultOutputDirForVersion(String(values.version ?? 'latest').trim() || 'latest'),
      required: true,
      hidden: (values) => {
        const s = values.source;
        if (s === 'npm' || s === 'git') {
          return false;
        }
        if (s === 'docker') {
          return !values.dockerSave;
        }
        return true;
      },
    },
    replace: {
      type: 'boolean',
      message: 'Delete existing output directory if present, then retry? (--replace)',
      initialValue: false,
      hidden: (values) => Download.hideOutputDirAndReplaceSteps(values),
    },
    npmRegistry: {
      type: 'text',
      message:
        'npm registry URL for npx / yarn (`npm_config_registry`; optional — leave empty for defaults) (--npm-registry)',
      placeholder: '(empty = default registry)',
      initialValue: '',
      hidden: (values) => values.source !== 'npm' && values.source !== 'git',
    },
    devDependencies: {
      type: 'boolean',
      message:
        'Install devDependencies and run a non-production yarn install? (npm only; -D / --dev-dependencies / --no-dev-dependencies)',
      initialValue: false,
      hidden: (values) => values.source !== 'npm',
    },
    build: {
      type: 'boolean',
      message: 'Run `nb build` after install? (--build / --no-build)',
      initialValue: true,
      hidden: (values) =>
        (values.source !== 'npm' && values.source !== 'git') ||
        (values.source === 'npm' && !values.devDependencies),
    },
    buildDts: {
      type: 'boolean',
      message: 'Emit TypeScript declaration files during `nb build`? (--build-dts / --no-build-dts)',
      initialValue: false,
      hidden: (values) =>
        (values.source !== 'npm' && values.source !== 'git') ||
        (values.source === 'npm' && !values.devDependencies) ||
        !values.build,
    },
  };

  /** When true, `outputDir` / `replace` prompts are skipped (same condition for both). */
  private static hideOutputDirAndReplaceSteps(values: Record<string, unknown>): boolean {
    const s = values.source;
    if (s === 'npm' || s === 'git') {
      return false;
    }
    if (s === 'docker') {
      return !values.dockerSave;
    }
    return true;
  }

  resolveOutputDir(flags: DownloadResolvedFlags): string {
    const explicit = flags['output-dir'];
    if (explicit) {
      return explicit;
    }
    return defaultOutputDirForVersion(flags.version || 'latest');
  }

  /**
   * Defaults for prompts only. Keys present in **`preset`** are omitted so `runPromptCatalog` uses
   * **`values`** (preset) alone for those steps — no duplicate prefill for skipped prompts.
   */
  private buildInitialValuesFromParsed(
    flags: DownloadParsedFlags,
    preset: PromptInitialValues,
  ): PromptInitialValues {
    const initialValues: PromptInitialValues = {};

    const source = flags.source?.trim();
    if (source) {
      initialValues.source = source;
    }

    if (flags.version !== undefined) {
      initialValues.version = flags.version.trim() || 'latest';
    }

    initialValues.replace = flags.replace;
    initialValues.devDependencies = flags['dev-dependencies'];
    initialValues.build = flags.build;
    initialValues.buildDts = flags['build-dts'];

    if (flags['output-dir'] !== undefined) {
      initialValues.outputDir = flags['output-dir']?.trim() ?? '';
    }

    if (flags['git-url'] !== undefined) {
      initialValues.gitUrl = flags['git-url']?.trim() ?? '';
    }

    if (flags['docker-registry'] !== undefined) {
      initialValues.dockerRegistry = String(flags['docker-registry'] ?? '').trim();
    }

    const dockerPlatformRaw = flags['docker-platform'];
    if (typeof dockerPlatformRaw === 'string') {
      initialValues.dockerPlatform = dockerPlatformRaw.trim();
    }

    initialValues.dockerSave = flags['docker-save'];

    if (flags['npm-registry'] !== undefined) {
      initialValues.npmRegistry =
        typeof flags['npm-registry'] === 'string' ? flags['npm-registry'] : '';
    }

    for (const key of Object.keys(preset)) {
      if (Object.prototype.hasOwnProperty.call(initialValues, key)) {
        delete initialValues[key];
      }
    }

    return initialValues;
  }

  /**
   * Preset `values` for `runPromptCatalog`: any key here skips that prompt and fixes the result.
   * Keys not listed are resolved interactively (TTY) or from catalog defaults / `initialValues` (non-TTY / `-y`).
   */
  private buildPresetValuesFromFlags(flags: DownloadParsedFlags): PromptInitialValues {
    const preset: PromptInitialValues = {};
    const argv = process.argv.slice(2);

    if (flags.source !== undefined && String(flags.source).trim() !== '') {
      preset.source = String(flags.source).trim();
    }

    if (flags.version !== undefined) {
      preset.version = String(flags.version).trim() || 'latest';
    }

    if (flags['docker-registry'] !== undefined) {
      const v = String(flags['docker-registry'] ?? '').trim();
      if (v) {
        preset.dockerRegistry = v;
      }
    }

    if (flags['docker-platform'] !== undefined && typeof flags['docker-platform'] === 'string') {
      const t = flags['docker-platform'].trim();
      if (t === '' || isDockerPlatform(t)) {
        preset.dockerPlatform = t;
      }
    }

    if (flags['output-dir'] !== undefined) {
      const v = flags['output-dir']?.trim();
      if (v) {
        preset.outputDir = v;
      }
    }

    if (flags['git-url'] !== undefined) {
      const v = flags['git-url']?.trim();
      if (v) {
        preset.gitUrl = v;
      }
    }

    if (flags['npm-registry'] !== undefined) {
      preset.npmRegistry = typeof flags['npm-registry'] === 'string' ? flags['npm-registry'] : '';
    }

    if (argvHasToken(argv, ['--replace', '-r'])) {
      preset.replace = flags.replace;
    }

    if (argvHasToken(argv, ['--dev-dependencies', '--no-dev-dependencies', '-D'])) {
      preset.devDependencies = flags['dev-dependencies'];
    }

    if (argvHasToken(argv, ['--docker-save', '--no-docker-save'])) {
      preset.dockerSave = flags['docker-save'];
    }

    if (argvHasToken(argv, ['--build', '--no-build'])) {
      preset.build = flags.build;
    }

    if (argvHasToken(argv, ['--build-dts', '--no-build-dts'])) {
      preset.buildDts = flags['build-dts'];
    }

    return preset;
  }

  private resolveEffectiveBuild(
    source: DownloadSource,
    results: Record<string, PromptValue>,
    flags: DownloadParsedFlags,
  ): boolean {
    if (source === 'npm' && !Boolean(results.devDependencies)) {
      return false;
    }
    if (source === 'npm' || source === 'git') {
      return results.build !== undefined ? Boolean(results.build) : flags.build;
    }
    return flags.build;
  }

  private mapCatalogResultsToResolved(
    results: Record<string, PromptValue>,
    flags: DownloadParsedFlags,
  ): DownloadResolvedFlags {
    const source = String(results.source) as DownloadSource;
    const version = String(results.version ?? '').trim() || 'latest';

    const dockerPlatformRaw =
      results.dockerPlatform !== undefined ? String(results.dockerPlatform).trim() : '';
    let dockerPlatform: DockerPlatform | undefined;
    if (dockerPlatformRaw && isDockerPlatform(dockerPlatformRaw)) {
      dockerPlatform = dockerPlatformRaw;
    }

    const devDependencies = source === 'npm' ? Boolean(results.devDependencies) : undefined;

    const effectiveBuild = this.resolveEffectiveBuild(source, results, flags);
    const buildDtsWant =
      results.buildDts !== undefined ? Boolean(results.buildDts) : flags['build-dts'];

    const outputDir =
      results.outputDir !== undefined
        ? String(results.outputDir).trim() || undefined
        : flags['output-dir']?.trim() || undefined;

    const replace =
      results.replace !== undefined ? Boolean(results.replace) : flags.replace;

    const gitUrl =
      results.gitUrl !== undefined
        ? String(results.gitUrl).trim() || undefined
        : flags['git-url']?.trim() || undefined;

    const dockerRegistry =
      results.dockerRegistry !== undefined
        ? String(results.dockerRegistry).trim() || undefined
        : flags['docker-registry']?.trim() || undefined;

    const dockerSave =
      source === 'docker'
        ? results.dockerSave !== undefined
          ? Boolean(results.dockerSave)
          : flags['docker-save']
        : false;

    const npmRegistryRaw =
      results.npmRegistry !== undefined
        ? String(results.npmRegistry)
        : flags['npm-registry'] ?? '';
    const npmRegistry = npmRegistryRaw.trim() || undefined;

    return {
      source,
      version,
      replace,
      ...(source === 'npm' ? { 'dev-dependencies': devDependencies! } : {}),
      'build': effectiveBuild,
      'build-dts': normalizeBuildDts(source, effectiveBuild, buildDtsWant),
      'output-dir': outputDir,
      'git-url': gitUrl,
      'docker-registry': dockerRegistry,
      ...(source === 'docker' && dockerPlatform ? { 'docker-platform': dockerPlatform } : {}),
      ...(source === 'docker' ? { 'docker-save': dockerSave } : {}),
      ...(npmRegistry ? { 'npm-registry': npmRegistry } : {}),
    } as DownloadResolvedFlags;
  }

  private async resolveDownloadFlags(flags: DownloadParsedFlags): Promise<DownloadResolvedFlags> {
    const nonInteractive = !stdinStream.isTTY || !stdoutStream.isTTY || flags.yes;

    const dockerPlatformFlag = flags['docker-platform'];
    if (typeof dockerPlatformFlag === 'string' && dockerPlatformFlag.trim()) {
      const t = dockerPlatformFlag.trim();
      if (!isDockerPlatform(t)) {
        this.error(
          `--docker-platform must be ${DOCKER_PLATFORMS.join(' or ')} (or omit for the default platform).`,
        );
      }
    }

    if (nonInteractive && !flags.source?.trim()) {
      this.error(
        'Distribution is required (--source npm|git|docker). Use a terminal for interactive setup, or pass -s/--source.',
      );
    }

    const presetValues = this.buildPresetValuesFromFlags(flags);
    const initialValues = this.buildInitialValuesFromParsed(flags, presetValues);

    const results = await runPromptCatalog(Download.prompts, {
      initialValues,
      values: presetValues,
      yes: flags.yes,
      command: this,
      hooks: {
        onCancel: () => {
          p.cancel('Download cancelled.');
          this.exit(0);
        },
        onMissingNonInteractive: (message: string) => {
          this.error(message);
        },
      },
    });

    console.log('results', results);
    const source = String(results.source ?? '').trim() as DownloadSource | '';
    if (!source || !['docker', 'npm', 'git'].includes(source)) {
      this.error(
        'Distribution is required (--source npm|git|docker). Use a terminal for interactive setup, or pass -s/--source.',
      );
    }

    if (flags['docker-save'] && source !== 'docker') {
      this.error('--docker-save can only be used with --source docker.');
    }

    return this.mapCatalogResultsToResolved(results, flags);
  }

  private npmRegistryUrl(flags: DownloadResolvedFlags): string | undefined {
    const url = flags['npm-registry']?.trim();
    return url || undefined;
  }

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
