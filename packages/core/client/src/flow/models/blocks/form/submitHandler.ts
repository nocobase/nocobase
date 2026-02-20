/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MultiRecordResource, SingleRecordResource } from '@nocobase/flow-engine';
import { EditFormModel } from './EditFormModel';
import type { FormBlockModel } from './FormBlockModel';
import { omitHiddenModelValuesFromSubmit } from './submitValues';

export async function submitHandler(ctx, params, cb?: (values?: any, filterByTk?: any) => void) {
  const resource = ctx.resource;
  const blockModel = ctx.blockModel as FormBlockModel;

  await blockModel.form.validateFields();
  const rawValues = blockModel.form.getFieldsValue(true);
  const values = omitHiddenModelValuesFromSubmit(rawValues, blockModel);
  if (resource instanceof SingleRecordResource) {
    if (blockModel instanceof EditFormModel) {
      const currentFilterByTk = resource.getMeta('currentFilterByTk');
      if (!currentFilterByTk) {
        resource.isNewRecord = true; // 设置为新记录
      } else {
        resource.setFilterByTk(currentFilterByTk);
      }
    }
    const data: any = cb ? await cb(values) : await resource.save(values, params.requestConfig);
    if (blockModel instanceof EditFormModel) {
      resource.isNewRecord = false;
      // 编辑表单保存成功后，表单应回到“已同步”状态：下一次刷新应允许覆盖为服务端值
      blockModel.resetUserModifiedFields?.();
      await resource.refresh();
    } else {
      blockModel.form.resetFields();
      blockModel.resetUserModifiedFields?.();
      blockModel.emitter.emit('onFieldReset');
      if (ctx.view.inputArgs.collectionName === blockModel.collection.name && ctx.view.inputArgs.onChange) {
        ctx.view.inputArgs.onChange(data?.data);
      }
    }
  } else if (resource instanceof MultiRecordResource) {
    const currentFilterByTk = resource.getMeta('currentFilterByTk');
    if (!currentFilterByTk) {
      ctx.message.error(ctx.t('No filterByTk found for multi-record resource.'));
      return;
    }
    (await cb)
      ? await cb(values, currentFilterByTk)
      : await resource.update(currentFilterByTk, values, params.requestConfig);
  }
}
