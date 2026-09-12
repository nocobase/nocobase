/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import pc from 'picocolors';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ManagedAppRuntime } from '../../../lib/app-runtime.js';
import { DEFAULT_DOCKER_REGISTRY, DEFAULT_DOCKER_VERSION, resolveDockerImageRef } from '../../../lib/docker-image.ts';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../../lib/env-guard.js';
import {
  createLicenseEnvFlag,
  licenseJsonFlag,
  licensePkgUrlFlag,
  licenseYesFlag,
  readSavedLicenseKey,
  requireLicenseRuntime,
} from '../shared.js';
import { MissingSavedLicenseKeyError, syncLicensedPlugins } from './shared.js';
import { resolvePluginStoragePath } from '../../../lib/plugin-storage.js';
import { commandOutput } from '../../../lib/run-npm.js';
import { announceTargetEnv, startTask, stopTask, succeedTask, updateTask } from '../../../lib/ui.js';

const SYNC_LOADING_DELAY_MS = 1200;
const SYNC_LOADING_UPDATE_MS = 5000;
const LOCAL_APP_PACKAGE_JSON_PATH = 'node_modules/@nocobase/app/package.json';
function formatActionLabel(action: 'installed' | 'updated' | 'removed' | 'skipped') {
  switch (action) {
    case 'installed':
      return pc.green('installed');
    case 'updated':
      return pc.cyan('updated');
    case 'removed':
      return pc.yellow('removed');
    case 'skipped':
      return pc.dim('skipped');
  }
}

