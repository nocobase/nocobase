/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import {
  ensureInstanceId,
  licenseEnvFlag,
  licenseJsonFlag,
  readSavedInstanceId,
  requireLicenseRuntime,
  resolveInstanceIdFile,
} from './shared.js';

export default class LicenseId extends Command {
  static override summary = 'Show the instance ID used for commercial license activation';
  static override description =
    'Resolve the selected env, generate the commercial licensing instance ID when needed, and save it under `storage/.license/instance-id`.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --force',
    '<%= config.bin %> <%= command.id %> --env app1 --json',
  ];
  static override flags = {
    env: licenseEnvFlag,
    json: licenseJsonFlag,
    force: Flags.boolean({
      description: 'Force regenerate the instance ID even if one is already saved',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(LicenseId);
    const runtime = await requireLicenseRuntime(flags.env);
    const savedBefore = await readSavedInstanceId(runtime);
    const instanceId = await ensureInstanceId(runtime, { force: Boolean(flags.force) });
    const filePath = resolveInstanceIdFile(runtime);
    const generated = Boolean(flags.force) || !savedBefore;

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
