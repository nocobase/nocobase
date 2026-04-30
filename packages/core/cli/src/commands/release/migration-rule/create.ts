/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, Flags } from '@oclif/core';
import {
  assertSystemDefinedMigrationRule,
  assertUserDefinedMigrationRule,
  buildMigrationRuleValues,
  createMigrationRule,
  systemDefinedMigrationRuleOptions,
  userDefinedMigrationRuleOptions,
} from '../../../lib/publish.js';
import { failTask, startTask, succeedTask } from '../../../lib/ui.js';

export default class ReleaseMigrationRuleCreate extends Command {
  static override summary = 'Create a global migration rule for publish migration files';

  static override description = [
    'Create a migration rule with only global rules.',
    `User-defined table rules: ${userDefinedMigrationRuleOptions.join(', ')}.`,
    `System table rules: ${systemDefinedMigrationRuleOptions.join(', ')}.`,
  ].join('\n');

  static override examples = [
    '<%= config.bin %> <%= command.id %> --env dev --name dev-to-test --user-rule schema-only --system-rule overwrite-first',
    '<%= config.bin %> <%= command.id %> --env dev --name dev-to-test --user-rule overwrite --system-rule schema-only --json',
  ];

  static override flags = {
    env: Flags.string({
      char: 'e',
      description: 'NocoBase environment',
      required: true,
    }),
    name: Flags.string({
      description: 'Migration rule name',
      required: true,
    }),
    description: Flags.string({
      description: 'Migration rule description',
    }),
    'user-rule': Flags.string({
      description: `Global rule for user-defined tables. Options: ${userDefinedMigrationRuleOptions.join(', ')}`,
      options: [...userDefinedMigrationRuleOptions],
      default: 'schema-only',
    }),
    'system-rule': Flags.string({
      description: `Global rule for system tables. Options: ${systemDefinedMigrationRuleOptions.join(', ')}`,
      options: [...systemDefinedMigrationRuleOptions],
      default: 'overwrite-first',
    }),
    json: Flags.boolean({
      description: 'Output JSON',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ReleaseMigrationRuleCreate);
    const values = buildMigrationRuleValues({
      name: flags.name,
      description: flags.description,
      userRule: assertUserDefinedMigrationRule(flags['user-rule']),
      systemRule: assertSystemDefinedMigrationRule(flags['system-rule']),
    });

    startTask(`Creating migration rule ${flags.name} on ${flags.env}`);
    try {
      const rule = await createMigrationRule({
        env: flags.env,
        values,
      });

      succeedTask(`Created migration rule ${rule.name || flags.name}`);
      if (flags.json) {
        this.log(JSON.stringify(rule, null, 2));
        return;
      }

      this.log(`Rule ID: ${rule.id}`);
      this.log(`User-defined tables: ${values.rules.userDefined.globalRule}`);
      this.log(`System tables: ${values.rules.systemDefined.globalRule}`);
    } catch (error: any) {
      failTask('Release migration-rule create failed');
      this.error(error.message);
    }
  }
}
