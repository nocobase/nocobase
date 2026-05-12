/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { input, password as promptPassword, select } from '@inquirer/prompts';
import { Command, Flags } from '@oclif/core';
import { readFile } from 'node:fs/promises';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../lib/env-guard.js';
import {
  createLicenseEnvFlag,
  ensureInstanceId,
  licenseJsonFlag,
  licensePkgUrlFlag,
  licenseYesFlag,
  redactLicenseKey,
  requireLicenseRuntime,
  resolveLicenseKeyFile,
  resolveLicenseServiceUrl,
  saveLicenseKey,
  sanitizeLicenseOutput,
  validateLicenseKey,
} from './shared.js';
import { announceTargetEnv, isInteractiveTerminal } from '../../lib/ui.js';
import { appUrl } from '../env/shared.js';

type ActivationMode = 'key' | 'online' | 'cancel';
type OnlineActivationAnswers = {
  account: string;
  password: string;
  appName: string;
  serviceUrl: string;
};

function resolveOnlineInputValue(value: unknown): string {
  return String(value ?? '').trim();
}

async function promptActivationMode(): Promise<ActivationMode> {
  try {
    return await select<ActivationMode>({
      message: 'How do you want to activate the license?',
      choices: [
        { value: 'key', name: 'Use an existing license key' },
        { value: 'online', name: 'Request and activate a license online' },
        { value: 'cancel', name: 'Cancel' },
      ],
      default: 'key',
    });
  } catch {
    return 'cancel';
  }
}

async function promptLicenseKeyInput(): Promise<{ key?: string; keyFile?: string }> {
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
    return {};
  }

  if (answer === 'key') {
    try {
      const key = await input({
        message: 'License key',
        validate: (value) => String(value ?? '').trim() ? true : 'License key is required.',
      });
      return { key: String(key ?? '').trim() || undefined };
    } catch {
      return {};
    }
  }

  try {
    const keyFile = await input({
      message: 'Path to the license key file',
      validate: (value) => String(value ?? '').trim() ? true : 'License key file path is required.',
    });
    return { keyFile: String(keyFile ?? '').trim() || undefined };
  } catch {
    return {};
  }
}

async function promptOnlineActivationInput(
  initial: Partial<OnlineActivationAnswers>,
): Promise<OnlineActivationAnswers | undefined> {
  let account = String(initial.account ?? '').trim();
  if (!account) {
    try {
      const answer = await input({
        message: 'Service account',
        validate: (value) => String(value ?? '').trim() ? true : 'Service account is required.',
      });
      account = String(answer ?? '').trim();
    } catch {
      return;
    }
  }
  if (!account) {
    return;
  }

  let password = String(initial.password ?? '').trim();
  if (!password) {
    try {
      const answer = await promptPassword({
        message: 'Service password',
        validate: (value) => String(value ?? '').trim() ? true : 'Service password is required.',
      });
      password = String(answer ?? '').trim();
    } catch {
      return;
    }
  }
  if (!password) {
    return;
  }

  let appName = String(initial.appName ?? '').trim();
  if (!appName) {
    try {
      const answer = await input({
        message: 'Application name',
        validate: (value) => String(value ?? '').trim() ? true : 'Application name is required.',
      });
      appName = String(answer ?? '').trim();
    } catch {
      return;
    }
  }
  if (!appName) {
    return;
  }

  return {
    account,
    password,
    appName,
    serviceUrl: await resolveLicenseServiceUrl(initial.serviceUrl),
  };
}

function resolveAppUrlOrThrow(runtime: Awaited<ReturnType<typeof requireLicenseRuntime>>): string {
  const currentAppUrl = appUrl(runtime);
  if (!currentAppUrl) {
    throw new Error(`Env "${runtime.envName}" does not have an app URL or app port configured.`);
  }

  try {
    return new URL(currentAppUrl).toString();
  } catch {
    throw new Error(`Env "${runtime.envName}" has an invalid app URL: ${currentAppUrl}`);
  }
}

async function requestOnlineLicenseKey(
  serviceUrl: string,
  account: string,
  password: string,
  payload: {
    appUrl: string;
    appName: string;
    instanceId: string;
    type: 'internal';
  },
): Promise<string> {
  const response = await fetch(`${serviceUrl}/license-key`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      account,
      password,
      appUrl: payload.appUrl,
      appName: payload.appName,
      instanceId: payload.instanceId,
      type: payload.type,
    }),
  });
  if (!response.ok) {
    throw new Error(`License service request failed with status ${response.status}.`);
  }
  const data = await response.json();

  const key = String(data?.data?.key ?? '').trim();
  if (!key) {
    throw new Error('License service did not return a license key.');
  }
  return key;
}

