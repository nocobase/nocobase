/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { DataTypes, QueryTypes } from 'sequelize';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<=1.8.17';

  async up() {
    const { db } = this.context;

    await db.sequelize.transaction(async (transaction) => {
      const users = db.getCollection('users');
      const departments = db.getCollection('departments');
      const through = db.getCollection('departmentsUsers');

      if (!users || !departments) {
        return;
      }

      const usersTable = users.getTableNameWithSchema();
      const departmentsTable = departments.getTableNameWithSchema();

      // Add mainDepartmentId field to users table
      const hasMainDepartmentId = await this.columnExists(usersTable, 'mainDepartmentId', transaction);
      if (!hasMainDepartmentId) {
        await db.sequelize.getQueryInterface().addColumn(
          usersTable,
          'mainDepartmentId',
          {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
              model: departmentsTable,
              key: 'id',
            },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
          },
          { transaction },
        );
      }

      if (through) {
        const throughTable = through.getTableNameWithSchema();
        const hasIsMain = await this.columnExists(throughTable, 'isMain', transaction);

        if (hasIsMain) {
          // Migrate existing isMain=true records to users.mainDepartmentId
          const rows = await db.sequelize.query<{ userId: number; departmentId: number }>(
            `SELECT "userId", "departmentId" FROM ${db.utils.quoteTable(throughTable)} WHERE "isMain" = true`,
            { type: QueryTypes.SELECT, transaction },
          );

          for (const row of rows) {
            await db.sequelize.query(
              `UPDATE ${db.utils.quoteTable(usersTable)} SET "mainDepartmentId" = :departmentId WHERE "id" = :userId`,
              {
                replacements: { userId: row.userId, departmentId: row.departmentId },
                transaction,
              },
            );
          }

          // Remove isMain column from database
          try {
            await db.sequelize.getQueryInterface().removeColumn(throughTable, 'isMain', { transaction });
          } catch (e: any) {
            if (!/exist/i.test(e?.message || '')) throw e;
          }

          // Remove isMain field definition from fields table
          const fieldsRepo = db.getRepository('fields');
          if (fieldsRepo) {
            try {
              await fieldsRepo.destroy({
                filter: {
                  collectionName: 'departmentsUsers',
                  name: 'isMain',
                },
                transaction,
              });
            } catch (e: any) {
              // Field definition might not exist, ignore error
              console.warn('Failed to remove isMain field definition:', e.message);
            }
          }
        }
      }
    });
  }

  private async columnExists(tableNameWithSchema: string, column: string, _transaction?: any) {
    const { db } = this.context;
    try {
      const desc = await db.sequelize.getQueryInterface().describeTable(tableNameWithSchema);
      return Object.prototype.hasOwnProperty.call(desc, column);
    } catch {
      return false;
    }
  }
}
