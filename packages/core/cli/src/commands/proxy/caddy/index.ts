/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, loadHelpClass } from '@oclif/core';

export default class ProxyCaddy extends Command {
  static override summary = 'Manage caddy proxy generation and runtime selection';
  static override examples = [
    '<%= config.bin %> proxy caddy current',
    '<%= config.bin %> proxy caddy use local',
    '<%= config.bin %> proxy caddy generate --env app1 --host app1.example.com',
    '<%= config.bin %> proxy caddy start',
    '<%= config.bin %> proxy caddy status',
    '<%= config.bin %> proxy caddy info',
  ];

  public async run(): Promise<void> {
    await this.parse(ProxyCaddy);
    const Help = await loadHelpClass(this.config);
    await new Help(this.config, this.config.pjson.oclif.helpOptions ?? this.config.pjson.helpOptions).showHelp([
      this.id ?? 'proxy caddy',
      ...this.argv,
    ]);
  }
}
