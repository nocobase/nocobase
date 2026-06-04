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
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../lib/env-guard.js';
import { input, password as promptPassword, select } from '../../lib/inquirer.ts';
import {
  createLicenseEnvFlag,
  ensureInstanceId,
  licenseJsonFlag,
  licenseYesFlag,
  redactLicenseKey,
  requireLicenseRuntime,
  resolveLicenseKeyFile,
  saveLicenseKey,
  sanitizeLicenseOutput,
  validateLicenseKey,
} from './shared.js';
import { announceTargetEnv, isInteractiveTerminal } from '../../lib/ui.js';
import { appUrl } from '../env/shared.js';

function resolveHostnameNoticeValue(runtime: Awaited<ReturnType<typeof requireLicenseRuntime>>): string | undefined {
  const currentAppUrl = String(appUrl(runtime) ?? '').trim();
  if (!currentAppUrl) {
    return;
  }

  try {
    const url = new URL(currentAppUrl);
    return url.host || undefined;
  } catch {
    return currentAppUrl;
  }
}

function formatInstanceIdNotice(instanceId: string, hostname?: string): string {
  return [
    '',
    ...(hostname ? [pc.cyan(pc.bold('❯ Hostname')), `  ${pc.bold(hostname)}`, ''] : []),
    pc.cyan(pc.bold('❯ Instance ID')),
    `  ${pc.bold(instanceId)}`,
    pc.dim(`  Copy this ${hostname ? 'hostname and ' : ''}instance ID when checking or activating the license key.`),
    '',
  ].join('\n');
}

async function promptLicenseKeyInput(): Promise<{ key?: string; keyFile?: string } | undefined> {
  let answer: 'key' | 'file';
  try {
    answer = await select<'key' | 'file'>({
      message: 'How do you want to provide the license key?',
      choices: [
        { value: 'key', name: 'Paste the license key' },
        { value: 'file', name: 'Read the key from a file' },
      ],
      default: 'key',
    });
  } catch {
    return;
  }

  if (answer === 'key') {
    try {
      const key = await promptPassword({
        message: 'License key',
        mask: false,
        transformer: (value) => `Entered ${value.length} chars`,
        validate: (value) => (String(value ?? '').trim() ? true : 'License key is required.'),
      });
      return { key: String(key ?? '').trim() || undefined };
    } catch {
      return;
    }
  }

  try {
    const keyFile = await input({
      message: 'Path to the license key file',
      validate: (value) => (String(value ?? '').trim() ? true : 'License key file path is required.'),
    });
    return { keyFile: String(keyFile ?? '').trim() || undefined };
  } catch {
    return;
  }
}

export default class LicenseActivate extends Command {
  static override summary = 'Activate an existing commercial license key for the selected env';
  static override description = 'Activate an existing commercial license key for the selected env.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1 --key <licenseKey>',
    '<%= config.bin %> <%= command.id %> --env app1 --key-file ./license.txt',
    '<%= config.bin %> <%= command.id %> --env app1 --json --key-file ./license.txt',
  ];
  static override flags = {
    env: createLicenseEnvFlag('CLI env name to activate a license for. Defaults to the current env when omitted'),
    json: licenseJsonFlag,
    key: Flags.string({
      description: 'Existing commercial license key to activate',
    }),
    'key-file': Flags.string({
      description: 'Path to a file containing the existing commercial license key to activate',
    }),
    yes: licenseYesFlag,
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(LicenseActivate);
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
    let key = String(flags.key ?? '').trim();
    let keyFile = String(flags['key-file'] ?? '').trim();
    let interactiveKeyFlowInstanceId: string | undefined;

    if (!key && !keyFile) {
      if (!isInteractiveTerminal()) {
        this.error('Provide --key or --key-file to continue.');
      }

      interactiveKeyFlowInstanceId = await ensureInstanceId(runtime);
      const hostname = resolveHostnameNoticeValue(runtime);
      this.log(formatInstanceIdNotice(interactiveKeyFlowInstanceId, hostname));
      const prompted = await promptLicenseKeyInput();
      if (!prompted) {
        return;
      }
      key = String(prompted.key ?? '').trim();
      keyFile = String(prompted.keyFile ?? '').trim();
      if (!key && !keyFile) {
        this.error('License key input was empty.');
      }
    }

    const resolvedKey = key || String(await readFile(keyFile, 'utf8')).trim();
    const validation = await validateLicenseKey(runtime, resolvedKey);
    const ok =
      !validation.keyStatus && validation.envMatch && validation.domainMatch && validation.licenseStatus === 'active';
    const licenseKeyPath = ok ? await saveLicenseKey(runtime, resolvedKey) : resolveLicenseKeyFile(runtime);

    const payload = {
      ok,
      env: runtime.envName,
      kind: runtime.kind,
      instanceId: interactiveKeyFlowInstanceId ?? (await ensureInstanceId(runtime)),
      mode: 'key',
      key: redactLicenseKey(resolvedKey),
      keyFile: keyFile || undefined,
      licenseKeyPath,
      validation: sanitizeLicenseOutput(validation),
    };

    if (flags.json) {
      this.log(JSON.stringify(payload, null, 2));
      if (!ok) {
        this.exit(1);
      }
      return;
    }

    if (!ok) {
      const reason = validation.keyStatus
        ? `license key is ${validation.keyStatus}`
        : !validation.envMatch
          ? 'license key does not match the current instance environment'
          : !validation.domainMatch
            ? 'license key does not match the current app domain'
            : validation.licenseStatus !== 'active'
              ? `license status is ${validation.licenseStatus}`
              : 'license validation failed';
      this.error(`Failed to activate the license for env "${runtime.envName}": ${reason}.`);
    }

    this.log(`Activated the license for env "${runtime.envName}".`);
    this.log(`Saved license key at ${licenseKeyPath}`);
  }
}
