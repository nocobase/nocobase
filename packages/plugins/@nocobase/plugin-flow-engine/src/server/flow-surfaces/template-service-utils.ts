/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { buildFlowTemplateSearchFilter } from './service-helpers';
import { buildDefinedPayload, getSingleNodeSubModel } from './service-utils';
import { throwBadRequest } from './errors';
import type { FlowSurfaceWriteTarget } from './types';

export type FlowSurfaceTemplateRow = {
  uid: string;
  name?: string;
  description?: string;
  targetUid?: string;
  useModel?: string;
  type?: string;
  dataSourceKey?: string;
  collectionName?: string;
  associationName?: string;
  filterByTk?: string;
  sourceId?: string;
  usageCount?: number;
  available?: boolean;
  disabledReason?: string;
};

export type FlowSurfaceTemplateListValues = {
  search?: string;
  filter?: Record<string, any>;
  sort?: string | string[];
  page?: number;
  pageSize?: number;
  target?: FlowSurfaceWriteTarget;
  type?: 'block' | 'popup';
  usage?: 'block' | 'fields';
  actionType?: string;
  actionScope?: 'block' | 'record';
};

export type FlowSurfaceTemplateListPopupActionContext = {
  hasCurrentRecord?: boolean;
};

export const FLOW_TEMPLATE_SUPPORTED_TYPES = new Set(['block', 'popup']);
export const FLOW_TEMPLATE_SUPPORTED_MODES = new Set(['reference', 'copy']);
export const FLOW_TEMPLATE_BLOCK_USAGES = new Set(['block', 'fields']);
export const FLOW_TEMPLATE_UNSUPPORTED_BLOCK_TEMPLATE_SOURCE_USES = new Set([
  'ApplyTaskCardDetailsModel',
  'ApprovalTaskCardDetailsModel',
]);
export const POPUP_HOST_STEP_PARAM_PATHS = [
  ['popupSettings', 'openView'],
  ['selectExitRecordSettings', 'openView'],
  ['openSelectRecordView', 'openView'],
  ['openAddRecordView', 'openView'],
] as const;

export function normalizeTemplateUidValue(actionName: string, values: Record<string, any>) {
  const templateUid = String(values?.filterByTk || values?.uid || '').trim();
  if (!templateUid) {
    throwBadRequest(`flowSurfaces ${actionName} template uid is required`, 'FLOW_SURFACE_TEMPLATE_UID_REQUIRED');
  }
  return templateUid;
}

export function normalizeRequiredTemplateString(actionName: string, value: any, field: string) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    throwBadRequest(`flowSurfaces ${actionName} ${field} is required`, 'FLOW_SURFACE_TEMPLATE_REQUIRED_FIELD');
  }
  return normalized;
}

export function normalizeTemplateSaveMode(actionName: string, value: any) {
  const normalized = String(value || 'duplicate').trim() || 'duplicate';
  if (normalized !== 'duplicate' && normalized !== 'convert') {
    throwBadRequest(
      `flowSurfaces ${actionName} saveMode only supports 'duplicate' or 'convert'`,
      'FLOW_SURFACE_TEMPLATE_SAVE_MODE_UNSUPPORTED',
    );
  }
  return normalized as 'duplicate' | 'convert';
}

export function buildTemplateListFilter(existingFilter: any, search: any, requestedType?: 'block' | 'popup') {
  const typeFilter = requestedType ? { type: requestedType } : undefined;
  return buildFlowTemplateSearchFilter(
    existingFilter && typeFilter ? { $and: [existingFilter, typeFilter] } : existingFilter || typeFilter,
    search,
  );
}

export function findFlowTemplateOpenViewStep(node: any) {
  for (const [flowKey, stepKey] of POPUP_HOST_STEP_PARAM_PATHS) {
    const openView = _.get(node, ['stepParams', flowKey, stepKey]);
    if (_.isPlainObject(openView)) {
      return {
        flowKey,
        stepKey,
        openView,
      };
    }
  }
  return null;
}

export function buildFlowTemplateReferenceBlockStepParams(
  template: FlowSurfaceTemplateRow,
  templateTargetUid: string,
  resourceInit?: Record<string, any>,
) {
  const normalizedResourceInit = buildDefinedPayload(resourceInit || {});
  return buildDefinedPayload({
    referenceSettings: {
      target: {
        targetUid: templateTargetUid,
        mode: 'reference',
      },
      useTemplate: {
        templateUid: template.uid,
        templateName: template.name,
        templateDescription: template.description,
        targetUid: templateTargetUid,
        mode: 'reference',
      },
    },
    ...(Object.keys(normalizedResourceInit).length
      ? {
          resourceSettings: {
            init: normalizedResourceInit,
          },
        }
      : {}),
  });
}

