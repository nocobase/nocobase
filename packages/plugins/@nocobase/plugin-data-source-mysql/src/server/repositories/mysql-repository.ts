/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FindOptions, ICollection, IModel, IRepository } from '@nocobase/data-source-manager';
import { MySqlCollectionManager } from '../collection-managers/mysql-collection-manager';
import { MySqlDataSource } from '../data-sources/mysql';
import { filterToSql } from '../utils/filter-to-sql';
import { validateSortBy } from '../utils/validate-sort-by';

export class MySqlRepository implements IRepository {
  collection: ICollection;
  collectionManager: MySqlCollectionManager;
  dataSource: MySqlDataSource;

  constructor(collection: ICollection, collectionManager: MySqlCollectionManager) {
    this.collection = collection;
    this.collectionManager = collectionManager;
    this.dataSource = collectionManager.dataSource as MySqlDataSource;
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
    const [rows] = await this.dataSource.pool.query(`SELECT ${select} FROM ${tableName} ${where} ${order} ${pagination}`, params);
    return rows as IModel[];
  }
  async findOne(options?: any): Promise<IModel> {
    const { fields, filter, limit, offset, sortBy } = options || {};
    const tableName = this.collection.name;
    const select = fields && fields.length ? fields.join(', ') : '*';
    const params = [];
    const whereClause = filter ? filterToSql(filter, params) : '';
    const where = whereClause ? `WHERE ${whereClause}` : '';
    const [rows] = await this.dataSource.pool.query(`SELECT ${select} FROM ${tableName} ${where} LIMIT 1`, params);
    return (rows as IModel[])[0];
  }
  async count(options?: any): Promise<Number> {
    const { filter } = options || {};
    const tableName = this.collection.name;
    const params = [];
    const whereClause = filter ? filterToSql(filter, params) : '';
    const where = whereClause ? `WHERE ${whereClause}` : '';
    const [rows] = await this.dataSource.pool.query(`SELECT COUNT(*) as count FROM ${tableName} ${where}`, params);
    return (rows as any[])[0].count;
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
    const valuePlaceholders = keys.map(() => `?`).join(', ');
    const [result] = await this.dataSource.pool.query(
      `INSERT INTO ${tableName} (${columns}) VALUES (${valuePlaceholders})`,
      Object.values(values),
    );
    const [rows] = await this.dataSource.pool.query(`SELECT * FROM ${tableName} WHERE id = ?`, [(result as any).insertId]);
    return (rows as IModel[])[0];
  }
  async update(options: any) {
    const { values, filter } = options;
    const tableName = this.collection.name;
    const keys = Object.keys(values);
    const setClauses = keys.map((key) => `${key} = ?`).join(', ');
    const params = [...Object.values(values)];
    const whereClause = filter ? filterToSql(filter, params) : '';
    const where = whereClause ? `WHERE ${whereClause}` : '';
    await this.dataSource.pool.query(`UPDATE ${tableName} SET ${setClauses} ${where}`, params);
    const [rows] = await this.dataSource.pool.query(`SELECT * FROM ${tableName} ${where}`, params.slice(keys.length));
    return rows as IModel[];
  }
  async destroy(options: any) {
    const { filter } = options;
    const tableName = this.collection.name;
    const params = [];
    const whereClause = filter ? filterToSql(filter, params) : '';
    const where = whereClause ? `WHERE ${whereClause}` : '';
    const [result] = await this.dataSource.pool.query(`DELETE FROM ${tableName} ${where}`, params);
    return result;
  }
}
