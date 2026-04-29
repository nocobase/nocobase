/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MULTI_VALUE_ASSOCIATION_INTERFACES, SINGLE_VALUE_ASSOCIATION_INTERFACES } from './association-interfaces';
import { normalizeFieldContainerKind } from './field-semantics';
import { getFieldInterface, resolveFieldTargetCollection } from './service-helpers';

export { MULTI_VALUE_ASSOCIATION_INTERFACES, SINGLE_VALUE_ASSOCIATION_INTERFACES } from './association-interfaces';

export type FlowSurfaceFieldBindingScope = 'display' | 'editable' | 'filter';

type FlowSurfaceFieldBindingRule = {
  scope: FlowSurfaceFieldBindingScope;
  modelClassName: string;
  interfaces: string[];
  ownerPlugin?: string;
  isDefault?: boolean;
  order?: number;
  when?: (input: FlowSurfaceResolvedFieldBindingInput) => boolean;
};

type FlowSurfaceResolvedFieldBindingInput = {
  containerUse?: string;
  field: any;
  dataSourceKey?: string;
  enabledPackages?: ReadonlySet<string>;
  getCollection?: (dataSourceKey: string, collectionName: string) => any;
  targetCollection?: any;
};

type FlowSurfaceFieldBindingRuleRecord = FlowSurfaceFieldBindingRule & {
  index: number;
};

export type FlowSurfaceFieldBindingResolution = {
  modelClassName: string;
  ownerPlugin?: string;
  isDefault: boolean;
};

const FILE_MANAGER_PLUGIN = '@nocobase/plugin-file-manager';
const ATTACHMENT_URL_PLUGIN = '@nocobase/plugin-field-attachment-url';
const CODE_PLUGIN = '@nocobase/plugin-field-code';
const FORMULA_PLUGIN = '@nocobase/plugin-field-formula';
const CHINA_REGION_PLUGIN = '@nocobase/plugin-field-china-region';
const MAP_PLUGIN = '@nocobase/plugin-map';
const MARKDOWN_VDITOR_PLUGIN = '@nocobase/plugin-field-markdown-vditor';
const SORT_PLUGIN = '@nocobase/plugin-field-sort';

function getCollectionTemplate(collection: any) {
  return collection?.template || collection?.options?.template;
}

function isAttachmentInterface(field: any) {
  return String(getFieldInterface(field) || '').trim() === 'attachment';
}

function getFieldDataType(field: any) {
  return field?.dataType || field?.options?.dataType;
}

function isNumericFormulaDataType(dataType: any) {
  return ['integer', 'bigInt', 'double', 'decimal', 'number'].includes(String(dataType || '').trim());
}

function resolveTargetCollection(input: FlowSurfaceResolvedFieldBindingInput) {
  if (input.field?.targetCollection) {
    return input.field.targetCollection;
  }
  if (!input.getCollection || !input.dataSourceKey) {
    return null;
  }
  return resolveFieldTargetCollection(input.field, input.dataSourceKey, input.getCollection);
}

function normalizeBindingContainerUse(containerUse?: string) {
  const normalized = String(containerUse || '').trim();
  if (normalized === 'FormAssociationItemModel') {
    return 'DetailsItemModel';
  }
  return normalized;
}

function resolveBindingScope(containerUse?: string): FlowSurfaceFieldBindingScope | null {
  switch (normalizeFieldContainerKind(normalizeBindingContainerUse(containerUse))) {
    case 'table':
    case 'details':
      return 'display';
    case 'form':
      return 'editable';
    case 'filter-form':
      return 'filter';
    default:
      return null;
  }
}

function isRuleAvailable(rule: FlowSurfaceFieldBindingRuleRecord, enabledPackages?: ReadonlySet<string>) {
  if (!rule.ownerPlugin || !enabledPackages) {
    return true;
  }
  return enabledPackages.has(rule.ownerPlugin);
}

function selectPreferredDefaultRule(rules: FlowSurfaceFieldBindingRuleRecord[]) {
  if (!rules.length) {
    return null;
  }
  return rules.find((rule) => typeof rule.when === 'function') || rules[0];
}

