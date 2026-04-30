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
  redactLicenseKey,
  requireLicenseRuntime,
  resolveLicenseKeyFile,
  saveLicenseKey,
  validateLicenseKey,
} from './shared.js';
import { isInteractiveTerminal } from '../../lib/ui.js';

type ActivationMode = 'key' | 'online' | 'cancel';

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

export default class LicenseActivate extends Command {
  static override summary = 'Activate commercial licensing for the selected env';
  static override description =
    'Activate a commercial license for the selected env. Provide an existing license key directly, or use `--online` to request and activate one when service integration is available.';
  static override examples = [
    '<%= config.bin %> <%= command.id %> --env app1 --key <licenseKey>',
    '<%= config.bin %> <%= command.id %> --env app1 --key-file ./license.txt',
    '<%= config.bin %> <%= command.id %> --env app1 --online',
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
      description: 'Request a license online and activate it when service integration is available',
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
      const payload = {
        ok: false,
        env: runtime.envName,
        kind: runtime.kind,
        instanceId: await ensureInstanceId(runtime),
        mode: 'online',
        implemented: false,
      };

      if (flags.json) {
        this.log(JSON.stringify(payload, null, 2));
        return;
      }

      this.log(`License activation for env "${runtime.envName}" will request a license online once service integration is implemented.`);
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
      validation,
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
