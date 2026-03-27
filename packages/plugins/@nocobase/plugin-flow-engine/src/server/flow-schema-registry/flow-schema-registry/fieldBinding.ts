/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import type {
  FlowFieldBindingConditions,
  FlowFieldBindingContextContribution,
  FlowFieldBindingContribution,
  FlowFieldModelCompatibility,
  FlowSchemaCoverage,
} from '../types';
import { normalizeStringArray } from './utils';

export type RegisteredFieldBindingContext = {
  name: string;
  inherits: string[];
};

export type RegisteredFieldBinding = {
  context: string;
  use: string;
  interfaces: string[];
  isDefault: boolean;
  order?: number;
  conditions?: FlowFieldBindingConditions;
  defaultProps?: any;
  source: FlowSchemaCoverage['source'];
};

function normalizeFieldBindingConditions(
  conditions?: FlowFieldBindingConditions,
): FlowFieldBindingConditions | undefined {
  if (!conditions || typeof conditions !== 'object' || Array.isArray(conditions)) {
    return undefined;
  }

  const normalized = _.pickBy(
    {
      association: typeof conditions.association === 'boolean' ? conditions.association : undefined,
      fieldTypes: normalizeStringArray(conditions.fieldTypes),
      targetCollectionTemplateIn: normalizeStringArray(conditions.targetCollectionTemplateIn),
      targetCollectionTemplateNotIn: normalizeStringArray(conditions.targetCollectionTemplateNotIn),
    },
    (value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined;
    },
  ) as FlowFieldBindingConditions;

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function normalizeFieldBindingContextContribution(
  contribution?: FlowFieldBindingContextContribution,
  fallbackName?: string,
): RegisteredFieldBindingContext | undefined {
  const name = String(contribution?.name || fallbackName || '').trim();
  if (!name) {
    return undefined;
  }

  return {
    name,
    inherits: normalizeStringArray(contribution?.inherits),
  };
}

export function normalizeFieldBindingContribution(
  contribution?: FlowFieldBindingContribution,
  source: FlowSchemaCoverage['source'] = 'official',
): RegisteredFieldBinding | undefined {
  const context = String(contribution?.context || '').trim();
  const use = String(contribution?.use || '').trim();
  const interfaces = normalizeStringArray(contribution?.interfaces);
  if (!context || !use || interfaces.length === 0) {
    return undefined;
  }

  return {
    context,
    use,
    interfaces,
    isDefault: contribution?.isDefault === true,
    order: typeof contribution?.order === 'number' ? contribution.order : undefined,
    conditions: normalizeFieldBindingConditions(contribution?.conditions),
    defaultProps: contribution?.defaultProps === undefined ? undefined : _.cloneDeep(contribution.defaultProps),
    source,
  };
}

export function matchesFieldBinding(
  binding: RegisteredFieldBinding,
  options: {
    interface?: string;
    fieldType?: string;
    association?: boolean;
    targetCollectionTemplate?: string;
  },
) {
  if (options.interface && !binding.interfaces.includes('*') && !binding.interfaces.includes(options.interface)) {
    return false;
  }

  const conditions = binding.conditions;
  if (!conditions) {
    return true;
  }

  if (typeof conditions.association === 'boolean' && options.association !== undefined) {
    if (conditions.association !== options.association) {
      return false;
    }
  }

  if (conditions.fieldTypes?.length && options.fieldType) {
    if (!conditions.fieldTypes.includes(options.fieldType)) {
      return false;
    }
  }

  if (conditions.targetCollectionTemplateIn?.length && options.targetCollectionTemplate) {
    if (!conditions.targetCollectionTemplateIn.includes(options.targetCollectionTemplate)) {
      return false;
    }
  }

  if (conditions.targetCollectionTemplateNotIn?.length && options.targetCollectionTemplate) {
    if (conditions.targetCollectionTemplateNotIn.includes(options.targetCollectionTemplate)) {
      return false;
    }
  }

  return true;
}

export function buildFieldModelCompatibility(binding: RegisteredFieldBinding): FlowFieldModelCompatibility {
  const compatibility: FlowFieldModelCompatibility = {
    context: binding.context,
    interfaces: _.cloneDeep(binding.interfaces),
    inheritParentFieldBinding: true,
  };

  if (binding.isDefault) {
    compatibility.isDefault = true;
  }
  if (typeof binding.order === 'number') {
    compatibility.order = binding.order;
  }
  if (typeof binding.conditions?.association === 'boolean') {
    compatibility.association = binding.conditions.association;
  }
  if (binding.conditions?.fieldTypes?.length) {
    compatibility.fieldTypes = _.cloneDeep(binding.conditions.fieldTypes);
  }
  if (binding.conditions?.targetCollectionTemplateIn?.length) {
    compatibility.targetCollectionTemplateIn = _.cloneDeep(binding.conditions.targetCollectionTemplateIn);
  }
  if (binding.conditions?.targetCollectionTemplateNotIn?.length) {
    compatibility.targetCollectionTemplateNotIn = _.cloneDeep(binding.conditions.targetCollectionTemplateNotIn);
  }

  return compatibility;
}
