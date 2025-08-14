/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FindOptions, ICollection, IModel, IRepository } from '@nocobase/data-source-manager';
import { SqlServerCollectionManager } from '../collection-managers/sql-server-collection-manager';
import { SqlServerDataSource } from '../data-sources/sql-server';
import { filterToSql } from '../utils/filter-to-sql';
import { validateSortBy } from '../utils/validate-sort-by';

export class SqlServerRepository implements IRepository {
  collection: ICollection;
  collectionManager: SqlServerCollectionManager;
  dataSource: SqlServerDataSource;

  constructor(collection: ICollection, collectionManager: SqlServerCollectionManager) {
    this.collection = collection;
    this.collectionManager = collectionManager;
    this.dataSource = collectionManager.dataSource as SqlServerDataSource;
  }

  async find(options?: FindOptions): Promise<IModel[]> {
    const { fields, filter, limit, offset, sortBy } = options || {};
    const tableName = this.collection.name;
    const select = fields && fields.length ? fields.join(', ') : '*';
    const request = this.dataSource.pool.request();
    const whereClause = filter ? filterToSql(filter, request) : '';
    const where = whereClause ? `WHERE ${whereClause}` : '';
    const order = sortBy ? `ORDER BY ${validateSortBy(sortBy)}` : '';
    const pagination = `OFFSET ${offset || 0} ROWS FETCH NEXT ${limit || 10} ROWS ONLY`;
    const result = await request.query(`SELECT ${select} FROM ${tableName} ${where} ${order} ${pagination}`);
    return result.recordset;
  }
  async findOne(options?: any): Promise<IModel> {
    const { fields, filter, limit, offset, sortBy } = options || {};
    const tableName = this.collection.name;
    const select = fields && fields.length ? fields.join(', ') : '*';
    const request = this.dataSource.pool.request();
    const whereClause = filter ? filterToSql(filter, request) : '';
    const where = whereClause ? `WHERE ${whereClause}` : '';
    const result = await request.query(`SELECT TOP 1 ${select} FROM ${tableName} ${where}`);
    return result.recordset[0];
  }
  async count(options?: any): Promise<Number> {
    const { filter } = options || {};
    const tableName = this.collection.name;
    const request = this.dataSource.pool.request();
    const whereClause = filter ? filterToSql(filter, request) : '';
    const where = whereClause ? `WHERE ${whereClause}` : '';
    const result = await request.query(`SELECT COUNT(*) as count FROM ${tableName} ${where}`);
    return result.recordset[0].count;
  }
  async findAndCount(options?: any): Promise<[IModel[], Number]> {
    const data = await this.find(options);
    const count = await this.count(options);
    return [data, count];
  }
  async create(options: any) {
    const { values } = options;
    const tableName = this.collection.name;
    const request = this.dataSource.pool.request();
    const keys = Object.keys(values);
    const columns = keys.join(', ');
    const valuePlaceholders = keys.map((key) => `@${key}`).join(', ');
    keys.forEach((key) => {
      request.input(key, values[key]);
    });
    const result = await request.query(
      `INSERT INTO ${tableName} (${columns}) OUTPUT INSERTED.* VALUES (${valuePlaceholders})`,
    );
    return result.recordset[0];
  }
  async update(options: any) {
    const { values, filter } = options;
    const tableName = this.collection.name;
    const request = this.dataSource.pool.request();
    const keys = Object.keys(values);
    const setClauses = keys.map((key) => `${key} = @${key}`).join(', ');
    keys.forEach((key) => {
      request.input(key, values[key]);
    });
    const whereClause = filter ? filterToSql(filter, request) : '';
    const where = whereClause ? `WHERE ${whereClause}` : '';
    const result = await request.query(`UPDATE ${tableName} SET ${setClauses} OUTPUT INSERTED.* ${where}`);
    return result.recordset;
  }
  async destroy(options: any) {
    const { filter } = options;
    const tableName = this.collection.name;
    const request = this.dataSource.pool.request();
    const whereClause = filter ? filterToSql(filter, request) : '';
    const where = whereClause ? `WHERE ${whereClause}` : '';
    const result = await request.query(`DELETE FROM ${tableName} ${where}`);
    return result;
  }
}
