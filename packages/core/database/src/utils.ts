/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import crypto from 'crypto';
import Database from './database';
import { IdentifierError } from './errors/identifier-error';
import lodash from 'lodash';

export function md5(value: string) {
  return crypto.createHash('md5').update(value).digest('hex');
}

const MAX_IDENTIFIER_LENGTH = 63;

export function checkIdentifier(value: string) {
  if (value.length > MAX_IDENTIFIER_LENGTH) {
    throw new IdentifierError(`Identifier ${value} is too long`);
  }
}

export function getTableName(collectionName: string, options) {
  return options.underscored ? snakeCase(collectionName) : collectionName;
}

export function snakeCase(name: string) {
  return require('sequelize').Utils.underscore(name);
}

function patchShowConstraintsQuery(queryGenerator, db) {
  queryGenerator.showConstraintsQuery = (tableName, constraintName) => {
    const lines = [
      'SELECT constraint_catalog AS "constraintCatalog",',
      'constraint_schema AS "constraintSchema",',
      'constraint_name AS "constraintName",',
      'table_catalog AS "tableCatalog",',
      'table_schema AS "tableSchema",',
      'table_name AS "tableName",',
      'constraint_type AS "constraintType",',
      'is_deferrable AS "isDeferrable",',
      'initially_deferred AS "initiallyDeferred"',
      'from INFORMATION_SCHEMA.table_constraints',
      `WHERE table_name='${lodash.isPlainObject(tableName) ? tableName.tableName : tableName}'`,
    ];

    if (constraintName) {
      lines.push(`AND constraint_name='${constraintName}'`);
    }

    if (lodash.isPlainObject(tableName) && tableName.schema) {
      lines.push(`AND table_schema='${tableName.schema}'`);
    }

    return lines.join(' ');
  };
}

function patchDescribeTableQuery(queryGenerator) {
  const describeTableQuery = function (tableName, schema) {
    schema = schema || this.options.schema || 'public';

    return (
      'SELECT ' +
      'pk.constraint_type as "Constraint",' +
      'c.column_name as "Field", ' +
      'c.column_default as "Default",' +
      'c.is_nullable as "Null", ' +
      "(CASE WHEN c.udt_name = 'hstore' THEN c.udt_name ELSE c.data_type END) || (CASE WHEN c.character_maximum_length IS NOT NULL THEN '(' || c.character_maximum_length || ')' ELSE '' END) as \"Type\", " +
      '(SELECT array_agg(e.enumlabel) FROM pg_catalog.pg_type t JOIN pg_catalog.pg_enum e ON t.oid=e.enumtypid WHERE t.typname=c.udt_name) AS "special", ' +
      '(SELECT pgd.description FROM pg_catalog.pg_statio_all_tables AS st INNER JOIN pg_catalog.pg_description pgd on (pgd.objoid=st.relid) WHERE c.ordinal_position=pgd.objsubid AND c.table_name=st.relname AND st.schemaname = c.table_schema) AS "Comment" ' +
      'FROM information_schema.columns c ' +
      'LEFT JOIN (SELECT tc.table_schema, tc.table_name, ' +
      'cu.column_name, tc.constraint_type ' +
      'FROM information_schema.TABLE_CONSTRAINTS tc ' +
      'JOIN information_schema.KEY_COLUMN_USAGE  cu ' +
      'ON tc.table_schema=cu.table_schema and tc.table_name=cu.table_name ' +
      'and tc.constraint_name=cu.constraint_name ' +
      "and tc.constraint_type='PRIMARY KEY') pk " +
      'ON pk.table_schema=c.table_schema ' +
      'AND pk.table_name=c.table_name ' +
      'AND pk.column_name=c.column_name ' +
      `WHERE c.table_name = ${this.escape(tableName)} AND c.table_schema = ${this.escape(schema)}`
    );
  };

  queryGenerator.describeTableQuery = describeTableQuery.bind(queryGenerator);
}

export function patchSequelizeQueryInterface(db: Database) {
  if (db.inDialect('postgres')) {
    //@ts-ignore
    const queryGenerator = db.sequelize.dialect.queryGenerator;
    patchShowConstraintsQuery(queryGenerator, db);
    patchDescribeTableQuery(queryGenerator);
  }
}

export function percent2float(value: string) {
  if (!value.endsWith('%')) {
    return NaN;
  }
  const val = value.substring(0, value.length - 1);
  if (isNaN(+val)) {
    return NaN;
  }
  const index = value.indexOf('.');
  if (index === -1) {
    return parseFloat(value) / 100;
  }
  const repeat = value.length - index - 2;
  const v = parseInt('1' + '0'.repeat(repeat));
  return (parseFloat(value) * v) / (100 * v);
}

export function isUndefinedOrNull(value: any) {
  return typeof value === 'undefined' || value === null;
}

export function isStringOrNumber(value: any) {
  return typeof value === 'string' || typeof value === 'number';
}

export function getKeysByPrefix(keys: string[], prefix: string) {
  return keys.filter((key) => key.startsWith(`${prefix}.`)).map((key) => key.substring(prefix.length + 1));
}

export function extractTypeFromDefinition(rawType: string) {
  const leftParenIndex = rawType.indexOf('(');

  if (leftParenIndex === -1) {
    return rawType.toLowerCase();
  }

  return rawType.substring(0, leftParenIndex).toLowerCase().trim();
}