export default class LicenseActivate extends Command {
  static override summary = 'Activate commercial licensing for the selected env';
  static override description =
    'Activate a commercial license for the selected env. Provide an existing license key directly, or use `--online` to request and activate one from the online license service.';
  static override examples = [
    '<%= config.bin %> <%= command.id %> --env app1 --key <licenseKey>',
    '<%= config.bin %> <%= command.id %> --env app1 --key-file ./license.txt',
    '<%= config.bin %> <%= command.id %> --env app1 --online',
    '<%= config.bin %> <%= command.id %> --env app1 --online --account aa --password bb --desc test24',
    '<%= config.bin %> <%= command.id %> --env app1 --online --account aa --password bb --desc test24 --yes',
    '<%= config.bin %> <%= command.id %> --env app1 --json --key-file ./license.txt',
  ];
  static override flags = {
    env: createLicenseEnvFlag('CLI env name to activate a license for. Defaults to the current env when omitted'),
    json: licenseJsonFlag,
    key: Flags.string({
      description: 'Existing license key to activate',
    }),
    'key-file': Flags.string({
      description: 'Path to a file containing the license key to activate',
    }),
    online: Flags.boolean({
      description: 'Request a license online and activate it',
      default: false,
    }),
    account: Flags.string({
      description: 'License service account for online activation',
    }),
    password: Flags.string({
      description: 'License service password for online activation',
    }),
    desc: Flags.string({
      description: 'Application name for online activation',
    }),
    'pkg-url': licensePkgUrlFlag,
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
    let online = Boolean(flags.online);

    if (!key && !keyFile && !online) {
      if (!isInteractiveTerminal()) {
        this.error('Provide --key, --key-file, or --online to continue.');
      }

      const mode = await promptActivationMode();
      if (mode === 'cancel') {
        return;
      }

      if (mode === 'online') {
        online = true;
      } else {
        const prompted = await promptLicenseKeyInput();
        key = String(prompted.key ?? '').trim();
        keyFile = String(prompted.keyFile ?? '').trim();
        if (!key && !keyFile) {
          this.error('License key input was empty.');
        }
      }
    }

    if ((key || keyFile) && online) {
      this.error('Use either an existing key (--key / --key-file) or --online, not both.');
    }

    if (online) {
      const resolvedServiceUrl = await resolveLicenseServiceUrl(flags['pkg-url']);
      const initialOnline = {
        account: resolveOnlineInputValue(flags.account),
        password: resolveOnlineInputValue(flags.password),
        appName: resolveOnlineInputValue(flags.desc),
        serviceUrl: resolvedServiceUrl,
      };

      let onlineInput = initialOnline;
      if (
        !onlineInput.account
        || !onlineInput.password
        || !onlineInput.appName
      ) {
        if (!isInteractiveTerminal()) {
          this.error('Online activation requires --account, --password, and --desc when not using a TTY.');
        }

        const prompted = await promptOnlineActivationInput(initialOnline);
        if (!prompted) {
          return;
        }
        onlineInput = prompted;
      }

      const instanceId = await ensureInstanceId(runtime);
      const resolvedAppUrl = resolveAppUrlOrThrow(runtime);
      const resolvedKey = await requestOnlineLicenseKey(
        onlineInput.serviceUrl,
        onlineInput.account,
        onlineInput.password,
        {
          appUrl: resolvedAppUrl,
          appName: onlineInput.appName,
          instanceId,
          type: 'internal',
        },
      );
      const validation = await validateLicenseKey(runtime, resolvedKey);
      const ok =
        !validation.keyStatus
        && validation.envMatch
        && validation.domainMatch
        && validation.licenseStatus === 'active';
      const licenseKeyPath = ok ? await saveLicenseKey(runtime, resolvedKey) : resolveLicenseKeyFile(runtime);
      const payload = {
        ok,
        env: runtime.envName,
        kind: runtime.kind,
        instanceId,
        mode: 'online',
        serviceUrl: onlineInput.serviceUrl,
        appUrl: resolvedAppUrl,
        appName: onlineInput.appName,
        key: redactLicenseKey(resolvedKey),
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
        this.error(`Failed to activate the online license for env "${runtime.envName}": ${reason}.`);
      }

      this.log(`Activated the online license for env "${runtime.envName}".`);
      this.log(`Saved license key at ${licenseKeyPath}`);
      return;
    }

    const resolvedKey = key || String(await readFile(keyFile, 'utf8')).trim();
    const validation = await validateLicenseKey(runtime, resolvedKey);
    const ok =
      !validation.keyStatus
      && validation.envMatch
      && validation.domainMatch
      && validation.licenseStatus === 'active';
    const licenseKeyPath = ok ? await saveLicenseKey(runtime, resolvedKey) : resolveLicenseKeyFile(runtime);

    const payload = {
      ok,
      env: runtime.envName,
      kind: runtime.kind,
      instanceId: await ensureInstanceId(runtime),
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
