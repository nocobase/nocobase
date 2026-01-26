/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import type { FormBlockModel } from '@nocobase/client';

export async function submitHandler(ctx, params) {
  const resource = ctx.resource;
  const blockModel = ctx.blockModel as FormBlockModel;

  await blockModel.form.validateFields();

  const values = blockModel.form.getFieldsValue(true);
  const viewUid = ctx.view.inputArgs?.viewUid;
  const bulkEditActionModel = ctx.engine.getModel(viewUid, true);
  const collectionModel = bulkEditActionModel?.parent;
  const editModeParams = bulkEditActionModel.getStepParams('bulkEditSettings', 'editMode') || {};
  const updateMode = editModeParams?.value || 'selected';

  const updateData: {
    filter?: any;
    filterByTk?: any[];
    values: any;
    forceUpdate: boolean;
    triggerWorkflows?: string;
  } = {
    values,
    forceUpdate: false,
  };
  if (updateMode === 'selected') {
    const rows = collectionModel?.resource?.getSelectedRows?.() || [];

    const pk = ctx.collection?.getPrimaryKey?.() || ctx.collection?.filterTargetKey || 'id';
    const filterKey = ctx.collection?.filterTargetKey || pk || 'id';
    const ids = rows.map((r) => ctx.collection.getFilterByTK(r)).filter((v) => v != null);
    if (!ids?.length) {
      ctx.message.error(ctx.t('Please select the records to be updated'));
      return;
    }
    updateData.filter = { $and: [{ [filterKey]: { $in: ids } }] };
  } else {
    updateData.filter = collectionModel?.resource.getFilter();
  }

  // console.log('bulkEdit params.requestConfig', params.requestConfig, updateData);

  const collection = collectionModel.context.collection;
  if (updateData.filter) {
    await ctx.api
      .resource(collection.name, null, {
        'x-data-source': collection?.dataSourceKey,
      })
      .update({ filter: updateData.filter, values: updateData.values, ...params.requestConfig?.params });
  } else {
    await ctx.api
      .resource(collection.name, null, {
        'x-data-source': collection?.dataSourceKey,
      })
      .update({ values: updateData.values, forceUpdate: true, ...params.requestConfig?.params });
  }
  ctx.message.success(ctx.t('Saved successfully'));

  // if (resource instanceof SingleRecordResource) {
  //   if (blockModel instanceof BulkEditFormModel) {
  //     const currentFilterByTk = resource.getMeta('currentFilterByTk');
  //     if (!currentFilterByTk) {
  //       resource.isNewRecord = true; // 设置为新记录
  //     } else {
  //       resource.setFilterByTk(currentFilterByTk);
  //     }
  //   }
  //   const data: any = await resource.save(values, params.requestConfig);
  //   if (blockModel instanceof BulkEditFormModel) {
  //     resource.isNewRecord = false;
  //     await resource.refresh();
  //   } else {
  //     blockModel.form.resetFields();
  //     blockModel.emitter.emit('onFieldReset');
  //     if (ctx.view.inputArgs.collectionName === blockModel.collection.name && ctx.view.inputArgs.onChange) {
  //       ctx.view.inputArgs.onChange(data?.data);
  //     }
  //   }
  // } else if (resource instanceof MultiRecordResource) {
  //   const currentFilterByTk = resource.getMeta('currentFilterByTk');
  //   if (!currentFilterByTk) {
  //     ctx.message.error(ctx.t('No filterByTk found for multi-record resource.'));
  //     return;
  //   }
  //   await resource.update(currentFilterByTk, values, params.requestConfig);
  // }
}
