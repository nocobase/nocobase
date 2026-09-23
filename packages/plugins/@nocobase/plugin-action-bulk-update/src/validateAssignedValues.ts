/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type CollectionFieldLike = {
  enum?: unknown;
  interface?: unknown;
  uiSchema?: unknown;
};

const LOCAL_ENUM_INTERFACES = new Set(['select', 'multipleSelect', 'radioGroup', 'checkboxGroup']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getOptionValue(option: unknown): unknown {
  if (!isRecord(option)) {
    return option;
  }
  if ('value' in option) {
    return option.value;
  }
  return 'label' in option ? option.label : option;
}

function getFieldEnum(field: CollectionFieldLike): unknown[] | undefined {
  if (Array.isArray(field.enum)) {
    return field.enum.map(getOptionValue);
  }

  if (!isRecord(field.uiSchema) || !Array.isArray(field.uiSchema.enum)) {
    return undefined;
  }

  return field.uiSchema.enum.map(getOptionValue);
}

function hasOptionValue(value: unknown, options: unknown[]): boolean {
  if (Array.isArray(value)) {
    return value.every((item) => options.some((option) => Object.is(option, item)));
  }
  return options.some((option) => Object.is(option, value));
}

export function getUnavailableAssignedFieldNames(collection: unknown, assignedValues: unknown): string[] {
  if (!isRecord(collection) || typeof collection.getField !== 'function' || !isRecord(assignedValues)) {
    return [];
  }

  const unavailable: string[] = [];
  for (const [fieldName, value] of Object.entries(assignedValues)) {
    if (value === null || typeof value === 'undefined') {
      continue;
    }

    const field = collection.getField(fieldName);
    if (!isRecord(field)) {
      continue;
    }

    const fieldInterface = field.interface;
    if (typeof fieldInterface !== 'string' || !LOCAL_ENUM_INTERFACES.has(fieldInterface)) {
      continue;
    }

    const options = getFieldEnum(field as CollectionFieldLike);
    if (options && !hasOptionValue(value, options)) {
      unavailable.push(fieldName);
    }
  }

  return unavailable;
}
