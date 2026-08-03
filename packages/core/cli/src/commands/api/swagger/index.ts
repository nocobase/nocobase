/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, loadHelpClass } from '@oclif/core';

export default class Swagger extends Command {
  static summary = 'Inspect the current NocoBase OpenAPI documentation';

  async run(): Promise<void> {
    await this.parse(Swagger);
    const Help = await loadHelpClass(this.config);
    await new Help(this.config, this.config.pjson.oclif.helpOptions ?? this.config.pjson.helpOptions).showHelp([
      this.id ?? 'api:swagger',
      ...this.argv,
    ]);
  }
}
