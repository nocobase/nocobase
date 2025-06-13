/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* istanbul ignore file -- @preserve */

import { Op } from '@nocobase/database';
import { Migration } from '@nocobase/server';
import _ from 'lodash';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<1.8.0';

  async up() {
    const repository = this.context.db.getRepository('dataSourcesCollections');
    const transaction = await repository.model.sequelize.transaction();
    try {
      const collections = await repository.find({
        where: {
          [Op.or]: [
            { 'options.schema': "{{$deps[0].split('@')?.[0]}}" },
            { 'options.viewName': "{{$deps[0].split('@')?.[1]}}" },
          ],
        },
        transaction,
      });

      for (const collection of collections) {
        const { key, options } = collection;
        const newOptions = { ...options };

        if (options.schema === "{{$deps[0].split('@')?.[0]}}") {
          newOptions.schema = '';
        }
        if (options.viewName === "{{$deps[0].split('@')?.[1]}}") {
          newOptions.viewName = '';
        }

        await repository.model.update(
          { options: newOptions },
          {
            where: { key },
            transaction,
          },
        );
      }
      await transaction.commit();
    } catch (error) {
      console.error('Error during migration:', error);
      await transaction.rollback();
    }
  }
}
