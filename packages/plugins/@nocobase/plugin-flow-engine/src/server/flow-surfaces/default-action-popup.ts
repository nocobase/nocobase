/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { MULTI_VALUE_ASSOCIATION_INTERFACES } from './field-semantics';
import { getFieldInterface, getFieldName, getFieldType } from './service-helpers';

export type FlowSurfaceDefaultActionPopupType = 'addNew' | 'view' | 'edit';
export type FlowSurfaceDefaultActionPopupUse = 'AddNewActionModel' | 'ViewActionModel' | 'EditActionModel';

type FlowSurfaceDefaultActionPopupSubmitAction = {
  key: string;
  type: 'submit';
  settings: {
    title: string;
    type: string;
    confirm: boolean;
  };
};

export type FlowSurfaceDefaultActionPopupConfig = {
  type: FlowSurfaceDefaultActionPopupType;
  use: FlowSurfaceDefaultActionPopupUse;
  defaultButtonTitle: string;
  defaultPopupTabTitle: string;
  blockKey: string;
  blockType: 'createForm' | 'editForm' | 'details';
  blockUse: 'CreateFormModel' | 'EditFormModel' | 'DetailsBlockModel';
  resourceBinding: 'currentCollection' | 'currentRecord';
  blockSettings: Record<string, any>;
  submitAction?: FlowSurfaceDefaultActionPopupSubmitAction;
};

export type FlowSurfaceDefaultActionPopupFieldCandidate = {
  field?: any;
  fieldPath?: string;
};

export type FlowSurfaceDefaultActionPopupFieldGroupCandidate = {
  key?: string;
  title: string;
  fields: string[];
};

type FlowSurfaceDefaultActionPopupFieldFilterOptions = {
  excludeAuditTimestampFields?: boolean;
  excludeAssociationFields?: boolean;
};

type FlowSurfaceDefaultActionPopupFieldsInput =
  | string[]
  | {
      fieldPaths?: string[];
      fieldGroups?: FlowSurfaceDefaultActionPopupFieldGroupCandidate[];
    };

const DEFAULT_ACTION_POPUP_SYSTEM_FIELD_NAMES = new Set(['id', 'createdBy', 'createdById', 'updatedBy', 'updatedById']);

const DEFAULT_ACTION_POPUP_SYSTEM_FIELD_INTERFACES = new Set([
  'id',
  'snowflakeId',
  'createdBy',
  'createdById',
  'updatedBy',
  'updatedById',
]);

const DEFAULT_ACTION_POPUP_AUDIT_TIMESTAMP_FIELD_NAMES = new Set(['createdAt', 'updatedAt']);

const DEFAULT_ACTION_POPUP_AUDIT_TIMESTAMP_FIELD_INTERFACES = new Set(['createdAt', 'updatedAt']);

const FLOW_SURFACE_DEFAULT_ACTION_POPUP_CONFIGS: FlowSurfaceDefaultActionPopupConfig[] = [
  {
    type: 'addNew',
    use: 'AddNewActionModel',
    defaultButtonTitle: '{{t("Add new")}}',
    defaultPopupTabTitle: '{{t("Add new")}}',
    blockKey: 'defaultCreateForm',
    blockType: 'createForm',
    blockUse: 'CreateFormModel',
    resourceBinding: 'currentCollection',
    blockSettings: {
      layout: 'vertical',
      colon: false,
      assignRules: [],
    },
    submitAction: {
      key: 'defaultSubmit',
      type: 'submit',
      settings: {
        title: '{{t("Submit")}}',
        type: 'primary',
        confirm: false,
      },
    },
  },
  {
    type: 'view',
    use: 'ViewActionModel',
    defaultButtonTitle: '{{t("View")}}',
    defaultPopupTabTitle: '{{t("Details")}}',
    blockKey: 'defaultDetails',
    blockType: 'details',
    blockUse: 'DetailsBlockModel',
    resourceBinding: 'currentRecord',
    blockSettings: {
      layout: 'vertical',
      colon: true,
      dataScope: {
        logic: '$and',
        items: [],
      },
      linkageRules: [],
    },
  },
  {
    type: 'edit',
    use: 'EditActionModel',
    defaultButtonTitle: '{{t("Edit")}}',
    defaultPopupTabTitle: '{{t("Edit")}}',
    blockKey: 'defaultEditForm',
    blockType: 'editForm',
    blockUse: 'EditFormModel',
    resourceBinding: 'currentRecord',
    blockSettings: {
      layout: 'vertical',
      colon: false,
      assignRules: [],
      dataScope: {
        logic: '$and',
        items: [],
      },
    },
    submitAction: {
      key: 'defaultSubmit',
      type: 'submit',
      settings: {
        title: '{{t("Submit")}}',
        type: 'primary',
        confirm: false,
      },
    },
  },
];

