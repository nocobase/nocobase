/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { QueryTypes } from 'sequelize';

const OLD_TEMPLATE_TABLE = 'ag_task_presets';
const NEW_TEMPLATE_TABLE = 'ag_task_templates';
const RUNS_TABLE = 'ag_runs';

const OLD_TEMPLATE_KEY_COLUMNS = ['preset_key', 'presetKey'];
const NEW_TEMPLATE_KEY_COLUMNS = ['template_key', 'templateKey'];
const OLD_RUN_TEMPLATE_COLUMNS = ['task_preset_id', 'taskPresetId'];
const NEW_RUN_TEMPLATE_COLUMNS = ['task_template_id', 'taskTemplateId'];

type TableReference = string | { tableName?: string; schema?: string };
type TableColumns = Record<string, unknown>;
type RowRecord = Record<string, unknown>;

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<2.1.15';

  async up() {
    await this.moveTaskTemplateRows();
    await this.moveRunTemplateReference();
    await this.dropOldTaskTemplateTable();
  }

  private async moveTaskTemplateRows() {
    const oldExists = await this.tableExists(OLD_TEMPLATE_TABLE);
    if (!oldExists) {
      await this.renameColumnIfNeeded(
        NEW_TEMPLATE_TABLE,
        OLD_TEMPLATE_KEY_COLUMNS,
        this.getExistingNewTemplateKeyColumn(),
      );
      return;
    }

    const newExists = await this.tableExists(NEW_TEMPLATE_TABLE);
    if (!newExists) {
      await this.queryInterface.renameTable(OLD_TEMPLATE_TABLE, NEW_TEMPLATE_TABLE);
      await this.renameColumnIfNeeded(
        NEW_TEMPLATE_TABLE,
        OLD_TEMPLATE_KEY_COLUMNS,
        this.getExistingNewTemplateKeyColumn(),
      );
      return;
    }

    await this.copyOldTaskTemplateRows();
  }

  private async copyOldTaskTemplateRows() {
    const oldColumns = await this.describeTable(OLD_TEMPLATE_TABLE);
    const newColumns = await this.describeTable(NEW_TEMPLATE_TABLE);
    if (!oldColumns || !newColumns) {
      return;
    }

    const oldTemplateKeyColumn = this.findColumn(oldColumns, OLD_TEMPLATE_KEY_COLUMNS);
    const newTemplateKeyColumn = this.findColumn(newColumns, NEW_TEMPLATE_KEY_COLUMNS);
    if (!oldTemplateKeyColumn || !newTemplateKeyColumn) {
      return;
    }

    const rows = await this.sequelize.query<RowRecord>(`SELECT * FROM ${this.quoteTable(OLD_TEMPLATE_TABLE)}`, {
      type: QueryTypes.SELECT,
    });
    for (const row of rows) {
      const id = typeof row.id === 'string' ? row.id : '';
      if (id && (await this.taskTemplateExists(id))) {
        continue;
      }

      const values: RowRecord = {};
      for (const [column, value] of Object.entries(row)) {
        const targetColumn = column === oldTemplateKeyColumn ? newTemplateKeyColumn : column;
        if (Object.prototype.hasOwnProperty.call(newColumns, targetColumn)) {
          values[targetColumn] = value;
        }
      }
      if (Object.keys(values).length) {
        await this.queryInterface.bulkInsert(NEW_TEMPLATE_TABLE, [values]);
      }
    }
  }

  private async moveRunTemplateReference() {
    const runsColumns = await this.describeTable(RUNS_TABLE);
    if (!runsColumns) {
      return;
    }

    const oldColumn = this.findColumn(runsColumns, OLD_RUN_TEMPLATE_COLUMNS);
    const newColumn = this.findColumn(runsColumns, NEW_RUN_TEMPLATE_COLUMNS) || this.getExistingNewRunTemplateColumn();
    if (!oldColumn) {
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(runsColumns, newColumn)) {
      await this.queryInterface.renameColumn(RUNS_TABLE, oldColumn, newColumn);
      return;
    }

    await this.sequelize.query(
      [
        `UPDATE ${this.quoteTable(RUNS_TABLE)}`,
        `SET ${this.quoteIdentifier(newColumn)} = ${this.quoteIdentifier(oldColumn)}`,
        `WHERE ${this.quoteIdentifier(newColumn)} IS NULL`,
        `AND ${this.quoteIdentifier(oldColumn)} IS NOT NULL`,
      ].join(' '),
    );
    await this.queryInterface.removeColumn(RUNS_TABLE, oldColumn);
  }

  private async dropOldTaskTemplateTable() {
    if (await this.tableExists(OLD_TEMPLATE_TABLE)) {
      await this.queryInterface.dropTable(OLD_TEMPLATE_TABLE);
    }
  }

  private async renameColumnIfNeeded(tableName: string, oldColumnCandidates: string[], newColumn: string) {
    const columns = await this.describeTable(tableName);
    if (!columns) {
      return;
    }

    const oldColumn = this.findColumn(columns, oldColumnCandidates);
    if (!oldColumn || Object.prototype.hasOwnProperty.call(columns, newColumn)) {
      return;
    }

    await this.queryInterface.renameColumn(tableName, oldColumn, newColumn);
  }

  private async taskTemplateExists(id: string) {
    const rows = await this.sequelize.query<RowRecord>(
      `SELECT ${this.quoteIdentifier('id')} FROM ${this.quoteTable(NEW_TEMPLATE_TABLE)} WHERE ${this.quoteIdentifier(
        'id',
      )} = :id LIMIT 1`,
      {
        replacements: { id },
        type: QueryTypes.SELECT,
      },
    );
    return rows.length > 0;
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

  private findColumn(columns: TableColumns, candidates: string[]) {
    return candidates.find((column) => Object.prototype.hasOwnProperty.call(columns, column));
  }

  private getExistingNewTemplateKeyColumn() {
    const collection = this.db.getCollection('agTaskTemplates');
    const field = collection.getField('templateKey');
    return field.columnName();
  }

  private getExistingNewRunTemplateColumn() {
    const collection = this.db.getCollection('agRuns');
    const field = collection.getField('taskTemplate');
    return field.columnName();
  }

  private quoteTable(tableName: string) {
    return this.db.utils.quoteTable(tableName);
  }

  private quoteIdentifier(identifier: string) {
    return this.db.quoteIdentifier(identifier);
  }
}
