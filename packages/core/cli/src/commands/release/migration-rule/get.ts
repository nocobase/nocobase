/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { getMigrationRule } from '../../../lib/publish.js';
import { renderTable } from '../../../lib/ui.js';

function formatValue(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return String(value);
}

export default class ReleaseMigrationRuleGet extends Command {
  static override summary = 'Get one migration rule by ID';

  static override examples = [
    '<%= config.bin %> <%= command.id %> --env dev --id <ruleId>',
    '<%= config.bin %> <%= command.id %> --env dev --id <ruleId> --json',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'NocoBase environment',
      required: true,
    }),
    id: Flags.string({
      description: 'Migration rule ID',
      required: true,
    }),
    json: Flags.boolean({
      description: 'Output JSON',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ReleaseMigrationRuleGet);
    const rule = await getMigrationRule({
      env: flags.env,
      id: flags.id,
    });

    if (flags.json) {
      this.log(JSON.stringify(rule, null, 2));
      return;
    }

    this.log(renderTable(
      ['Field', 'Value'],
      [
        ['ID', formatValue(rule.id)],
        ['Name', formatValue(rule.name)],
        ['Description', formatValue(rule.description)],
        ['User Tables', formatValue(rule.rules?.userDefined?.globalRule)],
        ['System Tables', formatValue(rule.rules?.systemDefined?.globalRule)],
        ['Created At', formatValue(rule.createdAt)],
        ['Updated At', formatValue(rule.updatedAt)],
      ],
    ));
  }
}
