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
  appVersion = '<2.0.0';

  async up() {
    await this.db.sequelize.transaction(async (transaction) => {
      const users = this.db.getCollection('users');
      const departments = this.db.getCollection('departments');

      if (!users || !departments) {
        return;
      }

      const fieldRepo = this.db.getRepository('fields');
      if (!fieldRepo) {
        return;
      }

      const currentMainField = await fieldRepo.findOne({
        filter: {
          collectionName: 'users',
          name: 'mainDepartment',
        },
        transaction,
      });

      const iface = currentMainField?.get?.('interface');
      const type = currentMainField?.get?.('type');
      const shouldMigrate = !currentMainField || type === 'belongsToMany' || iface === 'm2m';

      if (!shouldMigrate) {
        return;
      }

      // 迁移关联表中 isMain=true 的数据到 users.mainDepartmentId
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
          hooks: false,
        });
      }

      // 从 fields 表中删除 isMain 字段定义
      await fieldRepo.destroy({
        filter: {
          collectionName: 'departmentsUsers',
          name: 'isMain',
        },
        transaction,
      });

      // 更新 users/mainDepartment：m2m -> m2o
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
        // 删除 m2m 相关配置
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
    });
  }
}
