/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FindOptions, ICollection, IModel, IRepository } from '@nocobase/data-source-manager';
import { PostgreSqlCollectionManager } from '../collection-managers/postgresql-collection-manager';
import { PostgreSqlDataSource } from '../data-sources/postgresql';
import { filterToSql } from '../utils/filter-to-sql';
import { validateSortBy } from '../utils/validate-sort-by';

export class PostgreSqlRepository implements IRepository {
  collection: ICollection;
  collectionManager: PostgreSqlCollectionManager;
  dataSource: PostgreSqlDataSource;

  constructor(collection: ICollection, collectionManager: PostgreSqlCollectionManager) {
    this.collection = collection;
    this.collectionManager = collectionManager;
    this.dataSource = collectionManager.dataSource as PostgreSqlDataSource;
  }

  async find(options?: FindOptions): Promise<IModel[]> {
    const { fields, filter, limit, offset, sortBy } = options || {};
    const tableName = this.collection.name;
    const select = fields && fields.length ? fields.join(', ') : '*';
    const params = [];
    const whereClause = filter ? filterToSql(filter, params) : '';
    const where = whereClause ? `WHERE ${whereClause}` : '';
    const order = sortBy ? `ORDER BY ${validateSortBy(sortBy)}` : '';
    const pagination = `LIMIT ${limit || 10} OFFSET ${offset || 0}`;
    const result = await this.dataSource.pool.query(`SELECT ${select} FROM "${tableName}" ${where} ${order} ${pagination}`, params);
    return result.rows as IModel[];
  }
  async findOne(options?: any): Promise<IModel> {
    const { fields, filter, limit, offset, sortBy } = options || {};
    const tableName = this.collection.name;
    const select = fields && fields.length ? fields.join(', ') : '*';
    const params = [];
    const whereClause = filter ? filterToSql(filter, params) : '';
    const where = whereClause ? `WHERE ${whereClause}` : '';
    const result = await this.dataSource.pool.query(`SELECT ${select} FROM "${tableName}" ${where} LIMIT 1`, params);
    return (result.rows as IModel[])[0];
  }
  async count(options?: any): Promise<Number> {
    const { filter } = options || {};
    const tableName = this.collection.name;
    const params = [];
    const whereClause = filter ? filterToSql(filter, params) : '';
    const where = whereClause ? `WHERE ${whereClause}` : '';
    const result = await this.dataSource.pool.query(`SELECT COUNT(*) as count FROM "${tableName}" ${where}`, params);
    return parseInt(result.rows[0].count, 10);
  }
  async findAndCount(options?: any): Promise<[IModel[], Number]> {
    const data = await this.find(options);
    const count = await this.count(options);
    return [data, count];
  }
  async create(options: any) {
    const { values } = options;
    const tableName = this.collection.name;
    const keys = Object.keys(values);
    const columns = keys.join(', ');
    const valuePlaceholders = keys.map((key, i) => `$${i + 1}`).join(', ');
    const result = await this.dataSource.pool.query(
      `INSERT INTO "${tableName}" (${columns}) VALUES (${valuePlaceholders}) RETURNING *`,
      Object.values(values),
    );
    return result.rows[0];
  }
  async update(options: any) {
    const { values, filter } = options;
    const tableName = this.collection.name;
    const keys = Object.keys(values);
    const setClauses = keys.map((key, i) => `"${key}" = $${i + 1}`).join(', ');
    const params = [...Object.values(values)];
    const whereClause = filter ? filterToSql(filter, params) : '';
    const where = whereClause ? `WHERE ${whereClause}` : '';
    const result = await this.dataSource.pool.query(
      `UPDATE "${tableName}" SET ${setClauses} ${where} RETURNING *`,
      params,
    );
    return result.rows;
  }
  async destroy(options: any) {
    const { filter } = options;
    const tableName = this.collection.name;
    const params = [];
    const whereClause = filter ? filterToSql(filter, params) : '';
    const where = whereClause ? `WHERE ${whereClause}` : '';
    const result = await this.dataSource.pool.query(`DELETE FROM "${tableName}" ${where}`, params);
    return result;
  }
}
