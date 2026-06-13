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
import { translateCli } from '../../lib/cli-locale.js';
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

const licenseActivateText = (key: string, values?: Record<string, unknown>, fallback?: string) =>
  translateCli(`commands.license.activate.${key}`, values, { fallback });

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
    ...(hostname
      ? [pc.cyan(pc.bold(licenseActivateText('interactive.notice.hostnameLabel'))), `  ${pc.bold(hostname)}`, '']
      : []),
    pc.cyan(pc.bold(licenseActivateText('interactive.notice.instanceIdLabel'))),
    `  ${pc.bold(instanceId)}`,
    pc.dim(
      `  ${licenseActivateText(
        hostname ? 'interactive.notice.copyHintWithHostname' : 'interactive.notice.copyHintWithoutHostname',
      )}`,
    ),
    '',
  ].join('\n');
}

async function promptLicenseKeyInput(): Promise<{ key?: string; keyFile?: string } | undefined> {
  let answer: 'key' | 'file';
  try {
    answer = await select<'key' | 'file'>({
      message: licenseActivateText('interactive.prompts.provideMethod.message'),
      choices: [
        { value: 'key', name: licenseActivateText('interactive.prompts.provideMethod.keyOption') },
        { value: 'file', name: licenseActivateText('interactive.prompts.provideMethod.fileOption') },
      ],
      default: 'key',
    });
  } catch {
    return;
  }

  if (answer === 'key') {
    try {
      const key = await promptPassword({
        message: licenseActivateText('interactive.prompts.key.message'),
        mask: false,
        transformer: (value) => licenseActivateText('interactive.prompts.key.transformer', { count: value.length }),
        validate: (value) =>
          String(value ?? '').trim() ? true : licenseActivateText('interactive.prompts.key.required'),
      });
      return { key: String(key ?? '').trim() || undefined };
    } catch {
      return;
    }
  }

  try {
    const keyFile = await input({
      message: licenseActivateText('interactive.prompts.keyFile.message'),
      validate: (value) =>
        String(value ?? '').trim() ? true : licenseActivateText('interactive.prompts.keyFile.required'),
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
        this.error(licenseActivateText('errors.provideKeyOrKeyFile'));
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
        this.error(licenseActivateText('errors.emptyInput'));
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
        ? licenseActivateText('errors.reasons.keyStatus', { status: validation.keyStatus })
        : !validation.envMatch
          ? licenseActivateText('errors.reasons.envMismatch')
          : !validation.domainMatch
            ? licenseActivateText('errors.reasons.domainMismatch')
            : validation.licenseStatus !== 'active'
              ? licenseActivateText('errors.reasons.licenseStatus', { status: validation.licenseStatus })
              : licenseActivateText('errors.reasons.validationFailed');
      this.error(licenseActivateText('errors.activationFailed', { envName: runtime.envName, reason }));
    }

    this.log(licenseActivateText('messages.activated', { envName: runtime.envName }));
    this.log(licenseActivateText('messages.savedLicenseKey'));
  }
}
