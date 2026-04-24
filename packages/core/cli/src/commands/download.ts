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
import {
  applyCliLocale,
  CLI_LOCALE_FLAG_DESCRIPTION,
  CLI_LOCALE_FLAG_OPTIONS,
  localeText,
} from '../lib/cli-locale.ts';
import { run } from '../lib/run-npm.ts';
import { printVerbose, setVerboseMode, startTask, stopTask, updateTask } from '../lib/ui.js';

type DownloadSource = 'docker' | 'npm' | 'git';
type DockerPlatform = 'auto' | 'linux/amd64' | 'linux/arm64';
const DEFAULT_DOCKER_REGISTRY = 'nocobase/nocobase';
const DEFAULT_DOCKER_REGISTRY_ZH_CN = 'registry.cn-shanghai.aliyuncs.com/nocobase/nocobase';
const DEFAULT_DOCKER_PLATFORM: DockerPlatform = 'auto';
const downloadText = (key: string, values?: Record<string, unknown>) =>
  localeText(`commands.download.${key}`, values);

function defaultOutputDirForVersion(versionTag: string): string {
  const safe = versionTag.replace(/[/\\]/g, '-');
  return `./nocobase-${safe}`;
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await fsp.access(target);
    return true;
  } catch {
    return false;
  }
}

export function defaultDockerRegistryForLang(lang: unknown): string {
  return String(lang ?? '').trim() === 'zh-CN'
    ? DEFAULT_DOCKER_REGISTRY_ZH_CN
    : DEFAULT_DOCKER_REGISTRY;
}

function argvHasToken(argv: string[], tokens: string[]): boolean {
  return tokens.some((t) => argv.includes(t));
}

function gitRefForVersion(versionSpec: string): string {
  const versionToRef: Record<string, string> = {
    latest: 'main',
    beta: 'next',
    alpha: 'develop',
  };
  return versionToRef[versionSpec] || versionSpec;
}

/** `build-dts` only applies when `build` is true and source is npm/git. */
function normalizeBuildDts(source: DownloadSource, build: boolean, wantDts: boolean): boolean {
  if (source !== 'npm' && source !== 'git') {
    return false;
  }
  return Boolean(build && wantDts);
}

function downloadSourceLabel(source: DownloadSource): string {
  switch (source) {
    case 'docker':
      return 'Docker image';
    case 'npm':
      return 'npm package';
    case 'git':
      return 'Git repository';
    default:
      return source;
  }
}

function normalizeDockerPlatform(value: unknown): DockerPlatform {
  const text = String(value ?? '').trim();
  if (text === 'linux/amd64' || text === 'linux/arm64') {
    return text;
  }
  return DEFAULT_DOCKER_PLATFORM;
}

function dockerPlatformArg(value: unknown): string | undefined {
  const platform = normalizeDockerPlatform(value);
  if (platform === 'auto') {
    return undefined;
  }
  return platform;
}

