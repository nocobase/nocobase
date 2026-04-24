/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY } from './blueprint/defaults';

export const FLOW_SURFACE_INTERNAL_AUTO_SAVE_DEFAULT_POPUP_TEMPLATE_KEY = '__flowSurfaceAutoSaveDefaultPopupTemplate';

export type FlowSurfaceDefaultBlockActionScope = 'actions' | 'recordActions';

export type FlowSurfaceDefaultBlockActionDescriptor = {
  type: string;
  scope: FlowSurfaceDefaultBlockActionScope;
  popup?: Record<string, any>;
};

const FLOW_SURFACE_DEFAULT_BLOCK_ACTIONS: Readonly<
  Record<string, ReadonlyArray<FlowSurfaceDefaultBlockActionDescriptor>>
> = {
  table: [
    { type: 'filter', scope: 'actions' },
    {
      type: 'addNew',
      scope: 'actions',
      popup: {
        tryTemplate: true,
        [FLOW_SURFACE_INTERNAL_AUTO_SAVE_DEFAULT_POPUP_TEMPLATE_KEY]: true,
      },
    },
    { type: 'refresh', scope: 'actions' },
  ],
  list: [
    { type: 'filter', scope: 'actions' },
    {
      type: 'addNew',
      scope: 'actions',
      popup: {
        tryTemplate: true,
        [FLOW_SURFACE_INTERNAL_AUTO_SAVE_DEFAULT_POPUP_TEMPLATE_KEY]: true,
      },
    },
    { type: 'refresh', scope: 'actions' },
  ],
  gridCard: [
    { type: 'filter', scope: 'actions' },
    {
      type: 'addNew',
      scope: 'actions',
      popup: {
        tryTemplate: true,
        [FLOW_SURFACE_INTERNAL_AUTO_SAVE_DEFAULT_POPUP_TEMPLATE_KEY]: true,
      },
    },
    { type: 'refresh', scope: 'actions' },
  ],
  calendar: [
    { type: 'filter', scope: 'actions' },
    {
      type: 'addNew',
      scope: 'actions',
      popup: {
        tryTemplate: true,
        [FLOW_SURFACE_INTERNAL_AUTO_SAVE_DEFAULT_POPUP_TEMPLATE_KEY]: true,
      },
    },
    { type: 'refresh', scope: 'actions' },
  ],
  kanban: [
    { type: 'filter', scope: 'actions' },
    {
      type: 'addNew',
      scope: 'actions',
      popup: {
        tryTemplate: true,
        [FLOW_SURFACE_INTERNAL_AUTO_SAVE_DEFAULT_POPUP_TEMPLATE_KEY]: true,
      },
    },
    { type: 'refresh', scope: 'actions' },
  ],
  createForm: [{ type: 'submit', scope: 'actions' }],
  editForm: [{ type: 'submit', scope: 'actions' }],
  details: [
    {
      type: 'edit',
      scope: 'recordActions',
      popup: {
        tryTemplate: true,
        defaultType: 'edit',
        [FLOW_SURFACE_INTERNAL_AUTO_SAVE_DEFAULT_POPUP_TEMPLATE_KEY]: true,
      },
    },
  ],
};

function cloneDefaultActionDescriptor(
  descriptor: FlowSurfaceDefaultBlockActionDescriptor,
): FlowSurfaceDefaultBlockActionDescriptor {
  return {
    ...descriptor,
    ...(descriptor.popup ? { popup: _.cloneDeep(descriptor.popup) } : {}),
  };
}

function normalizeActionType(value: any) {
  return typeof value === 'string' ? value.trim() : String(value || '').trim();
}

function resolveDefaultBlockActions(blockType?: string, template?: unknown) {
  const normalizedBlockType = normalizeActionType(blockType);
  if (!normalizedBlockType || !_.isUndefined(template)) {
    return [];
  }
  return (FLOW_SURFACE_DEFAULT_BLOCK_ACTIONS[normalizedBlockType] || []).map(cloneDefaultActionDescriptor);
}

function shouldMergeDefaultPopup(popup: any) {
  if (!_.isPlainObject(popup)) {
    return true;
  }
  const keys = Object.keys(popup);
  if (!keys.length) {
    return true;
  }
  return keys.every((key) =>
    ['mode', 'size', 'title', 'defaultType', 'tryTemplate', FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY].includes(
      key,
    ),
  );
}

function mergeExplicitActionWithDescriptor<T extends { popup?: Record<string, any> }>(
  item: T,
  descriptor: FlowSurfaceDefaultBlockActionDescriptor,
) {
  if (!descriptor.popup || !shouldMergeDefaultPopup(item?.popup)) {
    return item;
  }
  return {
    ...item,
    popup: _.isPlainObject(item?.popup)
      ? {
          ..._.cloneDeep(descriptor.popup),
          ..._.cloneDeep(item.popup),
        }
      : _.cloneDeep(descriptor.popup),
  };
}

function mergeDefaultActionList<T extends { type?: string; popup?: Record<string, any> }>(
  existing: T[] | undefined,
  descriptors: FlowSurfaceDefaultBlockActionDescriptor[],
  createAction: (descriptor: FlowSurfaceDefaultBlockActionDescriptor) => T,
) {
  const existingList = Array.isArray(existing) ? existing : [];
  if (!descriptors.length) {
    return [...existingList];
  }
  const defaultTypes = new Set(descriptors.map((descriptor) => descriptor.type));
  const explicitByType = new Map<string, T>();
  const extras: T[] = [];

  for (const item of existingList) {
    const type = normalizeActionType(item?.type);
    if (!type || !defaultTypes.has(type)) {
      extras.push(item);
      continue;
    }
    if (!explicitByType.has(type)) {
      explicitByType.set(type, item);
      continue;
    }
    extras.push(item);
  }

  return [
    ...descriptors.map((descriptor) => {
      const explicit = explicitByType.get(descriptor.type);
      return explicit ? mergeExplicitActionWithDescriptor(explicit, descriptor) : createAction(descriptor);
    }),
    ...extras,
  ];
}

export function getFlowSurfaceDefaultBlockActions(input: { blockType?: string; template?: unknown }) {
  return resolveDefaultBlockActions(input.blockType, input.template);
}

export function mergeFlowSurfaceDefaultBlockActions<T extends { type?: string; popup?: Record<string, any> }>(input: {
  blockType?: string;
  template?: unknown;
  actions?: T[];
  recordActions?: T[];
  createAction: (descriptor: FlowSurfaceDefaultBlockActionDescriptor) => T;
}) {
  const descriptors = resolveDefaultBlockActions(input.blockType, input.template);
  const actionDescriptors = descriptors.filter((descriptor) => descriptor.scope === 'actions');
  const recordActionDescriptors = descriptors.filter((descriptor) => descriptor.scope === 'recordActions');

  return {
    actions: mergeDefaultActionList(input.actions, actionDescriptors, input.createAction),
    recordActions: mergeDefaultActionList(input.recordActions, recordActionDescriptors, input.createAction),
  };
}
