/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../../lib/env-guard.js';
import {
  createLicenseEnvFlag,
  licenseJsonFlag,
  licensePkgUrlFlag,
  licenseYesFlag,
  requireLicenseRuntime,
} from '../shared.js';
import { fetchLicensedPluginPackages } from './shared.js';
import { renderTable } from '../../../lib/ui.js';

export default class LicensePluginsList extends Command {
  static override summary = 'List commercial plugins available to the selected env';
  static override description =
    'Show the commercial plugins associated with the current saved license key for the selected env.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --json',
  ];
  static override flags = {
    env: createLicenseEnvFlag('CLI env name to inspect licensed plugins for. Defaults to the current env when omitted'),
    json: licenseJsonFlag,
    'pkg-url': licensePkgUrlFlag,
    yes: licenseYesFlag,
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(LicensePluginsList);
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
    const { commercialPlugins, licensedPlugins } = await fetchLicensedPluginPackages(runtime, {
      pkgUrl: flags['pkg-url'],
    });
    const payload = {
      ok: true,
      env: runtime.envName,
      kind: runtime.kind,
      commercialPlugins,
      licensedPlugins,
    };

    if (flags.json) {
      this.log(JSON.stringify(payload, null, 2));
      return;
    }

    const rows = commercialPlugins.map((pluginName) => [
      pluginName,
      licensedPlugins.includes(pluginName) ? 'licensed' : 'unlicensed',
    ]);
    this.log(`Commercial plugins for env "${runtime.envName}"`);
    this.log(renderTable(['Package', 'Status'], rows));
  }
}
