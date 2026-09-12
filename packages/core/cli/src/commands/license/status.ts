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
import { createLicenseEnvFlag, ensureInstanceId, licenseJsonFlag, licenseYesFlag, requireLicenseRuntime } from './shared.js';

export default class LicenseStatus extends Command {
  static override summary = 'Show commercial license status for the selected env';
  static override description =
    'Inspect the selected env and show the current commercial licensing status. Use `--doctor` for extra diagnostic checks once the license backend wiring is implemented.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --doctor',
    '<%= config.bin %> <%= command.id %> --env app1 --json',
  ];
  static override flags = {
    env: createLicenseEnvFlag('CLI env name to inspect. Defaults to the current env when omitted'),
    json: licenseJsonFlag,
    yes: licenseYesFlag,
    doctor: Flags.boolean({
      description: 'Run extra diagnostic checks and suggestions',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(LicenseStatus);
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
    const payload = {
      ok: true,
      env: runtime.envName,
      kind: runtime.kind,
      instanceId: await ensureInstanceId(runtime),
      licensed: false,
      doctor: Boolean(flags.doctor),
      implemented: false,
      message: 'Commercial license status is not implemented yet in the new CLI.',
    };

    if (flags.json) {
      this.log(JSON.stringify(payload, null, 2));
      return;
    }

    this.log(`License status for env "${runtime.envName}": not implemented yet`);
    if (flags.doctor) {
      this.log('Diagnostic checks for commercial licensing are not implemented yet in the new CLI.');
    }
  }
}
