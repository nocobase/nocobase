/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { licenseEnvFlag, licenseJsonFlag, requireLicenseRuntime } from '../shared.js';
import { syncLicensedPlugins } from './shared.js';
import { renderTable } from '../../../lib/ui.js';

export default class LicensePluginsSync extends Command {
  static override summary = 'Synchronize commercial plugins for the selected env';
  static override description =
    'Synchronize the commercial plugins allowed by the current saved license key.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --env app1',
    '<%= config.bin %> <%= command.id %> --env app1 --dry-run',
    '<%= config.bin %> <%= command.id %> --env app1 --json',
  ];
  static override flags = {
    env: licenseEnvFlag,
    json: licenseJsonFlag,
    'dry-run': Flags.boolean({
      description: 'Preview plugin changes without installing, upgrading, or removing anything',
      default: false,
    }),
    version: Flags.string({
      description: 'Registry version or dist-tag to synchronize. Defaults to the current workspace version.',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(LicensePluginsSync);
    const runtime = await requireLicenseRuntime(flags.env);
    const version = String(flags.version ?? this.config.pjson.version ?? 'latest').trim() || 'latest';
    const result = await syncLicensedPlugins(runtime, {
      version,
      dryRun: Boolean(flags['dry-run']),
    });
    const payload = {
      ok: true,
      env: runtime.envName,
      kind: runtime.kind,
      dryRun: Boolean(flags['dry-run']),
      version,
      ...result,
    };

    if (flags.json) {
      this.log(JSON.stringify(payload, null, 2));
      return;
    }

    this.log(
      flags['dry-run']
        ? `Commercial plugin sync preview for env "${runtime.envName}"`
        : `Commercial plugin sync for env "${runtime.envName}"`,
    );
    this.log(`Plugin storage path: ${result.storagePath}`);
    this.log(renderTable(
      ['Action', 'Packages'],
      [
        ['install', result.installed.join(', ') || '-'],
        ['update', result.updated.join(', ') || '-'],
        ['remove', result.removed.join(', ') || '-'],
        ['skip', result.skipped.join(', ') || '-'],
      ],
    ));
    for (const detail of result.details) {
      this.log(`${detail.action}: ${detail.packageName} -> ${detail.outputDir}`);
    }
    for (const warning of result.warnings) {
      this.log(`Warning: ${warning}`);
    }
  }
}
