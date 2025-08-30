/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<=1.8.22';

  async up() {
    await this.db.sequelize.transaction(async (transaction) => {
      const users = this.db.getCollection('users');
      const departments = this.db.getCollection('departments');
      const through = this.db.getCollection('departmentsUsers');

      if (!users || !departments) {
        return;
      }

      if (through) {
        const throughTable = through.getTableNameWithSchema();
        const hasIsMain = await this.columnExists(throughTable, 'isMain', transaction);

        if (hasIsMain) {
          // Migrate existing isMain=true records to users.mainDepartmentId
          const rows = await this.db.getRepository('departmentsUsers').find({
            filter: {
              isMain: true,
            },
            fields: ['userId', 'departmentId'],
            transaction,
          });

          for (const row of rows) {
            await this.db.getRepository('users').update({
              filter: {
                id: row.userId,
              },
              values: {
                mainDepartmentId: row.departmentId,
              },
              transaction,
            });
          }

          // Remove isMain field definition from fields table
          const fieldsRepo = this.db.getRepository('fields');
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
              console.warn('Failed to remove isMain field definition:', e.message);
            }
          }

          // Update fields users/mainDepartment：m2m -> m2o
          const fieldRepo = this.db.getRepository('fields');
          const mainDepartmentField = await fieldRepo.findOne({
            filter: {
              collectionName: 'users',
              name: 'mainDepartment',
            },
            transaction,
          });

          if (mainDepartmentField) {
            const nextOptions: any = {
              ...(mainDepartmentField.options || {}),
              target: 'departments',
              foreignKey: 'mainDepartmentId',
              onDelete: 'SET NULL',
              sourceKey: 'id',
              targetKey: 'id',
              uiSchema: {
                type: 'string',
                title: '{{t("Main department")}}',
                'x-component': 'AssociationField',
                'x-component-props': {
                  multiple: false,
                  fieldNames: {
                    label: 'title',
                    value: 'id',
                  },
                },
              },
            };
            // delete m2m config
            delete nextOptions.through;
            delete nextOptions.otherKey;
            delete nextOptions.throughScope;

            await fieldRepo.update({
              filter: {
                collectionName: 'users',
                name: 'mainDepartment',
              },
              values: {
                type: 'belongsTo',
                interface: 'm2o',
                options: nextOptions,
              },
              transaction,
            });
          }
        }
      }
    });
  }

  private async columnExists(tableNameWithSchema: string, column: string, _transaction?: any) {
    try {
      const desc = await this.db.sequelize.getQueryInterface().describeTable(tableNameWithSchema);
      return Object.prototype.hasOwnProperty.call(desc, column);
    } catch {
      return false;
    }
  }
}