export const FLOW_SURFACE_DEFAULT_ACTION_POPUP_TYPES = new Set(
  FLOW_SURFACE_DEFAULT_ACTION_POPUP_CONFIGS.map((item) => item.type),
);
export const FLOW_SURFACE_DEFAULT_ACTION_POPUP_USES = new Set(
  FLOW_SURFACE_DEFAULT_ACTION_POPUP_CONFIGS.map((item) => item.use),
);

const FLOW_SURFACE_DEFAULT_ACTION_POPUP_CONFIG_BY_USE = FLOW_SURFACE_DEFAULT_ACTION_POPUP_CONFIGS.reduce(
  (result, item) => {
    result[item.use] = item;
    return result;
  },
  {} as Record<FlowSurfaceDefaultActionPopupUse, FlowSurfaceDefaultActionPopupConfig>,
);

const FLOW_SURFACE_DEFAULT_ACTION_POPUP_LEGACY_BUTTON_TITLES: Record<FlowSurfaceDefaultActionPopupUse, string> = {
  AddNewActionModel: 'Add new',
  ViewActionModel: 'View',
  EditActionModel: 'Edit',
};

export function isFlowSurfaceDefaultActionPopupType(type?: string): type is FlowSurfaceDefaultActionPopupType {
  return FLOW_SURFACE_DEFAULT_ACTION_POPUP_TYPES.has(String(type || '').trim() as FlowSurfaceDefaultActionPopupType);
}

export function isFlowSurfaceDefaultActionPopupUse(use?: string): use is FlowSurfaceDefaultActionPopupUse {
  return FLOW_SURFACE_DEFAULT_ACTION_POPUP_USES.has(String(use || '').trim() as FlowSurfaceDefaultActionPopupUse);
}

export function getFlowSurfaceDefaultActionPopupConfigByUse(use?: string) {
  const normalizedUse = String(use || '').trim();
  if (!isFlowSurfaceDefaultActionPopupUse(normalizedUse)) {
    return undefined;
  }
  return FLOW_SURFACE_DEFAULT_ACTION_POPUP_CONFIG_BY_USE[normalizedUse];
}

export function resolveFlowSurfaceDefaultActionPopupTabTitle(use?: string, currentTitle?: string | null) {
  const actionConfig = getFlowSurfaceDefaultActionPopupConfigByUse(use);
  if (!actionConfig) {
    return undefined;
  }
  const normalizedTitle = String(currentTitle || '').trim();
  const legacyDefaultButtonTitle =
    FLOW_SURFACE_DEFAULT_ACTION_POPUP_LEGACY_BUTTON_TITLES[actionConfig.use as FlowSurfaceDefaultActionPopupUse];
  if (
    normalizedTitle &&
    normalizedTitle !== actionConfig.defaultButtonTitle &&
    normalizedTitle !== legacyDefaultButtonTitle
  ) {
    return normalizedTitle;
  }
  return actionConfig.defaultPopupTabTitle;
}

function isFlowSurfaceDefaultActionPopupSystemField(field: any) {
  const fieldName = String(getFieldName(field) || '').trim();
  const fieldInterface = String(getFieldInterface(field) || '').trim();
  return (
    DEFAULT_ACTION_POPUP_SYSTEM_FIELD_NAMES.has(fieldName) ||
    DEFAULT_ACTION_POPUP_SYSTEM_FIELD_INTERFACES.has(fieldInterface) ||
    !!field?.primaryKey ||
    !!field?.options?.primaryKey ||
    !!field?.autoIncrement ||
    !!field?.options?.autoIncrement
  );
}

