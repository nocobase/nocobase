/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Sequelize, QueryTypes, Op } from 'sequelize';
import { FindOptions } from './repository';
import { Model } from './model';
import _ from 'lodash';
import { Collection } from './collection';

interface IndexInfo {
  name: string;
  columns: string[];
  isPrimary: boolean;
  isUnique: boolean;
}

export class SmartCursorBuilder {
  private sequelize: Sequelize;
  private tableName: string;
  private collection: Collection;

  constructor(sequelize: Sequelize, tableName: string, collection: Collection) {
    this.sequelize = sequelize;
    this.tableName = tableName;
    this.collection = collection;
  }

  /**
   * 根据表结构自动选择最优游标策略
   */
  private async getBestCursorStrategy(): Promise<CursorStrategy> {
    let indexInfoSql = '';

    const dialect = this.sequelize.getDialect();

    if (dialect === 'postgres') {
      indexInfoSql = `
      SELECT 
        t.relname AS table_name,
        i.relname AS index_name,
        a.attname AS column_name,
        array_position(ix.indkey, a.attnum) + 1 AS seq_in_index,
        CASE 
          WHEN ix.indisprimary THEN 1
          WHEN ix.indisunique THEN 2
          ELSE 3
        END AS index_type,
        -- 判断索引排序方向 (0=ASC, 1=DESC)
        CASE WHEN (ix.indoption[array_position(ix.indkey, a.attnum) - 1] & 1) = 1 
             THEN 'DESC' ELSE 'ASC' 
        END AS direction
      FROM 
        pg_class t,
        pg_class i,
        pg_index ix,
        pg_attribute a,
        pg_namespace n
      WHERE 
        t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND a.attrelid = t.oid
        AND t.relnamespace = n.oid
        AND a.attnum = ANY(ix.indkey)
        AND t.relkind = 'r'
        AND n.nspname = current_schema()
        AND t.relname = $1
      ORDER BY 
        i.relname, 
        array_position(ix.indkey, a.attnum)
    `;
    } else if (dialect === 'mariadb' || dialect === 'mysql') {
      indexInfoSql = `
      SELECT 
        i.TABLE_NAME, 
        i.INDEX_NAME, 
        i.COLUMN_NAME,
        i.SEQ_IN_INDEX,
        CASE 
          WHEN i.INDEX_NAME = 'PRIMARY' THEN 1
          WHEN i.NON_UNIQUE = 0 THEN 2
          ELSE 3 
        END as INDEX_TYPE
      FROM 
        information_schema.STATISTICS i
      WHERE 
        i.TABLE_SCHEMA = DATABASE() 
        AND i.TABLE_NAME = ?
      ORDER BY 
        i.INDEX_NAME, 
        i.SEQ_IN_INDEX;
    `;
    }
    const indexRows = (await this.sequelize.query(indexInfoSql, {
      type: QueryTypes.SELECT,
      replacements: [this.tableName],
      raw: true,
    })) as any[];

    const indexes: Map<string, IndexInfo> = new Map();
    const indexDirections: Map<string, Map<string, string>> = new Map();
    if (!indexRows || indexRows.length === 0) {
      if (Array.isArray(this.collection.filterTargetKey)) {
        return new CompositeKeyCursorStrategy(this.collection.filterTargetKey);
      }
      return new SingleColumnCursorStrategy(this.collection.filterTargetKey);
    }
    for (const row of indexRows) {
      const indexName = dialect === 'postgres' ? row.index_name : row.INDEX_NAME;
      const columnName = dialect === 'postgres' ? row.column_name : row.COLUMN_NAME;
      const indexType = dialect === 'postgres' ? row.index_type : row.INDEX_TYPE;
      if (dialect === 'postgres' && row.direction) {
        if (!indexDirections.has(indexName)) {
          indexDirections.set(indexName, new Map());
        }
        indexDirections.get(indexName).set(columnName, row.direction);
      }

      if (!indexes.has(indexName)) {
        indexes.set(indexName, {
          name: indexName,
          columns: [],
          isPrimary: dialect === 'postgres' ? indexType === 1 : indexName === 'PRIMARY',
          isUnique: indexType < 3,
        });
      }
      const index = indexes.get(row.INDEX_NAME);
      index.columns[row.SEQ_IN_INDEX - 1] = row.COLUMN_NAME;
    }

    for (const index of indexes.values()) {
      if (index.isPrimary) {
        if (index.columns.length === 1) {
          return new SingleColumnCursorStrategy(index.columns[0]);
        } else {
          if (dialect === 'postgres' && indexDirections.has(index.name)) {
            const directions = index.columns.map((col) => indexDirections.get(index.name).get(col) || 'ASC');
            return new CompositeKeyCursorStrategy(index.columns, directions);
          } else {
            return new CompositeKeyCursorStrategy(index.columns);
          }
        }
      }
    }

    // 2. 查找唯一索引（优先单列）
    let singleColumnUniqueIndex = null;
    let multiColumnUniqueIndex = null;

    for (const index of indexes.values()) {
      if (index.isUnique && !index.isPrimary) {
        if (index.columns.length === 1 && !singleColumnUniqueIndex) {
          singleColumnUniqueIndex = index;
        } else if (index.columns.length > 1 && !multiColumnUniqueIndex) {
          multiColumnUniqueIndex = index;
        }
      }
    }

    if (singleColumnUniqueIndex) {
      return new SingleColumnCursorStrategy(singleColumnUniqueIndex.columns[0]);
    }

    if (multiColumnUniqueIndex) {
      return new CompositeKeyCursorStrategy(multiColumnUniqueIndex.columns);
    }

    // 3. 普通索引，尝试找任何索引的最左列
    let anyIndex = null;
    for (const index of indexes.values()) {
      if (index.columns.length > 0 && !index.isPrimary && !index.isUnique) {
        anyIndex = index;
        break;
      }
    }

    if (anyIndex) {
      if (anyIndex.columns.length === 1) {
        return new SingleColumnCursorStrategy(anyIndex.columns[0]);
      } else {
        return new CompositeKeyCursorStrategy(anyIndex.columns);
      }
    }
  }

