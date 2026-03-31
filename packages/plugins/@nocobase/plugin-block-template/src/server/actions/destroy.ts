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
import { getNewFullBlock } from '../utils';
import { QueryTypes } from 'sequelize';

export async function destroy(ctx: Context, next) {
  const { filterByTk, removeSchema = false } = ctx.action.params;
  const repository: Repository = ctx.db.getRepository('blockTemplates');
  const blockTemplateLinksRepository = ctx.db.getRepository('blockTemplateLinks');
  const transaction = await ctx.db.sequelize.transaction();

  try {
    // Support both single and bulk deletion, filterByTk can be a single value or an array
    const filter = Array.isArray(filterByTk) ? { key: { $in: filterByTk } } : { key: filterByTk };

    const templates = await repository.find({
      filter,
      transaction,
    });

    // Get template records to be deleted
    const links = await blockTemplateLinksRepository.find({
      filter: {
        templateKey: filter.key,
      },
      transaction,
    });
    const uiSchemaRepository = ctx.db.getRepository('uiSchemas') as UiSchemaRepository;

    // Delete associated schema if required
    if (removeSchema === 'true') {
      for (const link of links) {
        await uiSchemaRepository.remove(link.blockUid, {
          transaction,
          removeParentsIfNoChildren: true,
          breakRemoveOn: {
            'x-component': 'Grid',
          },
        });
      }
    } else {
      for (const link of links) {
        const fullBlock = await getNewFullBlock(ctx.db, transaction, link.blockUid);

        // 1. 获取父节点信息
        const parentInfo = await ctx.db.getRepository('uiSchemaTreePath').findOne({
          filter: {
            descendant: link.blockUid,
            depth: 1,
          },
          transaction,
        });
        const parentUid = parentInfo?.get('ancestor');

        if (!parentUid) {
          continue; // Skip if no parent found
        }

        // 2. 获取当前节点的位置信息
        const treePathTableName = uiSchemaRepository.uiSchemaTreePathTableName;
        const positionInfo = await ctx.db.sequelize.query<{ type: string; sort: number }>(
          `SELECT TreeTable.sort, TreeTable.type 
           FROM ${treePathTableName} as TreeTable
           WHERE TreeTable.depth = 1 AND TreeTable.descendant = :uid`,
          {
            replacements: { uid: link.blockUid },
            type: QueryTypes.SELECT,
            transaction,
          },
        );

        // 3. 删除旧树
        await uiSchemaRepository.remove(link.blockUid, {
          transaction,
          removeParentsIfNoChildren: false,
        });

        // 4. 插入新树，保持原有位置
        const position = positionInfo[0];
        await uiSchemaRepository.insertAdjacent(
          'beforeEnd',
          parentUid,
          {
            ...fullBlock,
            childOptions: {
              parentUid: parentUid,
              type: position?.type ?? 'properties',
              sort: position?.sort ?? 0,
            },
          },
          {
            transaction,
            wrap: false,
          },
        );
      }
    }

    // Delete associated template's UISchema records
    for (const template of templates) {
      await uiSchemaRepository.remove(template.uid, {
        transaction,
        removeParentsIfNoChildren: true,
      });
    }

    // Delete associated blockTemplateLinks records
    await blockTemplateLinksRepository.destroy({
      filter: {
        templateKey: filter.key,
      },
      transaction,
    });

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