const FIELD_BINDING_RULE_DEFINITIONS = [
  {
    scope: 'display',
    modelClassName: 'DisplayPreviewFieldModel',
    interfaces: ['attachment', 'attachmentURL', 'm2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'mbm'],
    ownerPlugin: FILE_MANAGER_PLUGIN,
    isDefault: true,
    when: ({ field, targetCollection }) =>
      isAttachmentInterface(field) || !targetCollection || getCollectionTemplate(targetCollection) === 'file',
  },
  {
    scope: 'editable',
    modelClassName: 'UploadFieldModel',
    interfaces: ['attachment', 'm2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy', 'mbm'],
    ownerPlugin: FILE_MANAGER_PLUGIN,
    isDefault: true,
    order: 30,
    when: ({ field, targetCollection }) =>
      isAttachmentInterface(field) || !targetCollection || getCollectionTemplate(targetCollection) === 'file',
  },
  {
    scope: 'editable',
    modelClassName: 'AttachmentURLFieldModel',
    interfaces: ['attachmentURL'],
    ownerPlugin: ATTACHMENT_URL_PLUGIN,
    isDefault: true,
  },
  {
    scope: 'display',
    modelClassName: 'DisplayTextFieldModel',
    interfaces: ['attachmentURL'],
    ownerPlugin: ATTACHMENT_URL_PLUGIN,
    isDefault: true,
  },
  {
    scope: 'editable',
    modelClassName: 'CodeFieldModel',
    interfaces: ['code'],
    ownerPlugin: CODE_PLUGIN,
    isDefault: true,
  },
  {
    scope: 'display',
    modelClassName: 'DisplayCodeFieldModel',
    interfaces: ['code'],
    ownerPlugin: CODE_PLUGIN,
    isDefault: true,
  },
  {
    scope: 'filter',
    modelClassName: 'InputFieldModel',
    interfaces: ['code'],
    ownerPlugin: CODE_PLUGIN,
    isDefault: true,
  },
  {
    scope: 'editable',
    modelClassName: 'VditorFieldModel',
    interfaces: ['vditor', 'markdown'],
    ownerPlugin: MARKDOWN_VDITOR_PLUGIN,
    isDefault: true,
  },
  {
    scope: 'display',
    modelClassName: 'DisplayVditorFieldModel',
    interfaces: ['vditor', 'markdown'],
    ownerPlugin: MARKDOWN_VDITOR_PLUGIN,
    isDefault: true,
  },
  {
    scope: 'editable',
    modelClassName: 'ChinaRegionFieldModel',
    interfaces: ['chinaRegion'],
    ownerPlugin: CHINA_REGION_PLUGIN,
    isDefault: true,
  },
  {
    scope: 'display',
    modelClassName: 'DisplayChinaRegionFieldModel',
    interfaces: ['chinaRegion'],
    ownerPlugin: CHINA_REGION_PLUGIN,
    isDefault: true,
  },
  {
    scope: 'editable',
    modelClassName: 'SortFieldModel',
    interfaces: ['sort'],
    ownerPlugin: SORT_PLUGIN,
    isDefault: true,
  },
  {
    scope: 'display',
    modelClassName: 'DisplayNumberFieldModel',
    interfaces: ['sort'],
    ownerPlugin: SORT_PLUGIN,
    isDefault: true,
  },
  {
    scope: 'editable',
    modelClassName: 'PointFieldModel',
    interfaces: ['point'],
    ownerPlugin: MAP_PLUGIN,
    isDefault: true,
  },
  {
    scope: 'editable',
    modelClassName: 'CircleFieldModel',
    interfaces: ['circle'],
    ownerPlugin: MAP_PLUGIN,
    isDefault: true,
  },
  {
    scope: 'editable',
    modelClassName: 'PolygonFieldModel',
    interfaces: ['polygon'],
    ownerPlugin: MAP_PLUGIN,
    isDefault: true,
  },
  {
    scope: 'editable',
    modelClassName: 'LineStringFieldModel',
    interfaces: ['lineString'],
    ownerPlugin: MAP_PLUGIN,
    isDefault: true,
  },
  {
    scope: 'display',
    modelClassName: 'DisplayPointFieldModel',
    interfaces: ['point'],
    ownerPlugin: MAP_PLUGIN,
    isDefault: true,
  },
  {
    scope: 'display',
    modelClassName: 'DisplayCircleFieldModel',
    interfaces: ['circle'],
    ownerPlugin: MAP_PLUGIN,
    isDefault: true,
  },
  {
    scope: 'display',
    modelClassName: 'DisplayPolygonFieldModel',
    interfaces: ['polygon'],
    ownerPlugin: MAP_PLUGIN,
    isDefault: true,
  },
  {
    scope: 'display',
    modelClassName: 'DisplayLineStringFieldModel',
    interfaces: ['lineString'],
    ownerPlugin: MAP_PLUGIN,
    isDefault: true,
  },
  {
    scope: 'editable',
    modelClassName: 'FormulaFieldModel',
    interfaces: ['formula'],
    ownerPlugin: FORMULA_PLUGIN,
    isDefault: true,
  },
  {
    scope: 'display',
    modelClassName: 'DisplayCheckboxFieldModel',
    interfaces: ['formula'],
    ownerPlugin: FORMULA_PLUGIN,
    isDefault: true,
    when: ({ field }) => getFieldDataType(field) === 'boolean',
  },
  {
    scope: 'display',
    modelClassName: 'DisplayDateTimeFieldModel',
    interfaces: ['formula'],
    ownerPlugin: FORMULA_PLUGIN,
    isDefault: true,
    when: ({ field }) => getFieldDataType(field) === 'date',
  },
  {
    scope: 'display',
    modelClassName: 'DisplayTextFieldModel',
    interfaces: ['formula'],
    ownerPlugin: FORMULA_PLUGIN,
    isDefault: true,
    when: ({ field }) => getFieldDataType(field) === 'string',
  },
  {
    scope: 'display',
    modelClassName: 'DisplayNumberFieldModel',
    interfaces: ['formula'],
    ownerPlugin: FORMULA_PLUGIN,
    isDefault: true,
    when: ({ field }) => ['double', 'bigInt', 'integer'].includes(String(getFieldDataType(field) || '').trim()),
  },
  {
    scope: 'filter',
    modelClassName: 'InputFieldModel',
    interfaces: ['formula'],
    ownerPlugin: FORMULA_PLUGIN,
    when: ({ field }) => {
      const dataType = String(getFieldDataType(field) || '').trim();
      return !['date', 'boolean', 'integer', 'bigInt', 'double', 'decimal', 'number'].includes(dataType);
    },
  },
  {
    scope: 'filter',
    modelClassName: 'DateTimeFilterFieldModel',
    interfaces: ['formula'],
    ownerPlugin: FORMULA_PLUGIN,
    when: ({ field }) => getFieldDataType(field) === 'date',
  },
  {
    scope: 'filter',
    modelClassName: 'CheckboxFieldModel',
    interfaces: ['formula'],
    ownerPlugin: FORMULA_PLUGIN,
    when: ({ field }) => getFieldDataType(field) === 'boolean',
  },
  {
    scope: 'filter',
    modelClassName: 'NumberFieldModel',
    interfaces: ['formula'],
    ownerPlugin: FORMULA_PLUGIN,
    when: ({ field }) => isNumericFormulaDataType(getFieldDataType(field)),
  },
] satisfies FlowSurfaceFieldBindingRule[];

const FIELD_BINDING_RULES: FlowSurfaceFieldBindingRuleRecord[] = FIELD_BINDING_RULE_DEFINITIONS.map((rule, index) => ({
  ...rule,
  index,
}));

export function getRegisteredFieldUses(
  scope?: FlowSurfaceFieldBindingScope,
  enabledPackages?: ReadonlySet<string>,
): ReadonlySet<string> {
  const uses = new Set<string>();
  FIELD_BINDING_RULES.forEach((rule) => {
    if (scope && rule.scope !== scope) {
      return;
    }
    if (!isRuleAvailable(rule, enabledPackages)) {
      return;
    }
    uses.add(rule.modelClassName);
  });
  return uses;
}

export function resolveRegisteredFieldBinding(input: {
  containerUse?: string;
  field: any;
  dataSourceKey?: string;
  enabledPackages?: ReadonlySet<string>;
  getCollection?: (dataSourceKey: string, collectionName: string) => any;
  useStrictOnly?: boolean;
}): FlowSurfaceFieldBindingResolution | null {
  const scope = resolveBindingScope(input.containerUse);
  const fieldInterface = String(getFieldInterface(input.field) || '').trim();
  if (!scope || !fieldInterface) {
    return null;
  }

  const targetCollection = resolveTargetCollection(input);
  const candidates = FIELD_BINDING_RULES.filter((rule) => {
    if (rule.scope !== scope) {
      return false;
    }
    if (!rule.interfaces.includes(fieldInterface)) {
      return false;
    }
    if (!isRuleAvailable(rule, input.enabledPackages)) {
      return false;
    }
    if (!rule.when) {
      return true;
    }
    return rule.when({
      ...input,
      targetCollection,
    });
  }).sort((a, b) => {
    const orderDelta = Number(a.order || 0) - Number(b.order || 0);
    return orderDelta || a.index - b.index;
  });

  const defaultRule = selectPreferredDefaultRule(candidates.filter((rule) => rule.isDefault));
  if (defaultRule) {
    return {
      modelClassName: defaultRule.modelClassName,
      ownerPlugin: defaultRule.ownerPlugin,
      isDefault: true,
    };
  }

  if (input.useStrictOnly) {
    return null;
  }

  const fallbackRule = candidates[0];
  if (!fallbackRule) {
    return null;
  }

  return {
    modelClassName: fallbackRule.modelClassName,
    ownerPlugin: fallbackRule.ownerPlugin,
    isDefault: !!fallbackRule.isDefault,
  };
}