export function collectFlowTemplateUsageMapFromModelOptions(
  modelUid: string,
  options: any,
  carry = new Map<string, Set<string>>(),
) {
  const normalizedModelUid = String(modelUid || '').trim();
  if (!normalizedModelUid) {
    return carry;
  }

  const addUsage = (templateUid: any) => {
    const normalizedTemplateUid = String(templateUid || '').trim();
    if (!normalizedTemplateUid) {
      return;
    }
    if (!carry.has(normalizedModelUid)) {
      carry.set(normalizedModelUid, new Set<string>());
    }
    carry.get(normalizedModelUid)?.add(normalizedTemplateUid);
  };

  const normalizedOptions =
    _.isPlainObject(options) || Array.isArray(options)
      ? options
      : typeof options === 'string'
        ? JSON.parse(options)
        : {};
  const useTemplate = _.get(normalizedOptions, ['stepParams', 'referenceSettings', 'useTemplate']);
  const useTemplateUid = String(useTemplate?.templateUid || '').trim();
  const useTemplateMode = String(useTemplate?.mode || 'reference').trim() || 'reference';
  if (useTemplateUid && useTemplateMode !== 'copy') {
    addUsage(useTemplateUid);
  }

  const popupGroups = [
    _.get(normalizedOptions, ['stepParams', 'popupSettings']),
    _.get(normalizedOptions, ['stepParams', 'selectExitRecordSettings']),
  ];
  for (const group of popupGroups) {
    if (!group || typeof group !== 'object') {
      continue;
    }
    for (const value of Object.values(group)) {
      const popupTemplateUid = String((value as any)?.popupTemplateUid || '').trim();
      const popupTemplateMode = String((value as any)?.popupTemplateMode || 'reference').trim() || 'reference';
      if (popupTemplateUid && popupTemplateMode !== 'copy') {
        addUsage(popupTemplateUid);
      }
    }
  }

  return carry;
}

export function collectFlowTemplateModelUids(node: any, carry = new Set<string>()) {
  if (!node?.uid) {
    return carry;
  }
  carry.add(String(node.uid));
  for (const child of Object.values(node.subModels || {})) {
    for (const item of _.castArray(child as any)) {
      collectFlowTemplateModelUids(item, carry);
    }
  }
  return carry;
}

export function replaceFlowModelTreeUids(node: any, uidMap: Record<string, string>) {
  const replaceInPlace = (value: any): any => {
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i += 1) {
        value[i] = replaceInPlace(value[i]);
      }
      return value;
    }
    if (value && typeof value === 'object') {
      for (const key of Object.keys(value)) {
        value[key] = replaceInPlace(value[key]);
      }
      return value;
    }
    return typeof value === 'string' && uidMap[value] ? uidMap[value] : value;
  };

  const walk = (current: any) => {
    if (!current || typeof current !== 'object') {
      return current;
    }
    if (typeof current.uid === 'string' && uidMap[current.uid]) {
      current.uid = uidMap[current.uid];
    }
    if (typeof current.parent === 'string' && uidMap[current.parent]) {
      current.parent = uidMap[current.parent];
    }
    if (typeof current.parentId === 'string' && uidMap[current.parentId]) {
      current.parentId = uidMap[current.parentId];
    }
    if (current.stepParams) {
      current.stepParams = replaceInPlace(current.stepParams);
    }
    Object.values(current.subModels || {}).forEach((child) => {
      _.castArray(child as any).forEach((item) => walk(item));
    });
    return current;
  };

  return walk(_.cloneDeep(node));
}

export function stripTemplateInternalOpenViewFields(openView: any) {
  if (!_.isPlainObject(openView)) {
    return openView;
  }
  const hasTemplateState =
    !!String(openView.popupTemplateUid || '').trim() ||
    !!openView.popupTemplateContext ||
    !!String(openView.popupTemplateMode || '').trim();
  return _.omit(openView, [
    'popupTemplateUid',
    'popupTemplateMode',
    'popupTemplateContext',
    'popupTemplateHasFilterByTk',
    'popupTemplateHasSourceId',
    ...(hasTemplateState ? ['uid'] : []),
  ]);
}

export function stripTemplateInternalReferenceSettings(node: any) {
  if (!_.isPlainObject(node?.stepParams?.referenceSettings)) {
    return;
  }
  delete node.stepParams.referenceSettings;
  if (_.isPlainObject(node.stepParams) && !Object.keys(node.stepParams).length) {
    delete node.stepParams;
  }
}

export function findFieldsTemplateReferenceGrid(node: any) {
  return getSingleNodeSubModel(node?.subModels?.grid);
}
