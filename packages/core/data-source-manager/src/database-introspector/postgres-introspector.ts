/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DatabaseIntrospector } from './database-introspector';
import _ from 'lodash';
import { ColumnsDescription } from 'sequelize';
import { tableInfo } from '../types';

export class PostgresIntrospector extends DatabaseIntrospector {
  async getTableConstraints(tableInfo: tableInfo): Promise<object> {
    const schema = tableInfo.schema || 'public';

    const sql = `
  SELECT
  tc.constraint_schema,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  CASE WHEN (SELECT COUNT(*)
             FROM information_schema.key_column_usage kcu2
             WHERE kcu2.constraint_name = tc.constraint_name
               AND kcu2.table_schema = tc.constraint_schema) = 1 THEN TRUE
       ELSE FALSE END AS is_single_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_name = :tableName
  AND tc.table_schema = :schema
ORDER BY tc.constraint_name, kcu.column_name;
  `;

    return await this.db.sequelize.query(sql, {
      type: 'SELECT',
      replacements: {
        tableName: tableInfo.tableName,
        schema,
      },
    });
  }

  async getTableColumnsInfo(tableInfo: tableInfo) {
    const columnsInfo = await this.db.sequelize.getQueryInterface().describeTable(tableInfo);
    const primaryKeys = await this.getPrimaryKeysOfTable(tableInfo);

    // adjust primary key attributes
    Object.keys(columnsInfo).forEach((columnName) => {
      const columnInfo = columnsInfo[columnName];
      const primaryKey = primaryKeys.find((key: any) => key.column_name === columnName);
      if (primaryKey) {
        columnInfo.primaryKey = true;
      }
    });
    await this.appendArrayColumnElementType(tableInfo, columnsInfo);

    return columnsInfo;
  }

  private async getPrimaryKeysOfTable(tableInfo: tableInfo) {
    const schema = tableInfo.schema || 'public';

    const sql = `
      SELECT pg_attribute.attname  AS column_name,
             pg_constraint.conname AS constraint_name
      FROM pg_constraint
             JOIN pg_class ON pg_constraint.conrelid = pg_class.oid
             JOIN pg_attribute ON pg_attribute.attnum = ANY (pg_constraint.conkey)
        AND pg_attribute.attrelid = pg_class.oid
             JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
      WHERE pg_class.relname = :tableName
        AND pg_namespace.nspname = :schema
        AND pg_constraint.contype = 'p';
    `;

    return await this.db.sequelize.query(sql, {
      type: 'SELECT',
      replacements: {
        tableName: tableInfo.tableName,
        schema,
      },
    });
  }

  protected columnAttribute(columnsInfo: ColumnsDescription, columnName: string, indexes: any) {
    const columnInfo = columnsInfo[columnName];

    const attr: any = {
      type: columnInfo.type,
      allowNull: columnInfo.defaultValue ? true : columnInfo.allowNull,
      primaryKey: columnInfo.primaryKey,
      unique: false,
      description: columnInfo.comment,
    };

    if (columnInfo.defaultValue && typeof columnInfo.defaultValue === 'string') {
      const isSerial = columnInfo.defaultValue.match(/^nextval\(/);
      const isUUID = columnInfo.defaultValue.match(/^uuid_generate_v4\(/);

      if (isSerial || isUUID) {
        attr.autoIncrement = true;
      }
    }

    if (columnInfo.type === 'ARRAY') {
      attr.dataType = 'array';
      if (columnInfo['elementType']) {
        const elementType = columnInfo['elementType'].replace(/"/g, '');
        const { type } = this.inferFieldTypeByRawType(elementType);
        attr.elementType = type;
      }
    }

    for (const index of indexes) {
      if (index['is_single_column'] && index['column_name'] === columnName) {
        attr.unique = true;
      }
    }

    return attr;
  }

  private async getArrayColumnElementType(tableInfo: tableInfo, columnNames: string[]) {
    const schema = tableInfo.schema || 'public';
    // https://www.postgresql.org/docs/current/infoschema-element-types.html
    const sql = `
SELECT c.column_name, e.data_type AS element_type
FROM information_schema.columns c LEFT JOIN information_schema.element_types e
     ON ((c.table_catalog, c.table_schema, c.table_name, 'TABLE', c.dtd_identifier)
       = (e.object_catalog, e.object_schema, e.object_name, e.object_type, e.collection_type_identifier))
WHERE c.table_schema = :schema AND c.table_name = :tableName AND c.column_name in (:columnNames);
    `;

    return await this.db.sequelize.query(sql, {
      type: 'SELECT',
      replacements: {
        schema,
        tableName: tableInfo.tableName,
        columnNames,
      },
    });
  }

  private async appendArrayColumnElementType(tableInfo: tableInfo, columnsInfo: ColumnsDescription) {
    const arrayColumns = {};
    for (const columnName in columnsInfo) {
      const columnInfo = columnsInfo[columnName];
      if (columnInfo.type === 'ARRAY') {
        arrayColumns[columnName] = columnInfo;
      }
    }
    const columnNames = Object.keys(arrayColumns);
    if (!columnNames.length) {
      return;
    }
    const rows = await this.getArrayColumnElementType(tableInfo, columnNames);
    const udtNameMap = _.keyBy(rows, 'column_name') as {
      [key: string]: { element_type: string };
    };
    Object.keys(arrayColumns).forEach((columnName) => {
      columnsInfo[columnName]['elementType'] = udtNameMap[columnName].element_type;
    });
  }
}