function trimValue(value: unknown): string | undefined {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function normalizeDockerPlatform(value: unknown): string | undefined {
  const text = trimValue(value);
  if (!text || text === 'auto') {
    return undefined;
  }
  if (text === 'linux/amd64' || text === 'linux/arm64') {
    return text;
  }
  return undefined;
}

function normalizePluginRegistryVersion(version: string): string {
  const normalized = version.trim();
  const rcMatch = normalized.match(/^(.+)-rc\.\d{8,}$/);
  if (rcMatch) {
    return rcMatch[1];
  }
  const betaMatch = normalized.match(/^(.+-beta\.\d+)\.\d{8,}$/);
  if (betaMatch) {
    return betaMatch[1];
  }
  const alphaMatch = normalized.match(/^(.+-alpha\.\d+)\.\d{8,}$/);
  if (alphaMatch) {
    return alphaMatch[1];
  }
  return normalized;
}

async function parseVersionFromPackageJson(content: string, sourceLabel: string): Promise<string> {
  let parsed: { version?: unknown };
  try {
    parsed = JSON.parse(content) as { version?: unknown };
  } catch {
    throw new Error(`Failed to parse ${sourceLabel}.`);
  }

  const version = trimValue(parsed.version);
  if (!version) {
    throw new Error(`Missing version in ${sourceLabel}.`);
  }
  return version;
}

async function resolveLocalAppVersion(runtime: Extract<ManagedAppRuntime, { kind: 'local' }>): Promise<string> {
  const packageJsonPath = path.join(runtime.projectRoot, LOCAL_APP_PACKAGE_JSON_PATH);
  let content: string;
  try {
    content = await readFile(packageJsonPath, 'utf8');
  } catch {
    throw new Error(`Missing ${LOCAL_APP_PACKAGE_JSON_PATH} for env "${runtime.envName}" at ${packageJsonPath}.`);
  }
  return await parseVersionFromPackageJson(content, packageJsonPath);
}

async function resolveDockerAppVersion(runtime: Extract<ManagedAppRuntime, { kind: 'docker' }>): Promise<string> {
  const config = runtime.env.config ?? {};
  const imageRef = resolveDockerImageRef(config.dockerRegistry, config.downloadVersion, {
    defaultRegistry: DEFAULT_DOCKER_REGISTRY,
    defaultVersion: DEFAULT_DOCKER_VERSION,
  });
  const args = ['run', '--rm', '--network', runtime.workspaceName];
  const dockerPlatform = normalizeDockerPlatform(config.dockerPlatform);
  if (dockerPlatform) {
    args.push('--platform', dockerPlatform);
  }
  args.push('--entrypoint', 'nb', imageRef, '--version');

  let output: string;
  try {
    output = await commandOutput('docker', args, {
      errorName: 'docker run',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to read app version for env "${runtime.envName}" from Docker image ${imageRef}. ${message}`,
    );
  }

  const versionMatch = output.match(/@nocobase\/cli\/([^\s]+)/);
  const version = trimValue(versionMatch?.[1] ?? output.replace(/^"+|"+$/g, ''));
  if (!version) {
    throw new Error(`Missing app version for env "${runtime.envName}" inside Docker image ${imageRef}.`);
  }
  return version;
}

async function resolveManagedAppVersion(runtime: ManagedAppRuntime): Promise<string> {
  if (runtime.kind === 'local') {
    return await resolveLocalAppVersion(runtime);
  }
  if (runtime.kind === 'docker') {
    return await resolveDockerAppVersion(runtime);
  }
  throw new Error(`Env "${runtime.envName}" does not support automatic app version detection.`);
}

function buildNoLicenseSkipPayload(runtime: ManagedAppRuntime, dryRun: boolean) {
  return {
    ok: true,
    env: runtime.envName,
    kind: runtime.kind,
    dryRun,
    status: 'skipped',
    skipReason: 'no-license-key',
  };
}

export default class LicensePluginsSync extends Command {
  static override summary = 'Synchronize commercial plugins for the selected env';
  static override description = 'Synchronize the commercial plugins allowed by the current saved license key.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --dry-run',
    '<%= config.bin %> <%= command.id %> --env app1 --json',
  ];
  static override flags = {
    env: createLicenseEnvFlag('CLI env name to sync licensed plugins for. Defaults to the current env when omitted'),
    json: licenseJsonFlag,
    'pkg-url': licensePkgUrlFlag,
    'dry-run': Flags.boolean({
      description: 'Preview plugin changes without installing, upgrading, or removing anything',
      default: false,
    }),
    version: Flags.string({
      description: 'Registry version or dist-tag to synchronize. Defaults to the current workspace version.',
    }),
    'skip-if-no-license': Flags.boolean({
      description: 'Skip without error when this env does not have a saved license key',
      default: false,
    }),
    verbose: Flags.boolean({
      description: 'Show detailed per-plugin sync logs',
      default: false,
    }),
    yes: licenseYesFlag,
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(LicensePluginsSync);
    const requestedEnv = flags.env?.trim() || undefined;
    const explicitEnvSelection = Boolean(requestedEnv && hasExplicitEnvSelection(this.argv ?? []));
    if (explicitEnvSelection) {
      const confirmed = await ensureCrossEnvConfirmed({
        command: this,
        requestedEnv,
        yes: flags.yes,
      });
      if (!confirmed) {
        return;
      }
    }

    const runtime = await requireLicenseRuntime(flags.env);
    if (!flags.json) {
      announceTargetEnv(runtime.envName);
    }
    if (flags['skip-if-no-license']) {
      const savedLicenseKey = await readSavedLicenseKey(runtime);
      if (!savedLicenseKey) {
        const payload = buildNoLicenseSkipPayload(runtime, Boolean(flags['dry-run']));
        if (flags.json) {
          this.log(JSON.stringify(payload, null, 2));
        }
        return;
      }
    }
    const version = trimValue(flags.version) || (await resolveManagedAppVersion(runtime));
    const registryVersion = normalizePluginRegistryVersion(version);
    const shouldStreamLogs = !flags.json && Boolean(flags.verbose);
    const pluginStoragePath = resolvePluginStoragePath(runtime.env.storagePath);
    const shouldShowLoading = !flags.json && !flags.verbose;

    if (!flags.json) {
      this.log(
        pc.bold(
          flags['dry-run']
            ? `Commercial plugin sync preview for env "${runtime.envName}"`
            : `Commercial plugin sync for env "${runtime.envName}"`,
        ),
      );
      this.log(pc.dim(`App version: ${version}`));
      if (registryVersion !== version) {
        this.log(pc.dim(`Download version: ${registryVersion}`));
      }
      this.log(pc.dim(`Plugin storage path: ${pluginStoragePath}`));
    }

    let loadingStarted = false;
    let loadingTimer: ReturnType<typeof setTimeout> | undefined;
    let updateTimer: ReturnType<typeof setInterval> | undefined;
    let elapsedSeconds = 0;

    if (shouldShowLoading) {
      loadingTimer = setTimeout(() => {
        loadingStarted = true;
        elapsedSeconds = Math.floor(SYNC_LOADING_DELAY_MS / 1000);
        startTask(
          flags['dry-run']
            ? 'Preparing commercial plugin sync preview. Please wait...'
            : 'Synchronizing commercial plugins. Please wait...',
        );
        updateTimer = setInterval(() => {
          elapsedSeconds += Math.floor(SYNC_LOADING_UPDATE_MS / 1000);
          updateTask(
            flags['dry-run']
              ? `Preparing commercial plugin sync preview. Still working... (${elapsedSeconds}s elapsed)`
              : `Synchronizing commercial plugins. Still working... (${elapsedSeconds}s elapsed)`,
          );
        }, SYNC_LOADING_UPDATE_MS);
      }, SYNC_LOADING_DELAY_MS);
    }

    let result;
    try {
      try {
        result = await syncLicensedPlugins(runtime, {
          pkgUrl: flags['pkg-url'],
          version: registryVersion,
          dryRun: Boolean(flags['dry-run']),
          onProgress: shouldStreamLogs
            ? async (detail) => {
                this.log(`${formatActionLabel(detail.action)} ${pc.bold(detail.packageName)}`);
                this.log(pc.dim(`  output: ${detail.outputDir}`));
                if (detail.warning) {
                  this.log(pc.yellow(`  warning: ${detail.warning}`));
                }
              }
            : undefined,
        });
      } catch (error) {
        if (flags['skip-if-no-license'] && error instanceof MissingSavedLicenseKeyError) {
          const payload = buildNoLicenseSkipPayload(runtime, Boolean(flags['dry-run']));
          if (flags.json) {
            this.log(JSON.stringify(payload, null, 2));
          }
          return;
        }
        throw error;
      }
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
    const payload = {
      ok: true,
      env: runtime.envName,
      kind: runtime.kind,
      dryRun: Boolean(flags['dry-run']),
      version,
      registryVersion,
      ...result,
    };

    if (flags.json) {
      this.log(JSON.stringify(payload, null, 2));
      return;
    }

    if (loadingStarted) {
      succeedTask(flags['dry-run'] ? 'Commercial plugin sync preview is ready.' : 'Commercial plugin sync completed.');
    }

    if (!flags.verbose) {
      const changes = [];
      if (result.installed.length > 0) {
        changes.push(pc.green(`${result.installed.length} installed`));
      }
      if (result.updated.length > 0) {
        changes.push(pc.cyan(`${result.updated.length} updated`));
      }
      if (result.removed.length > 0) {
        changes.push(pc.yellow(`${result.removed.length} removed`));
      }
      if (result.skipped.length > 0) {
        changes.push(pc.dim(`${result.skipped.length} skipped`));
      }
      if (changes.length === 0) {
        changes.push(pc.dim('no plugin changes'));
      }
      this.log(`Result: ${changes.join(', ')}`);
    } else {
      this.log(
        `Summary: ${result.installed.length} installed, ${result.updated.length} updated, ${result.removed.length} removed, ${result.skipped.length} skipped, ${result.warnings.length} warnings`,
      );
    }

    if (result.warnings.length > 0 && !flags.verbose) {
      for (const warning of result.warnings) {
        this.log(pc.yellow(`Warning: ${warning}`));
      }
    }
  }
}