  /**
   * Cursor-based pagination query function.
   * Ideal for large datasets (e.g., millions of rows)
   * Note:
   *  1. does not support jumping to arbitrary pages (e.g., "Page 5")
   *  2. Requires a stable, indexed sort field (e.g. ID, createdAt)
   *  3. If custom orderBy is used, it must match the cursor field(s) and direction, otherwise results may be incorrect or unstable.
   * @param options
   */
  async chunk(
    options: FindOptions & {
      chunkSize: number;
      callback: (rows: Model[], options: FindOptions) => Promise<void>;
      find: (options: FindOptions) => Promise<any[]>;
      beforeFind?: (options: FindOptions) => Promise<void>;
      afterFind?: (rows: Model[], options: FindOptions) => Promise<void>;
    },
  ) {
    const cursorStrategy = await this.getBestCursorStrategy();
    let cursorRecord = null;
    let hasMoreData = true;
    let isFirst = true;
    options.order = cursorStrategy.buildSort();
    options['parseSort'] = false;
    while (hasMoreData) {
      if (!isFirst) {
        options.where = cursorStrategy.buildWhere(options.where, cursorRecord);
      }
      if (isFirst) {
        isFirst = false;
      }
      options.limit = options.chunkSize || 1000;
      if (options.beforeFind) {
        await options.beforeFind(options);
      }
      const records = await options.find(_.omit(options, 'callback', 'beforeFind', 'afterFind', 'chunkSize', 'find'));
      if (options.afterFind) {
        await options.afterFind(records, options);
      }
      if (records.length === 0) {
        hasMoreData = false;
        continue;
      }
      await options.callback(records, options);
      cursorRecord = records[records.length - 1];
    }
  }
}

/**
 * 游标策略接口 - 定义不同游标策略的通用接口
 */
interface CursorStrategy {
  buildWhere(baseWhere: any, record?: Model): any;
  buildSort(): any;
}

class SingleColumnCursorStrategy implements CursorStrategy {
  public columnName: string;

  constructor(columnName: string) {
    this.columnName = columnName;
  }

  buildSort() {
    return [[this.columnName, 'ASC']];
  }

  buildWhere(baseWhere: any, record?: Model): any {
    if (!record) {
      return baseWhere;
    }
    return { ...baseWhere, [this.columnName]: { [Op.gt]: record[this.columnName] } };
  }
}

/**
 * 复合键游标策略 - 适用于有联合索引的表
 */
class CompositeKeyCursorStrategy implements CursorStrategy {
  private columns: string[];
  private directions: string[];

  constructor(columns: string[], directions?: string[]) {
    this.columns = columns;
    this.directions = directions || Array(columns.length).fill('ASC');
  }

  buildSort() {
    const orderBy = [];
    for (let i = 0; i < this.columns.length; i++) {
      orderBy.push([this.columns[i], this.directions[i]]);
    }
    return orderBy;
  }

  buildWhere(baseWhere: any, record?: any): any {
    if (!record) {
      return baseWhere;
    }
    const whereConditions = [];

    for (let i = 0; i < this.columns.length; i++) {
      const column = this.columns[i];

      if (i > 0) {
        const equalConditions = {};
        for (let j = 0; j < i; j++) {
          equalConditions[this.columns[j]] = record[this.columns[j]];
        }

        whereConditions.push({
          ...equalConditions,
          [column]: {
            [Op.gt]: record[column],
          },
        });
      } else {
        whereConditions.push({
          [column]: {
            [Op.gt]: record[column],
          },
        });
      }
    }
    const cursorCondition = {
      [Op.or]: whereConditions,
    };

    return baseWhere ? { [Op.and]: [baseWhere, cursorCondition] } : cursorCondition;
  }
}
