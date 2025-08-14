/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FindOptions, ICollection, IModel, IRepository } from '@nocobase/data-source-manager';
import { OracleCollectionManager } from '../collection-managers/oracle-collection-manager';
import { OracleDataSource } from '../data-sources/oracle';
import { filterToSql } from '../utils/filter-to-sql';
import { validateSortBy } from '../utils/validate-sort-by';

export class OracleRepository implements IRepository {
  collection: ICollection;
  collectionManager: OracleCollectionManager;
  dataSource: OracleDataSource;

  constructor(collection: ICollection, collectionManager: OracleCollectionManager) {
    this.collection = collection;
    this.collectionManager = collectionManager;
    this.dataSource = collectionManager.dataSource as OracleDataSource;
  }

  async find(options?: FindOptions): Promise<IModel[]> {
    const { fields, filter, limit, offset, sortBy } = options || {};
    const tableName = this.collection.name;
    const select = fields && fields.length ? fields.join(', ') : '*';
    const params = {};
    const whereClause = filter ? filterToSql(filter, params) : '';
    const where = whereClause ? `WHERE ${whereClause}` : '';
    const order = sortBy ? `ORDER BY ${validateSortBy(sortBy)}` : '';
    const pagination = `OFFSET ${offset || 0} ROWS FETCH NEXT ${limit || 10} ROWS ONLY`;
    const connection = await this.dataSource.pool.getConnection();
    const result = await connection.execute(`SELECT ${select} FROM ${tableName} ${where} ${order} ${pagination}`, params);
    await connection.close();
    return result.rows as IModel[];
  }
  async findOne(options?: any): Promise<IModel> {
    const { fields, filter, limit, offset, sortBy } = options || {};
    const tableName = this.collection.name;
    const select = fields && fields.length ? fields.join(', ') : '*';
    const params = {};
    const whereClause = filter ? filterToSql(filter, params) : '';
    const where = whereClause ? `WHERE ${whereClause}` : '';
    const connection = await this.dataSource.pool.getConnection();
    const result = await connection.execute(`SELECT ${select} FROM ${tableName} ${where} FETCH FIRST 1 ROWS ONLY`, params);
    await connection.close();
    return (result.rows as IModel[])[0];
  }
  async count(options?: any): Promise<Number> {
    const { filter } = options || {};
    const tableName = this.collection.name;
    const params = {};
    const whereClause = filter ? filterToSql(filter, params) : '';
    const where = whereClause ? `WHERE ${whereClause}` : '';
    const connection = await this.dataSource.pool.getConnection();
    const result = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName} ${where}`, params);
    await connection.close();
    return (result.rows as any[])[0][0];
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
    const valuePlaceholders = keys.map((key) => `:${key}`).join(', ');
    const connection = await this.dataSource.pool.getConnection();
    const result = await connection.execute(
      `INSERT INTO ${tableName} (${columns}) VALUES (${valuePlaceholders}) RETURNING ID INTO :id`,
      values,
      { autoCommit: true },
    );
    const [id] = (result.outBinds as any).id;
    const [rows] = await connection.execute(`SELECT * FROM ${tableName} WHERE id = :id`, [id]);
    await connection.close();
    return (rows as IModel[])[0];
  }
  async update(options: any) {
    const { values, filter } = options;
    const tableName = this.collection.name;
    const keys = Object.keys(values);
    const setClauses = keys.map((key) => `${key} = :${key}`).join(', ');
    const params = { ...values };
    const whereClause = filter ? filterToSql(filter, params) : '';
    const where = whereClause ? `WHERE ${whereClause}` : '';
    const connection = await this.dataSource.pool.getConnection();
    await connection.execute(`UPDATE ${tableName} SET ${setClauses} ${where}`, params, { autoCommit: true });
    const result = await connection.execute(`SELECT * FROM ${tableName} ${where}`, params);
    await connection.close();
    return result.rows as IModel[];
  }
  async destroy(options: any) {
    const { filter } = options;
    const tableName = this.collection.name;
    const params = {};
    const whereClause = filter ? filterToSql(filter, params) : '';
    const where = whereClause ? `WHERE ${whereClause}` : '';
    const connection = await this.dataSource.pool.getConnection();
    const result = await connection.execute(`DELETE FROM ${tableName} ${where}`, params, { autoCommit: true });
    await connection.close();
    return result;
  }
}