const EXTERNAL_COMMAND_LOADING_DELAY_MS = 8_000;
const EXTERNAL_COMMAND_LOADING_UPDATE_MS = 15_000;

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
  /** docker only: platform for `docker pull`; "auto" omits --platform. */
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
  verbose: boolean;
  locale?: string;
  'no-intro': boolean;
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
  private _flags?: DownloadParsedFlags;
  private preparationTaskActive = false;

  static override description =
    'Scaffold or fetch NocoBase from npm, Docker, or Git. `--version` is the shared version input: package version for npm, image tag for Docker, and git ref for Git.';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> -y --source npm --version alpha',
    '<%= config.bin %> <%= command.id %> -y --source npm --version alpha --no-build',
    '<%= config.bin %> <%= command.id %> --source npm --version alpha',
    '<%= config.bin %> <%= command.id %> --source npm --version alpha --output-dir=./app',
    '<%= config.bin %> <%= command.id %> --source docker --version alpha --docker-registry=nocobase/nocobase --docker-platform=linux/arm64',
    '<%= config.bin %> <%= command.id %> -y --source docker --version alpha --docker-save -o ./docker-images',
    '<%= config.bin %> <%= command.id %> --source git --version alpha --git-url=git@github.com:nocobase/nocobase.git',
    '<%= config.bin %> <%= command.id %> --source git --version fix/cli-v2',
    '<%= config.bin %> <%= command.id %> -y --source git --version fix/cli-v2 --no-build',
    '<%= config.bin %> <%= command.id %> -y --source npm --version alpha --build-dts',
    '<%= config.bin %> <%= command.id %> -y --source npm --version alpha --npm-registry=https://registry.npmmirror.com',
  ];

  static override flags = {
    yes: Flags.boolean({
      char: 'y',
      description:
        'Use defaults and skip interactive prompts.',
      default: false,
    }),
    verbose: Flags.boolean({
      description: 'Show detailed command output',
      default: false,
    }),
    locale: Flags.string({
      description: CLI_LOCALE_FLAG_DESCRIPTION,
      options: CLI_LOCALE_FLAG_OPTIONS,
    }),
    'no-intro': Flags.boolean({
      hidden: true,
      description: 'Skip command intro when invoked by another CLI command',
      default: false,
    }),
    source: Flags.string({
      char: 's',
      description:
        'How to get NocoBase: Docker image, npm package, or Git repository.',
      options: ['docker', 'npm', 'git'],
      required: false,
    }),
    version: Flags.string({
      char: 'v',
      description:
        'Shared version input. For npm this is the package version, for Docker the image tag, and for Git a git ref such as a branch name (for example: alpha, beta, latest, fix/cli-v2).',
    }),
    replace: Flags.boolean({
      char: 'r',
      description:
        'Replace the target directory if it already exists.',
      default: false,
    }),
    'dev-dependencies': Flags.boolean({
      char: 'D',
      allowNo: true,
      description:
        'Install development dependencies for npm/git source installs.',
      default: false,
    }),
    'output-dir': Flags.string({
      char: 'o',
      description:
        'Download target directory, or Docker tarball directory when --docker-save is enabled.',
    }),
    'git-url': Flags.string({
      description: 'Git repository URL to clone when --source git is used.',
    }),
    'docker-registry': Flags.string({
      description: 'Docker registry to pull when --source docker is used; combine it with --version as the image tag.',
    }),
    'docker-platform': Flags.string({
      description: 'Docker image platform to pull; use auto to let Docker choose.',
      options: ['auto', 'linux/amd64', 'linux/arm64'],
    }),
    'docker-save': Flags.boolean({
      allowNo: true,
      description:
        'Also save the pulled Docker image as a tarball.',
      default: false,
    }),
    'npm-registry': Flags.string({
      description:
        'npm registry for npm/git downloads and dependency installation.',
    }),
    'build': Flags.boolean({
      allowNo: true,
      description:
        'Build npm/git source after dependencies are installed.',
      default: true,
    }),
    'build-dts': Flags.boolean({
      description:
        'Generate TypeScript declaration files during the npm/git build.',
      default: false,
    }),
  };

  static prompts: PromptsCatalog = {
    source: {
      type: 'select',
      message: downloadText('prompts.source.message'),
      options: [
        { value: 'npm', label: downloadText('prompts.source.npmLabel') },
        { value: 'git', label: downloadText('prompts.source.gitLabel') },
        { value: 'docker', label: downloadText('prompts.source.dockerLabel') },
      ],
      yesInitialValue: 'docker',
      initialValue: 'docker',
      required: true,
    },
    version: {
      type: 'text',
      message: downloadText('prompts.version.message'),
      placeholder: downloadText('prompts.version.placeholder'),
      initialValue: 'alpha',
      yesInitialValue: 'alpha',
      required: true,
    },
    dockerRegistry: {
      type: 'text',
      message: downloadText('prompts.dockerRegistry.message'),
      placeholder: downloadText('prompts.dockerRegistry.placeholder'),
      initialValue: (values) => defaultDockerRegistryForLang(values.lang),
      yesInitialValue: DEFAULT_DOCKER_REGISTRY,
      required: true,
      hidden: (values) => values.source !== 'docker',
    },
    dockerPlatform: {
      type: 'select',
      message: downloadText('prompts.dockerPlatform.message'),
      options: [
        {
          value: 'auto',
          label: downloadText('prompts.dockerPlatform.autoLabel'),
          hint: downloadText('prompts.dockerPlatform.autoHint'),
        },
        { value: 'linux/amd64', label: 'linux/amd64' },
        { value: 'linux/arm64', label: 'linux/arm64' },
      ],
      initialValue: DEFAULT_DOCKER_PLATFORM,
      yesInitialValue: DEFAULT_DOCKER_PLATFORM,
      required: true,
      hidden: (values) => values.source !== 'docker',
    },
    dockerSave: {
      type: 'boolean',
      message: downloadText('prompts.dockerSave.message'),
      initialValue: false,
      hidden: (values) => values.source !== 'docker',
    },
    gitUrl: {
      type: 'text',
      message: downloadText('prompts.gitUrl.message'),
      placeholder: downloadText('prompts.gitUrl.placeholder'),
      initialValue: 'https://github.com/nocobase/nocobase.git',
      yesInitialValue: 'https://github.com/nocobase/nocobase.git',
      required: true,
      hidden: (values) => values.source !== 'git',
    },
    outputDir: {
      type: 'text',
      message: downloadText('prompts.outputDir.message'),
      placeholder: downloadText('prompts.outputDir.placeholder'),
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
    npmRegistry: {
      type: 'text',
      message: downloadText('prompts.npmRegistry.message'),
      placeholder: downloadText('prompts.npmRegistry.placeholder'),
      initialValue: '',
      hidden: (values) => values.source !== 'npm' && values.source !== 'git',
    },
    replace: {
      type: 'boolean',
      message: downloadText('prompts.replace.message'),
      initialValue: false,
      hidden: (values) => Download.hideOutputDirAndReplaceSteps(values),
    },
    devDependencies: {
      type: 'boolean',
      message: downloadText('prompts.devDependencies.message'),
      initialValue: false,
      hidden: (values) => values.source !== 'npm',
    },
    build: {
      type: 'boolean',
      message: downloadText('prompts.build.message'),
      initialValue: true,
      yesInitialValue: true,
      hidden: () => true,
    },
    buildDts: {
      type: 'boolean',
      message: downloadText('prompts.buildDts.message'),
      initialValue: false,
      hidden: (values) => values.source !== 'git',
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

  private async ensureOutputDirAvailable(outputDir: string, replace: boolean): Promise<string> {
    const outputAbs = path.resolve(process.cwd(), outputDir);
    if (replace) {
      await fsp.rm(outputAbs, { recursive: true, force: true });
      return outputAbs;
    }
    if (await pathExists(outputAbs)) {
      this.error(
        `Download target already exists: ${outputDir}. Use --replace to remove it before continuing.`,
      );
    }
    return outputAbs;
  }

  private dockerTarPath(flags: DownloadResolvedFlags, outputAbs: string): string {
    const image = flags['docker-registry'] ?? DEFAULT_DOCKER_REGISTRY;
    const tag = flags.version ?? 'latest';
    const safeBase = `${image.replace(/[/:]/g, '-')}-${tag.replace(/[/\\]/g, '-')}`;
    return path.join(outputAbs, `${safeBase}.tar`);
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

    initialValues.dockerPlatform = normalizeDockerPlatform(flags['docker-platform']);

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

    if (argvHasToken(argv, ['--docker-platform'])) {
      preset.dockerPlatform = normalizeDockerPlatform(flags['docker-platform']);
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

    const dockerPlatform =
      source === 'docker'
        ? normalizeDockerPlatform(
          results.dockerPlatform !== undefined
            ? results.dockerPlatform
            : flags['docker-platform'],
        )
        : undefined;

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
      ...(source === 'docker' ? { 'docker-platform': dockerPlatform } : {}),
      ...(source === 'docker' ? { 'docker-save': dockerSave } : {}),
      ...(npmRegistry ? { 'npm-registry': npmRegistry } : {}),
    } as DownloadResolvedFlags;
  }

  private async resolveDownloadFlags(flags: DownloadParsedFlags): Promise<DownloadResolvedFlags> {
    const nonInteractive = !stdinStream.isTTY || !stdoutStream.isTTY || flags.yes;

    if (nonInteractive && !flags.source?.trim()) {
      this.error(
        'Download source is required in non-interactive mode. Use --source npm, --source git, or --source docker.',
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

    const source = String(results.source ?? '').trim() as DownloadSource | '';
    if (!source || !['docker', 'npm', 'git'].includes(source)) {
      this.error(
        'Download source is required. Choose npm, git, or docker.',
      );
    }

    if (flags['docker-save'] && source !== 'docker') {
      this.error('--docker-save is only available when --source docker is selected.');
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

  private isVerbose(): boolean {
    const flags = this._flags as Partial<DownloadParsedFlags> | undefined;
    return Boolean(flags?.verbose);
  }

  private commandStdio(): 'inherit' | 'ignore' {
    return this.isVerbose() ? 'inherit' : 'ignore';
  }

  private formatCommandForLog(name: string, args: string[], cwd?: string): string {
    const quotedArgs = args.map((arg) => (/\s/.test(arg) ? JSON.stringify(arg) : arg));
    const commandLine = [name, ...quotedArgs].join(' ');
    return cwd ? `${commandLine} (cwd: ${cwd})` : commandLine;
  }

  private async runExternalCommand(
    name: string,
    args: string[],
    options?: {
      cwd?: string;
      env?: Record<string, string>;
      errorName?: string;
      loadingMessage?: string;
    },
  ): Promise<void> {
    const cwd = options?.cwd;
    printVerbose(`Running command: ${this.formatCommandForLog(name, args, cwd)}`);
    let loadingStarted = false;
    let loadingTimer: ReturnType<typeof setTimeout> | undefined;
    let updateTimer: ReturnType<typeof setInterval> | undefined;
    let elapsedSeconds = 0;

    if (!this.isVerbose() && options?.loadingMessage) {
      loadingTimer = setTimeout(() => {
        loadingStarted = true;
        elapsedSeconds = Math.floor(EXTERNAL_COMMAND_LOADING_DELAY_MS / 1000);
        startTask(`${options.loadingMessage}. Please wait...`);
        updateTimer = setInterval(() => {
          elapsedSeconds += Math.floor(EXTERNAL_COMMAND_LOADING_UPDATE_MS / 1000);
          updateTask(`${options.loadingMessage}. Still working... (${elapsedSeconds}s elapsed)`);
        }, EXTERNAL_COMMAND_LOADING_UPDATE_MS);
      }, EXTERNAL_COMMAND_LOADING_DELAY_MS);
    }

    try {
      await run(name, args, {
        ...options,
        stdio: this.commandStdio(),
      });
    } finally {
      if (loadingTimer) {
        clearTimeout(loadingTimer);
      }
      if (updateTimer) {
        clearInterval(updateTimer);
      }
      if (loadingStarted) {
        stopTask();
      }
    }
  }

  private startPreparationTask(message: string): void {
    if (this.isVerbose()) {
      p.log.step(message);
      return;
    }

    this.preparationTaskActive = true;
    startTask(message);
  }

  private finishPreparationTask(): void {
    if (!this.preparationTaskActive) {
      return;
    }

    this.preparationTaskActive = false;
    stopTask();
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
    const image = flags['docker-registry'] ?? DEFAULT_DOCKER_REGISTRY;
    const tag = flags.version ?? 'latest';
    const imageRef = `${image}:${tag}`;
    const platform = dockerPlatformArg(flags['docker-platform']);
    const pullArgs = ['pull'];
    if (platform) {
      pullArgs.push('--platform', platform);
    }
    pullArgs.push(imageRef);
    this.finishPreparationTask();
    p.log.step(`Pulling Docker image ${imageRef}`);
    await this.runExternalCommand('docker', pullArgs, {
      errorName: 'docker pull',
      loadingMessage: 'Pulling the Docker image',
    });
    p.log.info(`Docker image is ready: ${imageRef}`);

    if (!flags['docker-save']) {
      return;
    }

    const outputDir = this.resolveOutputDir(flags);
    const outAbs = flags.replace
      ? path.resolve(process.cwd(), outputDir)
      : await this.ensureOutputDirAvailable(outputDir, false);
    if (flags.replace) {
      await fsp.rm(outAbs, { recursive: true, force: true });
    }
    await fsp.mkdir(outAbs, { recursive: true });
    const tarPath = this.dockerTarPath(flags, outAbs);
    p.log.step(`Saving Docker image tarball to ${tarPath}`);
    await this.runExternalCommand('docker', ['save', '-o', tarPath, imageRef], {
      errorName: 'docker save',
      loadingMessage: 'Saving the Docker image tarball',
    });
    p.log.info(`Docker image tarball saved: ${tarPath}`);
  }

  async downloadFromNpm(flags: DownloadResolvedFlags): Promise<string> {
    const versionSpec = flags.version || 'latest';
    const outputDir = this.resolveOutputDir(flags);
    const projectRoot = path.resolve(process.cwd(), outputDir);
    await this.ensureOutputDirAvailable(outputDir, flags.replace);
    const parentDir = path.dirname(projectRoot);
    const appName = path.basename(projectRoot);
    const npxArgs = ['-y', `create-nocobase-app@${versionSpec}`, appName];
    if (!flags['dev-dependencies']) {
      npxArgs.push('--skip-dev-dependencies');
    }
    await fsp.mkdir(parentDir, { recursive: true });
    const registryEnv = this.npmRegistryEnv(flags);
    this.finishPreparationTask();
    p.log.step(`Creating NocoBase app "${appName}" from npm`);
    await this.runExternalCommand('npx', npxArgs, {
      ...this.runOptionsWithCwd(parentDir, registryEnv),
      errorName: 'npx create-nocobase-app',
      loadingMessage: 'Creating the app scaffold',
    });
    const installArgs = ['install'];
    if (!flags['dev-dependencies']) {
      installArgs.push('--production');
    }
    p.log.step(`Installing dependencies in ${projectRoot}`);
    await this.runExternalCommand('yarn', installArgs, {
      ...this.runOptionsWithCwd(projectRoot, registryEnv),
      errorName: 'yarn install',
      loadingMessage: 'Installing dependencies',
    });
    if (flags.build && flags['dev-dependencies']) {
      p.log.step(`Building app in ${projectRoot}`);
      await this.config.runCommand('build', [
        ...this.buildCommandArgv(projectRoot, flags),
        ...(this.isVerbose() ? ['--verbose'] : []),
      ]);
    }
    p.log.info(`NocoBase app is ready at ${projectRoot}`);
    return projectRoot;
  }

  async downloadFromGit(flags: DownloadResolvedFlags): Promise<string> {
    const repoUrl = flags['git-url'] ?? 'https://github.com/nocobase/nocobase.git';
    const versionSpec = flags.version || 'latest';
    const outputDir = this.resolveOutputDir(flags);
    await this.ensureOutputDirAvailable(outputDir, flags.replace);
    const branch = gitRefForVersion(versionSpec);
    const gitArgs = ['clone'];
    gitArgs.push('--branch', branch);
    gitArgs.push('--depth', '1', repoUrl, outputDir);
    this.finishPreparationTask();
    p.log.step(
      branch === versionSpec
        ? `Cloning NocoBase from ${repoUrl} (${branch})`
        : `Cloning NocoBase from ${repoUrl} (${branch}, resolved from ${versionSpec})`,
    );
    await this.runExternalCommand('git', gitArgs, {
      errorName: 'git clone',
      loadingMessage: 'Cloning the repository',
    });
    const projectRoot = path.resolve(process.cwd(), outputDir);
    const registryEnv = this.npmRegistryEnv(flags);
    p.log.step(`Installing dependencies in ${projectRoot}`);
    await this.runExternalCommand('yarn', ['install'], {
      ...this.runOptionsWithCwd(projectRoot, registryEnv),
      errorName: 'yarn install',
      loadingMessage: 'Installing dependencies',
    });
    if (flags.build) {
      p.log.step(`Building app in ${projectRoot}`);
      await this.config.runCommand('build', [
        ...this.buildCommandArgv(projectRoot, flags),
        ...(this.isVerbose() ? ['--verbose'] : []),
      ]);
    }
    p.log.info(`NocoBase app is ready at ${projectRoot}`);
    return projectRoot;
  }

  async download(): Promise<DownloadCommandResult> {
    const { flags } = await this.parse(Download);
    this._flags = flags as DownloadParsedFlags;
    applyCliLocale(this._flags.locale);
    setVerboseMode(Boolean(flags.verbose));
    if (!flags['no-intro']) {
      p.intro('Get NocoBase');
    }
    const resolved = await this.resolveDownloadFlags(flags);
    const source = resolved.source as DownloadSource;

    this.startPreparationTask(`Preparing download from ${downloadSourceLabel(source)}`);

    try {
      switch (source) {
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
          this.error(`Unsupported download source: ${resolved.source}`);
      }
    } finally {
      this.finishPreparationTask();
    }
  }

  public async run(): Promise<DownloadCommandResult> {
    try {
      const result = await this.download();
      p.outro(`Download completed via ${downloadSourceLabel(result.resolved.source as DownloadSource)}.`);
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(message);
    }
  }
}
