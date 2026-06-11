/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, loadHelpClass } from '@oclif/core';

export default class ProxyNginx extends Command {
  static override summary = 'Manage nginx proxy generation and runtime selection';
  static override examples = [
    '<%= config.bin %> proxy nginx current',
    '<%= config.bin %> proxy nginx use local',
    '<%= config.bin %> proxy nginx generate --env app1 --host app1.example.com',
    '<%= config.bin %> proxy nginx start',
    '<%= config.bin %> proxy nginx status',
    '<%= config.bin %> proxy nginx info',
  ];

  public async run(): Promise<void> {
    await this.parse(ProxyNginx);
    const Help = await loadHelpClass(this.config);
    await new Help(this.config, this.config.pjson.oclif.helpOptions ?? this.config.pjson.helpOptions).showHelp([
      this.id ?? 'proxy nginx',
      ...this.argv,
    ]);
  }
}
