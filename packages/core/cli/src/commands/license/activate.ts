/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as p from '@clack/prompts';
import { Command, Flags } from '@oclif/core';
import { readFile } from 'node:fs/promises';
import {
  ensureInstanceId,
  licenseEnvFlag,
  licenseJsonFlag,
  licensePkgUrlFlag,
  redactLicenseKey,
  requireLicenseRuntime,
  resolveLicenseKeyFile,
  resolveLicenseServiceUrl,
  saveLicenseKey,
  sanitizeLicenseOutput,
  validateLicenseKey,
} from './shared.js';
import { isInteractiveTerminal } from '../../lib/ui.js';
import { appUrl } from '../env/shared.js';

type ActivationMode = 'key' | 'online' | 'cancel';
type OnlineActivationAnswers = {
  account: string;
  password: string;
  appName: string;
  confirmed: boolean;
  serviceUrl: string;
};

function resolveOnlineInputValue(value: unknown): string {
  return String(value ?? '').trim();
}

async function promptActivationMode(): Promise<ActivationMode> {
  const answer = await p.select<ActivationMode>({
    message: 'How do you want to activate the license?',
    options: [
      { value: 'key', label: 'Use an existing license key' },
      { value: 'online', label: 'Request and activate a license online' },
      { value: 'cancel', label: 'Cancel' },
    ],
    initialValue: 'key',
  });
  if (p.isCancel(answer)) {
    p.cancel('License activation cancelled.');
    return 'cancel';
  }
  return answer;
}

async function promptLicenseKeyInput(): Promise<{ key?: string; keyFile?: string }> {
  const answer = await p.select<'key' | 'file'>({
    message: 'How do you want to provide the license key?',
    options: [
      { value: 'key', label: 'Paste the license key' },
      { value: 'file', label: 'Read the key from a file' },
    ],
    initialValue: 'key',
  });
  if (p.isCancel(answer)) {
    p.cancel('License activation cancelled.');
    return {};
  }

  if (answer === 'key') {
    const key = await p.text({
      message: 'License key',
      validate: (value) => String(value ?? '').trim() ? undefined : 'License key is required.',
    });
    if (p.isCancel(key)) {
      p.cancel('License activation cancelled.');
      return {};
    }
    return { key: String(key ?? '').trim() || undefined };
  }

  const keyFile = await p.text({
    message: 'Path to the license key file',
    validate: (value) => String(value ?? '').trim() ? undefined : 'License key file path is required.',
  });
  if (p.isCancel(keyFile)) {
    p.cancel('License activation cancelled.');
    return {};
  }
  return { keyFile: String(keyFile ?? '').trim() || undefined };
}

async function promptOnlineActivationInput(
  initial: Partial<OnlineActivationAnswers>,
): Promise<OnlineActivationAnswers | undefined> {
  let account = String(initial.account ?? '').trim();
  if (!account) {
    const answer = await p.text({
      message: 'Service account',
      validate: (value) => String(value ?? '').trim() ? undefined : 'Service account is required.',
    });
    if (p.isCancel(answer)) {
      p.cancel('License activation cancelled.');
      return;
    }
    account = String(answer ?? '').trim();
  }
  if (!account) {
    p.cancel('License activation cancelled.');
    return;
  }

  let password = String(initial.password ?? '').trim();
  if (!password) {
    const answer = await p.password({
      message: 'Service password',
      validate: (value) => String(value ?? '').trim() ? undefined : 'Service password is required.',
    });
    if (p.isCancel(answer)) {
      p.cancel('License activation cancelled.');
      return;
    }
    password = String(answer ?? '').trim();
  }
  if (!password) {
    p.cancel('License activation cancelled.');
    return;
  }

  let appName = String(initial.appName ?? '').trim();
  if (!appName) {
    const answer = await p.text({
      message: 'Application name',
      validate: (value) => String(value ?? '').trim() ? undefined : 'Application name is required.',
    });
    if (p.isCancel(answer)) {
      p.cancel('License activation cancelled.');
      return;
    }
    appName = String(answer ?? '').trim();
  }
  if (!appName) {
    p.cancel('License activation cancelled.');
    return;
  }

  const confirmedAnswer = typeof initial.confirmed === 'boolean'
    ? initial.confirmed
    : await p.confirm({
      message: 'Confirm that the submitted license information is true and accurate?',
      initialValue: false,
    });
  if (p.isCancel(confirmedAnswer)) {
    p.cancel('License activation cancelled.');
    return;
  }

  return {
    account,
    password,
    appName,
    confirmed: Boolean(confirmedAnswer),
    serviceUrl: resolveLicenseServiceUrl(initial.serviceUrl),
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
    '<%= config.bin %> <%= command.id %> --env app1 --online --account aa --password bb --desc test24 --yes',
    '<%= config.bin %> <%= command.id %> --env app1 --json --key-file ./license.txt',
  ];
  static override flags = {
    env: licenseEnvFlag,
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
    yes: Flags.boolean({
      description: 'Confirm that the submitted application information is true and accurate',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(LicenseActivate);
    const runtime = await requireLicenseRuntime(flags.env);
    let key = String(flags.key ?? '').trim();
    let keyFile = String(flags['key-file'] ?? '').trim();
    let online = Boolean(flags.online);

    if (!key && !keyFile && !online) {
      if (!isInteractiveTerminal()) {
        this.error('Provide --key, --key-file, or --online to continue.');
      }

      const mode = await promptActivationMode();
      if (mode === 'cancel') {
        this.log('Cancelled license activation.');
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
      const initialOnline = {
        account: resolveOnlineInputValue(flags.account),
        password: resolveOnlineInputValue(flags.password),
        appName: resolveOnlineInputValue(flags.desc),
        confirmed: flags.yes ? true : undefined,
        serviceUrl: resolveLicenseServiceUrl(flags['pkg-url']),
      };

      let onlineInput = initialOnline;
      if (
        !onlineInput.account
        || !onlineInput.password
        || !onlineInput.appName
        || !onlineInput.confirmed
      ) {
        if (!isInteractiveTerminal()) {
          this.error('Online activation requires --account, --password, --desc, and --yes when not using a TTY.');
        }

        const prompted = await promptOnlineActivationInput(initialOnline);
        if (!prompted) {
          this.log('Cancelled license activation.');
          return;
        }
        onlineInput = prompted;
      }

      if (!onlineInput.confirmed) {
        this.error('Online activation requires confirmation that the submitted application information is true and accurate.');
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
