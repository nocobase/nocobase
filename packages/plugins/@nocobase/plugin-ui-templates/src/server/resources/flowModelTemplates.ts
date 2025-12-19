/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context } from '@nocobase/actions';
import _ from 'lodash';
import { uid } from '@nocobase/utils';
import FlowModelRepository from '@nocobase/plugin-flow-engine/src/server/repository';

type PlainRow = Record<string, any>;

const toPlain = (row: any): PlainRow => {
  if (!row) return row;
  if (typeof row.toJSON === 'function') return row.toJSON();
  return row;
};

const buildSearchFilter = (existing: any, search?: string) => {
  const filters = [];
  if (existing) {
    filters.push(existing);
  }
  if (search) {
    filters.push({
      $or: [{ name: { $includes: search } }, { description: { $includes: search } }],
    });
  }
  if (!filters.length) return undefined;
  if (filters.length === 1) return filters[0];
  return { $and: filters };
};

const withUsageCounts = async (ctx: Context, rows: PlainRow[]) => {
  const data = rows.map(toPlain).filter(Boolean);
  const uids = data.map((item) => item?.uid).filter(Boolean);
  if (!uids.length) return data;
  const UsageModel = ctx.db.getModel('flowModelTemplateUsages');
  const usageRows = await UsageModel.findAll({
    attributes: ['templateUid', [UsageModel.sequelize.fn('COUNT', '*'), 'count']],
    where: {
      templateUid: uids,
    },
    group: ['templateUid'],
    raw: true,
    transaction: ctx.transaction,
  });
  const usageMap = new Map<string, number>();
  for (const row of usageRows as any[]) {
    usageMap.set(row.templateUid, Number(row.count) || 0);
  }
  return data.map((item) => ({
    ...item,
    usageCount: usageMap.get(item.uid) || 0,
  }));
};

const resolveTemplateUid = (ctx: Context): string | undefined => {
  const params = ctx.action?.params || {};
  if (params.filterByTk) return params.filterByTk;
  if (typeof params?.filter?.uid === 'string') return params.filter.uid;
  if (params.values?.uid) return params.values.uid;
  return undefined;
};

const normalizeOptions = (options: any) => {
  if (!options) return {};
  if (typeof options === 'string') {
    try {
      return JSON.parse(options);
    } catch (e) {
      return {};
    }
  }
  return options;
};

const syncTemplateMetaToReferenceBlocks = async (
  ctx: Context,
  template: { uid: string; name: string; description: any; targetUid?: string },
) => {
  const usageRepo = ctx.db.getRepository('flowModelTemplateUsages');
  const usages = await usageRepo.find({
    filter: { templateUid: template.uid },
    fields: ['modelUid'],
    transaction: ctx.transaction,
    context: ctx,
  });
  if (!Array.isArray(usages) || usages.length === 0) return;
  const modelUids = _.uniq(usages.map((u: any) => u?.modelUid).filter(Boolean));
  if (!modelUids.length) return;

  const flowRepo = ctx.db.getRepository('flowModels') as FlowModelRepository;

  for (const modelUid of modelUids) {
    const record = await flowRepo.findOne({
      filter: { uid: modelUid },
      transaction: ctx.transaction,
    });
    if (!record) continue;
    const options = normalizeOptions(record.get('options'));
    if (options?.use !== 'ReferenceBlockModel') continue;
    const stepParams = options?.stepParams || {};
    const useTemplate = _.get(stepParams, ['referenceSettings', 'useTemplate']);
    if (!useTemplate || useTemplate.templateUid !== template.uid) continue;
    const nextOptions = _.cloneDeep(options);
    _.set(nextOptions, ['stepParams', 'referenceSettings', 'useTemplate'], {
      ...useTemplate,
      templateName: template.name,
      templateDescription: template.description,
    });
    if (template.targetUid) {
      const currentTarget = _.get(nextOptions, ['stepParams', 'referenceSettings', 'target', 'targetUid']);
      if (!currentTarget) {
        _.set(nextOptions, ['stepParams', 'referenceSettings', 'target', 'targetUid'], template.targetUid);
      }
    }
    await flowRepo.update({
      filter: { uid: modelUid },
      values: {
        options: nextOptions,
      },
      transaction: ctx.transaction,
      context: ctx,
    });
  }
};