function isFlowSurfaceDefaultActionPopupTechnicalIdField(field: any) {
  const fieldName = String(getFieldName(field) || '').trim();
  const fieldInterface = String(getFieldInterface(field) || '').trim();
  return (
    fieldName === 'id' ||
    fieldInterface === 'id' ||
    fieldInterface === 'snowflakeId' ||
    !!field?.primaryKey ||
    !!field?.options?.primaryKey ||
    !!field?.autoIncrement ||
    !!field?.options?.autoIncrement
  );
}

function isFlowSurfaceDefaultActionPopupAuditTimestampField(field: any) {
  const fieldName = String(getFieldName(field) || '').trim();
  const fieldInterface = String(getFieldInterface(field) || '').trim();
  return (
    DEFAULT_ACTION_POPUP_AUDIT_TIMESTAMP_FIELD_NAMES.has(fieldName) ||
    DEFAULT_ACTION_POPUP_AUDIT_TIMESTAMP_FIELD_INTERFACES.has(fieldInterface)
  );
}

function isFlowSurfaceDefaultActionPopupMultiValueAssociationField(field: any) {
  const fieldInterface = String(getFieldInterface(field) || '').trim();
  return MULTI_VALUE_ASSOCIATION_INTERFACES.has(fieldInterface);
}

function isFlowSurfaceDefaultActionPopupAssociationField(field: any) {
  const fieldType = String(getFieldType(field) || '').trim();
  return (
    fieldType === 'belongsTo' || fieldType === 'hasOne' || fieldType === 'hasMany' || fieldType === 'belongsToMany'
  );
}

function collectFlowSurfaceDefaultActionPopupAssociationForeignKeys(
  candidates: FlowSurfaceDefaultActionPopupFieldCandidate[],
) {
  return new Set(
    candidates
      .map((candidate) => candidate?.field)
      .filter((field) => getFieldType(field) === 'belongsTo')
      .map((field) => String(field?.foreignKey || field?.options?.foreignKey || '').trim())
      .filter(Boolean),
  );
}

function isFlowSurfaceDefaultActionPopupAssociationForeignKeyField(
  field: any,
  associationForeignKeys: ReadonlySet<string>,
) {
  const fieldName = String(getFieldName(field) || '').trim();
  return !!fieldName && associationForeignKeys.has(fieldName);
}

export function pickFlowSurfaceDefaultActionPopupFieldPaths(
  candidates: FlowSurfaceDefaultActionPopupFieldCandidate[],
  options: FlowSurfaceDefaultActionPopupFieldFilterOptions = {},
) {
  return filterFlowSurfaceDefaultActionPopupFieldCandidates(candidates, options)
    .map((candidate) => String(candidate?.fieldPath || '').trim())
    .filter(Boolean);
}

function filterFlowSurfaceDefaultActionPopupFieldCandidates(
  candidates: FlowSurfaceDefaultActionPopupFieldCandidate[],
  options: FlowSurfaceDefaultActionPopupFieldFilterOptions = {},
) {
  const associationForeignKeys = collectFlowSurfaceDefaultActionPopupAssociationForeignKeys(candidates);
  const preferredCandidates = candidates.filter(
    (candidate) =>
      !isFlowSurfaceDefaultActionPopupSystemField(candidate.field) &&
      (!options.excludeAuditTimestampFields || !isFlowSurfaceDefaultActionPopupAuditTimestampField(candidate.field)) &&
      (!options.excludeAssociationFields || !isFlowSurfaceDefaultActionPopupAssociationField(candidate.field)) &&
      !isFlowSurfaceDefaultActionPopupMultiValueAssociationField(candidate.field) &&
      !isFlowSurfaceDefaultActionPopupAssociationForeignKeyField(candidate.field, associationForeignKeys),
  );
  const fallbackCandidates = candidates.filter(
    (candidate) =>
      !isFlowSurfaceDefaultActionPopupTechnicalIdField(candidate.field) &&
      (!options.excludeAuditTimestampFields || !isFlowSurfaceDefaultActionPopupAuditTimestampField(candidate.field)) &&
      (!options.excludeAssociationFields || !isFlowSurfaceDefaultActionPopupAssociationField(candidate.field)) &&
      !isFlowSurfaceDefaultActionPopupMultiValueAssociationField(candidate.field) &&
      !isFlowSurfaceDefaultActionPopupAssociationForeignKeyField(candidate.field, associationForeignKeys),
  );
  const baseCandidates = preferredCandidates.length ? preferredCandidates : fallbackCandidates;
  return baseCandidates.filter((candidate) => String(candidate?.fieldPath || '').trim());
}

