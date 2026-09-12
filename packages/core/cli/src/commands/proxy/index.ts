/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, loadHelpClass } from '@oclif/core';

export default class Proxy extends Command {
  static override summary = 'Manage reverse proxy providers for CLI-managed apps';
  static override description = 'Use `nb proxy nginx` or `nb proxy caddy` to manage reverse proxy workflows.';
  static override examples = [
    '<%= config.bin %> proxy nginx current',
    '<%= config.bin %> proxy nginx use docker',
    '<%= config.bin %> proxy nginx generate --env app1 --host app1.example.com',
    '<%= config.bin %> proxy caddy current',
    '<%= config.bin %> proxy caddy use docker',
  ];

  public async run(): Promise<void> {
    await this.parse(Proxy);
    const Help = await loadHelpClass(this.config);
    await new Help(this.config, this.config.pjson.oclif.helpOptions ?? this.config.pjson.helpOptions).showHelp([
      this.id ?? 'proxy',
      ...this.argv,
    ]);
  }
}
