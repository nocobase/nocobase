/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { Repository } from '@nocobase/database';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';

export async function destroy(ctx: Context, next) {
  const { filterByTk, removeSchema = false } = ctx.action.params;
  const repository: Repository = ctx.db.getRepository('blockTemplates');
  const transaction = await ctx.db.sequelize.transaction();

  try {
    // Support both single and bulk deletion, filterByTk can be a single value or an array
    const filter = Array.isArray(filterByTk) ? { key: { $in: filterByTk } } : { key: filterByTk };

    // Delete associated schema if required
    if (removeSchema === 'true') {
      // Get template records to be deleted
      const templates = await repository.find({
        filter,
        transaction,
      });

      // Delete associated UISchema records
      const uiSchemaRepository = ctx.db.getRepository('uiSchemas') as UiSchemaRepository;
      for (const template of templates) {
        await uiSchemaRepository.remove(template.uid, {
          transaction,
          removeParentsIfNoChildren: true,
        });
      }
    }

    // Delete template records
    const result = await repository.destroy({
      filter,
      transaction,
    });

    await transaction.commit();
    ctx.body = result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  await next();
}
