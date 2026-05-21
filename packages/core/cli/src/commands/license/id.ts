/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../lib/env-guard.js';
import {
  createLicenseEnvFlag,
  generateAndSaveInstanceId,
  licenseJsonFlag,
  licenseYesFlag,
  readSavedInstanceId,
  requireLicenseRuntime,
  resolveInstanceIdFile,
} from './shared.js';
import { announceTargetEnv } from '../../lib/ui.js';

export default class LicenseId extends Command {
  static override summary = 'Show the instance ID for the selected env';
  static override description =
    'Show the commercial licensing instance ID for the selected env, generating and saving it if needed.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --force',
    '<%= config.bin %> <%= command.id %> --env app1 --json',
  ];
  static override flags = {
    env: createLicenseEnvFlag('CLI env name to inspect. Defaults to the current env when omitted'),
    json: licenseJsonFlag,
    yes: licenseYesFlag,
    force: Flags.boolean({
      description: 'Force regenerate the instance ID even if one is already saved',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(LicenseId);
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
    const savedBefore = await readSavedInstanceId(runtime);
    const shouldGenerate = Boolean(flags.force) || !savedBefore;
    const instanceId = shouldGenerate
      ? await generateAndSaveInstanceId(runtime)
      : savedBefore!;
    const filePath = resolveInstanceIdFile(runtime);
    const generated = shouldGenerate;

    if (flags.json) {
      this.log(JSON.stringify({
        ok: true,
        env: runtime.envName,
        kind: runtime.kind,
        instanceId,
        filePath,
        generated,
      }, null, 2));
      return;
    }

    this.log(`Instance ID for env "${runtime.envName}": ${instanceId}`);
    this.log(`${generated ? 'Saved' : 'Loaded'} instance ID at ${filePath}`);
  }
}