export default {
  name: 'flowModelTemplates',
  actions: {
    async list(ctx: Context, next) {
      const search = ctx.action?.params?.search as string | undefined;
      const mergedFilter = buildSearchFilter(ctx.action.params?.filter, search);
      if (mergedFilter) {
        ctx.action.mergeParams({ filter: mergedFilter });
      }
      await actions.list(ctx, next);
      if (Array.isArray(ctx.body)) {
        ctx.body = await withUsageCounts(ctx, ctx.body);
        return;
      }
      const rows = Array.isArray(ctx.body?.rows) ? ctx.body.rows : [];
      const rowsWithCount = await withUsageCounts(ctx, rows);
      ctx.body = {
        ...ctx.body,
        rows: rowsWithCount,
      };
    },

    async get(ctx: Context, next) {
      await actions.get(ctx, next);
      if (!ctx.body) return;
      const [rowWithCount] = await withUsageCounts(ctx, [ctx.body]);
      ctx.body = rowWithCount;
    },

    async create(ctx: Context, next) {
      const values = ctx.action.params?.values || {};
      const detachParent = !!values.detachParent || !!values.detachFromParent;
      if (!values.uid) {
        values.uid = uid();
      }
      if (values.targetUid && typeof values.targetUid === 'object') {
        values.targetUid = values.targetUid.uid || values.targetUid.data?.uid || String(values.targetUid);
      }
      ctx.action.mergeParams({
        values: _.pick(values, [
          'uid',
          'name',
          'description',
          'targetUid',
          'useModel',
          'type',
          'dataSourceKey',
          'collectionName',
          'associationName',
          'filterByTk',
          'sourceId',
        ]),
      });
      await actions.create(ctx, next);
      if (ctx.body) {
        ctx.body = {
          ...toPlain(ctx.body),
          usageCount: 0,
        };
        if (detachParent && ctx.body.targetUid) {
          const flowRepo = ctx.db.getRepository('flowModels') as FlowModelRepository;
          await flowRepo.clearAncestor(ctx.body.targetUid, { transaction: ctx.transaction });
        }
      }
    },

    async update(ctx: Context, next) {
      const values = ctx.action.params?.values || {};
      ctx.action.mergeParams({
        values: _.pick(values, ['name', 'description']),
      });
      await actions.update(ctx, next);
      if (ctx.body) {
        const rawData = ctx.body?.data ?? ctx.body;
        const rows = Array.isArray(rawData) ? rawData : [rawData];
        const rowsWithCount = await withUsageCounts(ctx, rows);
        const normalizedRow = Array.isArray(rawData) ? rowsWithCount : rowsWithCount?.[0];
        ctx.body = ctx.body?.data ? { ...ctx.body, data: normalizedRow } : normalizedRow;
        const templateRow = (Array.isArray(rowsWithCount) ? rowsWithCount[0] : rowsWithCount) as PlainRow;
        const templateUid = resolveTemplateUid(ctx) || templateRow?.uid;
        await syncTemplateMetaToReferenceBlocks(ctx, {
          uid: templateUid,
          name: templateRow?.name,
          description: templateRow?.description,
          targetUid: templateRow?.targetUid,
        });
      }
    },

    async destroy(ctx: Context, next) {
      const templateUid = resolveTemplateUid(ctx);
      if (!templateUid) {
        return ctx.throw(400, 'template uid is required');
      }
      const usageRepo = ctx.db.getRepository('flowModelTemplateUsages');
      const usageCount = await usageRepo.count({
        filter: {
          templateUid,
        },
        context: ctx,
      });
      if (usageCount > 0) {
        return ctx.throw(400, {
          code: 'TEMPLATE_IN_USE',
          message: 'Template is in use and cannot be deleted',
          data: { usageCount },
        });
      }
      await actions.destroy(ctx, next);
      // 兜底清理孤立 usage（正常情况下 usageCount 已为 0）
      await usageRepo.destroy({
        filter: {
          templateUid,
        },
        context: ctx,
      });
    },
  },
};
