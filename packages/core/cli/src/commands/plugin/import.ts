/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import { formatMissingManagedAppEnvMessage, resolveManagedAppRuntime } from '../../lib/app-runtime.js';
import { ensureCrossEnvConfirmed, hasExplicitEnvSelection } from '../../lib/env-guard.js';
import { importPluginSource } from '../../lib/plugin-import.js';
import { announceTargetEnv } from '../../lib/ui.js';

export default class PluginImport extends Command {
  static override hidden = false;
  static override args = {
    archive: Args.string({
      required: true,
      description: 'Plugin source to import. Accepts a local .tgz path, a remote http(s) URL, or an npm package spec.',
    }),
  };

  static override summary = 'Import a packaged plugin into storage/plugins for the selected env';
  static override description =
    'Download or read a packaged plugin source and extract it into the selected env storage/plugins directory without enabling it.';
  static override examples = [
    '<%= config.bin %> <%= command.id %> https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz',
    '<%= config.bin %> <%= command.id %> /your/path/plugin-auth-cas-1.4.0.tgz',
    '<%= config.bin %> <%= command.id %> @nocobase/plugin-acl@beta',
    '<%= config.bin %> <%= command.id %> @nocobase/plugin-acl@beta --npm-registry=https://registry.npmjs.org',
    '<%= config.bin %> <%= command.id %> --env app1 ./plugin-auth-cas-1.4.0.tgz',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'CLI env name to import the plugin into. Defaults to the current env when omitted',
    }),
    yes: Flags.boolean({
      char: 'y',
      description: 'Confirm using --env when it targets a different env than the current env',
      default: false,
    }),
    'npm-registry': Flags.string({
      description: 'npm registry to use when the import source is an npm package spec.',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(PluginImport);
    const requestedEnv = flags.env?.trim() || undefined;
    const explicitEnvSelection = Boolean(requestedEnv && hasExplicitEnvSelection(this.argv));
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

    const archiveSource = args.archive?.trim();
    if (!archiveSource) {
      this.error('Pass a plugin archive path, URL, or npm package spec.');
    }

    const runtime = await resolveManagedAppRuntime(requestedEnv);
    if (!runtime) {
      this.error(formatMissingManagedAppEnvMessage(requestedEnv));
    }

    if (runtime.kind === 'http') {
      this.error(
        [
          `Can't import plugins for "${runtime.envName}" yet.`,
          'HTTP envs do not expose a writable storage/plugins path to the CLI.',
          'Use a local or Docker env for plugin imports right now.',
        ].join('\n'),
      );
    }

    if (runtime.kind === 'ssh') {
      this.error(
        [
          `Can't import plugins for "${runtime.envName}" yet.`,
          'SSH env support is reserved but not implemented yet.',
          'Use a local or Docker env for plugin imports right now.',
        ].join('\n'),
      );
    }

    announceTargetEnv(runtime.envName);

    const npmRegistry =
      flags['npm-registry']?.trim() || String(runtime.env.config.npmRegistry ?? '').trim() || undefined;
    const result = await importPluginSource(archiveSource, {
      storagePath: runtime.env.storagePath,
      npmRegistry,
    });
    const label = result.action === 'updated' ? 'Updated' : 'Imported';
    const versionSuffix = result.packageVersion ? `@${result.packageVersion}` : '';

    this.log(`${label} ${result.packageName}${versionSuffix} into ${result.outputDir}`);
    this.log(`Plugin storage path: ${result.storagePluginsPath}`);
    this.log(`Restart the app before enabling or using the plugin: \`nb app restart --env ${runtime.envName}\`.`);
  }
}