export function pickFlowSurfaceDefaultActionPopupFieldGroups(
  candidates: FlowSurfaceDefaultActionPopupFieldCandidate[],
  fieldGroups: FlowSurfaceDefaultActionPopupFieldGroupCandidate[] | undefined,
  options: FlowSurfaceDefaultActionPopupFieldFilterOptions = {},
) {
  const allowedFieldPaths = new Set(
    filterFlowSurfaceDefaultActionPopupFieldCandidates(candidates, options).map((candidate) =>
      String(candidate?.fieldPath || '').trim(),
    ),
  );
  const usedFieldPaths = new Set<string>();
  return _.castArray(fieldGroups || []).flatMap((group) => {
    const title = String(group?.title || '').trim();
    if (!title) {
      return [];
    }
    const fields = _.castArray(group?.fields || [])
      .map((field) => String(field || '').trim())
      .filter((field) => {
        if (!field || !allowedFieldPaths.has(field) || usedFieldPaths.has(field)) {
          return false;
        }
        usedFieldPaths.add(field);
        return true;
      });
    if (!fields.length) {
      return [];
    }
    return [
      _.pickBy(
        {
          key: String(group?.key || '').trim() || undefined,
          title,
          fields,
        },
        (value) => !_.isUndefined(value),
      ) as FlowSurfaceDefaultActionPopupFieldGroupCandidate,
    ];
  });
}

function normalizeDefaultActionPopupFieldsInput(input: FlowSurfaceDefaultActionPopupFieldsInput) {
  if (Array.isArray(input)) {
    return {
      fieldPaths: input,
      fieldGroups: [],
    };
  }
  return {
    fieldPaths: _.castArray(input?.fieldPaths || [])
      .map((field) => String(field || '').trim())
      .filter(Boolean),
    fieldGroups: _.castArray(input?.fieldGroups || []).filter((group) => _.isPlainObject(group)),
  };
}

export function buildFlowSurfaceDefaultActionPopupBlocks(
  use: string | undefined,
  fieldsInput: FlowSurfaceDefaultActionPopupFieldsInput,
) {
  const actionConfig = getFlowSurfaceDefaultActionPopupConfigByUse(use);
  if (!actionConfig) {
    return [];
  }
  const { fieldPaths, fieldGroups } = normalizeDefaultActionPopupFieldsInput(fieldsInput);
  const hasFieldGroups = !!fieldGroups.length;
  return [
    _.pickBy(
      {
        key: actionConfig.blockKey,
        type: actionConfig.blockType,
        resource: {
          binding: actionConfig.resourceBinding,
        },
        settings: _.cloneDeep(actionConfig.blockSettings),
        fields: hasFieldGroups ? undefined : fieldPaths,
        fieldGroups: hasFieldGroups ? fieldGroups : undefined,
        actions: actionConfig.submitAction ? [_.cloneDeep(actionConfig.submitAction)] : undefined,
      },
      (value) => !_.isUndefined(value),
    ),
  ];
}

export function hasFlowSurfaceInlinePopupTemplate(popup?: Record<string, any>) {
  return typeof popup !== 'undefined' && typeof popup?.template !== 'undefined';
}

export function hasFlowSurfaceInlinePopupBlocks(popup?: Record<string, any>) {
  return Array.isArray(popup?.blocks) && popup.blocks.length > 0;
}
