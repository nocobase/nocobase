/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import type { QueryInterface } from 'sequelize';

type ForeignKeyConstraintRow = {
  constraintName?: string;
};

function toConstraintInfoList(value: unknown): ForeignKeyConstraintRow[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is ForeignKeyConstraintRow => !!item && typeof item === 'object');
}

function getConstraintNames(rows: ForeignKeyConstraintRow[]) {
  return rows
    .map((row) => row.constraintName)
    .filter((constraintName): constraintName is string => typeof constraintName === 'string' && !!constraintName);
}

export default class extends Migration {
  on = 'afterLoad';

  async up() {
    const collection = this.db.getCollection('multiPortals');
    if (!collection) {
      return;
    }
    if (!this.db.isMySQLCompatibleDialect() && !this.db.isPostgresCompatibleDialect()) {
      return;
    }

    const tableName = collection.getTableNameWithSchema();
    const rawTableName = collection.model.tableName;
    const columnName = collection.model.getAttributes().uiLayoutUid.field || 'uiLayoutUid';
    const queryInterface = this.db.sequelize.getQueryInterface() as QueryInterface;
    const constraints = await (async (): Promise<ForeignKeyConstraintRow[]> => {
      if (this.db.isMySQLCompatibleDialect()) {
        const [rows] = await this.db.sequelize.query(
          `
            SELECT CONSTRAINT_NAME AS constraintName
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = :tableName
              AND COLUMN_NAME = :columnName
              AND REFERENCED_TABLE_NAME IS NOT NULL
          `,
          {
            replacements: {
              tableName: rawTableName,
              columnName,
            },
          },
        );
        return toConstraintInfoList(rows);
      }

      const tableSchema = typeof tableName === 'string' ? null : tableName.schema;
      const [rows] = await this.db.sequelize.query(
        `
            SELECT kcu.constraint_name AS "constraintName"
            FROM information_schema.key_column_usage kcu
            JOIN information_schema.table_constraints tc
              ON tc.constraint_catalog = kcu.constraint_catalog
              AND tc.constraint_schema = kcu.constraint_schema
              AND tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND kcu.table_schema = COALESCE(:tableSchema, current_schema())
              AND kcu.table_name = :tableName
              AND kcu.column_name = :columnName
          `,
        {
          replacements: {
            tableSchema,
            tableName: rawTableName,
            columnName,
          },
        },
      );
      return toConstraintInfoList(rows);
    })();

    for (const constraintName of getConstraintNames(constraints)) {
      await queryInterface.removeConstraint(tableName, constraintName);
    }
  }
}
