/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowModelContext } from '@nocobase/flow-engine';

export const getAssociationBlockResourceSettings = (ctx: FlowModelContext | any) => {
  const blockModel = ctx?.blockModel || ctx?.model?.context?.blockModel;
  return (
    blockModel?.getResourceSettingsInitParams?.() ||
    blockModel?.getStepParams?.('resourceSettings', 'init') ||
    ctx?.model?.getStepParams?.('resourceSettings', 'init')
  );
};

export const isAssociationBlockContext = (ctx: FlowModelContext | any) => {
  return !!getAssociationBlockResourceSettings(ctx)?.associationName;
};

export const getAssociationTargetResourceSettings = (ctx: FlowModelContext | any) => {
  const resourceSettings = getAssociationBlockResourceSettings(ctx);
  const association = ctx?.blockModel?.association || ctx?.model?.context?.blockModel?.association;
  const targetCollection = association?.targetCollection;

  return {
    dataSourceKey: targetCollection?.dataSourceKey || resourceSettings?.dataSourceKey,
    collectionName: targetCollection?.name || association?.target || resourceSettings?.collectionName,
  };
};

const callAssociationResourceAction = async (resource: any, action: 'add' | 'remove', values: any[]) => {
  if (typeof resource?.[action] === 'function') {
    return await resource[action]({ values });
  }

  return await resource?.runAction?.(action, {
    data: values,
  });
};

export const applyDisassociateAction = async (ctx: FlowModelContext | any) => {
  const resource = ctx?.blockModel?.resource || ctx?.resource;
  const collection = ctx?.blockModel?.collection || ctx?.collection;

  if (!isAssociationBlockContext(ctx)) {
    ctx.message?.error?.(ctx.t('No association block selected'));
    return;
  }
  if (!resource) {
    ctx.message?.error?.(ctx.t('No resource selected for disassociation'));
    return;
  }
  if (!ctx.record) {
    ctx.message?.error?.(ctx.t('No record selected for disassociation'));
    return;
  }

  const filterByTk = collection?.getFilterByTK?.(ctx.record);
  await callAssociationResourceAction(resource, 'remove', [filterByTk]);
  await resource.refresh?.();
  ctx.message?.success?.(ctx.t('Record disassociated successfully'));
};

export const applyAssociateAction = async (ctx: FlowModelContext | any, selectedRows: any[]) => {
  const resource = ctx?.blockModel?.resource || ctx?.resource;
  const collection = ctx?.blockModel?.collection || ctx?.collection;

  if (!isAssociationBlockContext(ctx)) {
    ctx.message?.error?.(ctx.t('No association block selected'));
    return;
  }
  if (!resource) {
    ctx.message?.error?.(ctx.t('No resource selected for association'));
    return;
  }
  if (!selectedRows?.length) {
    ctx.message?.warning?.(ctx.t('Please select at least one record'));
    return;
  }

  const values = selectedRows.map((row) => collection?.getFilterByTK?.(row) ?? row).filter((value) => value != null);
  await callAssociationResourceAction(resource, 'add', values);
  await resource.refresh?.();
  ctx.message?.success?.(ctx.t('Record associated successfully'));
};
