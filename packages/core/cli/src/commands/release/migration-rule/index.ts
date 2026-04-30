/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, loadHelpClass } from '@oclif/core';

export default class ReleaseMigrationRule extends Command {
  static override summary = 'List, inspect, and create migration rules for publish files';

  async run(): Promise<void> {
    await this.parse(ReleaseMigrationRule);
    const Help = await loadHelpClass(this.config);
    await new Help(this.config, this.config.pjson.oclif.helpOptions ?? this.config.pjson.helpOptions).showHelp([
      this.id ?? 'release:migration-rule',
      ...this.argv,
    ]);
  }
}
