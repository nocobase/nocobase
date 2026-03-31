/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { Migration } from '@nocobase/server';
import { departmentsField, mainDepartmentField } from '../collections/users';
import { ownersField } from '../collections/departments';

export default class UpdateFieldUISchemasMigration extends Migration {
  async up() {
    const result = await this.app.version.satisfies('<=0.20.0-alpha.6');

    if (!result) {
      return;
    }

    const fieldRepo = this.db.getRepository('fields');
    const departmentsFieldInstance = await fieldRepo.findOne({
      filter: {
        name: 'departments',
        collectionName: 'users',
      },
    });
    if (departmentsFieldInstance) {
      const options = {
        ...departmentsFieldInstance.options,
        uiSchema: departmentsField.uiSchema,
      };
      await fieldRepo.update({
        filter: {
          name: 'departments',
          collectionName: 'users',
        },
        values: {
          options,
        },
      });
    }
    const mainDepartmentFieldInstance = await fieldRepo.findOne({
      filter: {
        name: 'mainDepartment',
        collectionName: 'users',
      },
    });
    if (mainDepartmentFieldInstance) {
      const options = {
        ...mainDepartmentFieldInstance.options,
        uiSchema: mainDepartmentField.uiSchema,
      };
      await fieldRepo.update({
        filter: {
          name: 'mainDepartment',
          collectionName: 'users',
        },
        values: {
          options,
        },
      });
    }
    const ownersFieldInstance = await fieldRepo.findOne({
      filter: {
        name: 'owners',
        collectionName: 'departments',
      },
    });
    if (ownersFieldInstance) {
      const options = {
        ...ownersFieldInstance.options,
        uiSchema: ownersField.uiSchema,
      };
      await fieldRepo.update({
        filter: {
          name: 'owners',
          collectionName: 'departments',
        },
        values: {
          options,
        },
      });
    }
  }
}
