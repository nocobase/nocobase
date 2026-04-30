/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import { listMigrationRules } from '../../../lib/publish.js';
import { renderTable } from '../../../lib/ui.js';

function formatValue(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return String(value);
}

function getUserRule(rule: any) {
  return rule?.rules?.userDefined?.globalRule;
}

function getSystemRule(rule: any) {
  return rule?.rules?.systemDefined?.globalRule;
}

export default class ReleaseMigrationRuleList extends Command {
  static override summary = 'List migration rules on a NocoBase environment';

  static override examples = [
    '<%= config.bin %> <%= command.id %> --env dev',
    '<%= config.bin %> <%= command.id %> --env dev --page-size 50 --json',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'NocoBase environment',
      required: true,
    }),
    page: Flags.integer({
      description: 'Page number',
    }),
    'page-size': Flags.integer({
      description: 'Page size',
      default: 20,
    }),
    json: Flags.boolean({
      description: 'Output JSON',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ReleaseMigrationRuleList);
    const rules = await listMigrationRules({
      env: flags.env,
      page: flags.page,
      pageSize: flags['page-size'],
    });

    if (flags.json) {
      this.log(JSON.stringify({
        env: flags.env,
        migrationRules: rules,
      }, null, 2));
      return;
    }

    if (!rules.length) {
      this.log(`No migration rules found on ${flags.env}.`);
      return;
    }

    this.log(renderTable(
      ['ID', 'Name', 'User Tables', 'System Tables', 'Updated At'],
      rules.map((rule) => [
        formatValue(rule.id),
        formatValue(rule.name),
        formatValue(getUserRule(rule)),
        formatValue(getSystemRule(rule)),
        formatValue(rule.updatedAt || rule.createdAt),
      ]),
    ));
  }
}
