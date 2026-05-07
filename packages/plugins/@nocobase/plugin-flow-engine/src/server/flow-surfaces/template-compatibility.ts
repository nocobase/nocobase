/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import {
  getCollectionName,
  getFieldTarget,
  resolveFieldFromCollection,
  resolveFieldTargetCollection,
} from './service-helpers';

const FLOW_TEMPLATE_ROOT_USE_FAMILIES: Record<string, string> = {
  CreateFormModel: 'crudForm',
  EditFormModel: 'crudForm',
  ApplyFormModel: 'approvalForm',
  ProcessFormModel: 'approvalForm',
};

export type FlowSurfaceTemplateCompatibilityRow = {
  uid?: string;
  useModel?: string;
  dataSourceKey?: string;
  collectionName?: string;
  associationName?: string;
};

export type FlowSurfaceTemplateResourceInfo = {
  dataSourceKey?: string;
  collectionName?: string;
  associationName?: string;
};

export type FlowSurfaceTemplateAssociationMatchMode =
  | 'none'
  | 'exactIfTemplateHasAssociationName'
  | 'associationResourceOnly';

export function getFlowTemplateRootUseFamily(use: any) {
  const normalizedUse = String(use || '').trim();
  return FLOW_TEMPLATE_ROOT_USE_FAMILIES[normalizedUse] || normalizedUse;
}

export function areFlowTemplateRootUsesCompatible(hostUse: any, templateUse: any) {
  const normalizedHostUse = String(hostUse || '').trim();
  const normalizedTemplateUse = String(templateUse || '').trim();
  if (!normalizedHostUse || !normalizedTemplateUse) {
    return true;
  }
  return getFlowTemplateRootUseFamily(normalizedHostUse) === getFlowTemplateRootUseFamily(normalizedTemplateUse);
}

export function buildTemplateMissingResourceReason() {
  return 'missing data source or collection information';
}

export function buildTemplateDataSourceMismatchReason(expectedDataSourceKey: string, actualDataSourceKey: string) {
  return `data source mismatch: expected '${expectedDataSourceKey}', got '${actualDataSourceKey}'`;
}

export function buildTemplateCollectionMismatchReason(expectedCollectionName: string, actualCollectionName: string) {
  return `collection mismatch: expected '${expectedCollectionName}', got '${actualCollectionName}'`;
}

export function buildTemplateAssociationMismatchReason(expectedAssociationName?: string, actualAssociationName?: string) {
  return `association mismatch: expected '${expectedAssociationName || '(none)'}', got '${actualAssociationName || '(none)'}'`;
}

export function buildTemplateMissingContextReason(param: string) {
  return `cannot resolve template parameter '${param}'`;
}

export function resolveAssociationTargetResourceInfo(
  input: FlowSurfaceTemplateResourceInfo,
  options: {
    getCollection: (dataSourceKey: string, collectionName: string) => any;
  },
): FlowSurfaceTemplateResourceInfo {
  const dataSourceKey = String(input?.dataSourceKey || '').trim() || undefined;
  const collectionName = String(input?.collectionName || '').trim() || undefined;
  const associationName = String(input?.associationName || '').trim() || undefined;
  if (!associationName) {
    return {
      dataSourceKey,
      collectionName,
    };
  }

  const parts = associationName.split('.').filter(Boolean);
  const baseCollectionName = (parts.length > 1 ? parts[0] : collectionName) || undefined;
  const fieldPath = (parts.length > 1 ? parts.slice(1).join('.') : associationName) || undefined;
  if (!dataSourceKey || !baseCollectionName || !fieldPath) {
    return {
      dataSourceKey,
      collectionName,
      associationName,
    };
  }

  const baseCollection = options.getCollection(dataSourceKey, baseCollectionName);
  const associationField = resolveFieldFromCollection(baseCollection, fieldPath);
  const targetCollection = resolveFieldTargetCollection(
    associationField,
    dataSourceKey,
    (resolvedDsKey, targetCollectionName) => options.getCollection(resolvedDsKey, targetCollectionName),
  );

  return {
    dataSourceKey:
      targetCollection?.dataSourceKey || targetCollection?.options?.dataSourceKey || dataSourceKey,
    collectionName:
      getCollectionName(targetCollection) || getFieldTarget(associationField) || collectionName || baseCollectionName,
    associationName,
  };
}

export function resolveTemplateResourceInfo(
  input: FlowSurfaceTemplateResourceInfo,
  options: {
    getCollection: (dataSourceKey: string, collectionName: string) => any;
  },
) {
  return resolveAssociationTargetResourceInfo(input, options);
}

export function resolveBlockTemplateExpectedResourceInfo(
  node: any,
  options: {
    resolveTemplateResourceInfo: (input: FlowSurfaceTemplateResourceInfo) => FlowSurfaceTemplateResourceInfo;
  },
) {
  const init = _.get(node, ['stepParams', 'resourceSettings', 'init']) || {};
  return options.resolveTemplateResourceInfo({
    dataSourceKey: String(init.dataSourceKey || '').trim() || undefined,
    collectionName: String(init.collectionName || '').trim() || undefined,
    associationName: String(init.associationName || '').trim() || undefined,
  });
}

export function getTemplateResourceCompatibilityDisabledReason(
  template: FlowSurfaceTemplateCompatibilityRow,
  expected: FlowSurfaceTemplateResourceInfo,
  options: {
    associationMatch?: FlowSurfaceTemplateAssociationMatchMode;
    checkResource?: boolean;
    resolveTemplateResourceInfo: (input: FlowSurfaceTemplateResourceInfo) => FlowSurfaceTemplateResourceInfo;
  },
) {
  const associationMatch = options.associationMatch || 'none';
  const checkResource = options.checkResource !== false;
  const templateAssociationName = String(template?.associationName || '').trim() || undefined;
  const expectedAssociationName = String(expected?.associationName || '').trim() || undefined;

  const getAssociationMismatchReason = () => {
    if (associationMatch === 'none') {
      return undefined;
    }
    if (associationMatch === 'exactIfTemplateHasAssociationName') {
      if (!templateAssociationName || templateAssociationName === expectedAssociationName) {
        return undefined;
      }
      return buildTemplateAssociationMismatchReason(expectedAssociationName, templateAssociationName);
    }
    const toAssociationResource = (value?: string) => (value && value.includes('.') ? value : undefined);
    const templateAssociationResource = toAssociationResource(templateAssociationName);
    if (!templateAssociationResource) {
      return undefined;
    }
    const expectedAssociationResource = toAssociationResource(expectedAssociationName);
    if (templateAssociationResource === expectedAssociationResource) {
      return undefined;
    }
    return buildTemplateAssociationMismatchReason(expectedAssociationResource, templateAssociationResource);
  };

  if (!checkResource) {
    return getAssociationMismatchReason();
  }

  const templateResource = options.resolveTemplateResourceInfo(template || {});
  const expectedResource = options.resolveTemplateResourceInfo(expected || {});
  if (expectedResource.dataSourceKey && expectedResource.collectionName) {
    if (!templateResource.dataSourceKey || !templateResource.collectionName) {
      return buildTemplateMissingResourceReason();
    }
    if (templateResource.dataSourceKey !== expectedResource.dataSourceKey) {
      return buildTemplateDataSourceMismatchReason(expectedResource.dataSourceKey, templateResource.dataSourceKey);
    }
    if (templateResource.collectionName !== expectedResource.collectionName) {
      return buildTemplateCollectionMismatchReason(expectedResource.collectionName, templateResource.collectionName);
    }
  }

  return getAssociationMismatchReason();
}
