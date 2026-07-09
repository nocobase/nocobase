/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';

const TASK_TEMPLATES_TABLE = 'ag_task_templates';
const SCENARIO_COLUMNS = ['scenario'];

type TableReference = string | { tableName?: string; schema?: string };
type TableColumns = Record<string, unknown>;

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<2.1.15';

  async up() {
    const columns = await this.describeTable(TASK_TEMPLATES_TABLE);
    if (!columns) {
      return;
    }

    for (const column of SCENARIO_COLUMNS) {
      if (Object.prototype.hasOwnProperty.call(columns, column)) {
        await this.queryInterface.removeColumn(TASK_TEMPLATES_TABLE, column);
      }
    }
  }

  private async tableExists(tableName: string) {
    const tables = (await this.queryInterface.showAllTables()) as TableReference[];
    return tables.some((table) => {
      if (typeof table === 'string') {
        return table === tableName;
      }
      return table.tableName === tableName;
    });
  }

  private async describeTable(tableName: string): Promise<TableColumns | null> {
    if (!(await this.tableExists(tableName))) {
      return null;
    }
    return (await this.queryInterface.describeTable(tableName)) as TableColumns;
  }
}
