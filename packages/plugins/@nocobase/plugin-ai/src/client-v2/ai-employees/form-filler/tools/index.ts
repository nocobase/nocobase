/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ToolsOptions } from '@nocobase/client-v2';
import { randomId } from '@nocobase/flow-engine';

const SUB_TABLE_TEMP_ROW_KEY = '__index__';

type NamePath = Array<string | number>;

type FormFillerPatch = {
  path: NamePath;
  value: unknown;
};

type FormBlockModelLike = FlowModelTreeLike & {
  setFieldsValue?: (values: Record<string, unknown>) => void;
  form?: {
    setFieldsValue?: (values: Record<string, unknown>) => void;
  };
  context?: {
    setFormValues?: (
      patch: Record<string, unknown> | FormFillerPatch[],
      options?: { source?: 'system' },
    ) => Promise<void>;
  };
};

type FlowModelTreeLike = {
  subModels?: Record<string, unknown> | unknown[];
};

type FlowModelLike = FlowModelTreeLike & {
  use?: string;
  fieldPath?: string;
  props?: {
    name?: string | string[];
  };
  context?: {
    fieldPath?: string;
    collectionField?: {
      name?: string;
    };
  };
  constructor?: {
    name?: string;
  };
};

type FlowEngineLike = {
  getModel?: (uid: string, deep?: boolean) => FormBlockModelLike | undefined;
};

type FormFillerAppLike = {
  flowEngine?: FlowEngineLike;
};

type FormFillerParams = {
  form?: unknown;
  data?: unknown;
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function compactFieldPath(path: unknown): string {
  if (Array.isArray(path)) {
    return path.filter((item): item is string => typeof item === 'string' && !!item).join('.');
  }
  return typeof path === 'string' ? path : '';
}

function getSubModels(model?: FlowModelTreeLike): FlowModelLike[] {
  const subModels = model?.subModels;
  if (!subModels) {
    return [];
  }

  const values = Array.isArray(subModels) ? subModels : Object.values(subModels);
  return values
    .flatMap((item) => (Array.isArray(item) ? item : [item]))
    .filter((item): item is FlowModelLike => isPlainRecord(item));
}

function isSubTableModel(model?: FlowModelLike): boolean {
  const modelName = model?.use || model?.constructor?.name;
  return modelName === 'SubTableFieldModel' || modelName === 'PopupSubTableFieldModel';
}

function collectSubTablePaths(model?: FlowModelTreeLike): Set<string> {
  const paths = new Set<string>();
  const queue = getSubModels(model);

  while (queue.length) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    if (isSubTableModel(current)) {
      [current.context?.collectionField?.name, current.context?.fieldPath, current.fieldPath, current.props?.name]
        .map(compactFieldPath)
        .filter(Boolean)
        .forEach((path) => paths.add(path));
    }

    queue.push(...getSubModels(current));
  }

  return paths;
}

function isSubTablePath(path: NamePath, subTablePaths?: Set<string>): boolean {
  const fieldPath = compactFieldPath(path);
  const fieldName = path.filter((item): item is string => typeof item === 'string').at(-1);
  return !!(fieldPath && subTablePaths?.has(fieldPath)) || !!(fieldName && subTablePaths?.has(fieldName));
}

function normalizeSubTableRow(row: Record<string, unknown>): Record<string, unknown> {
  if (row.id != null || row.__is_new__ || row.__is_stored__) {
    return row;
  }

  return {
    ...row,
    __is_new__: true,
    [SUB_TABLE_TEMP_ROW_KEY]: row[SUB_TABLE_TEMP_ROW_KEY] ?? randomId(),
  };
}

function normalizeFieldValue(value: unknown, path: NamePath, subTablePaths?: Set<string>): unknown {
  if (isSubTablePath(path, subTablePaths)) {
    const rows = Array.isArray(value) ? value : [];
    return rows.map((item) => {
      const row = isPlainRecord(item) ? item : { value: item };
      return normalizeSubTableRow(normalizeFormFillerData(row, path, subTablePaths));
    });
  }

  if (Array.isArray(value)) {
    return value.map((item) => (isPlainRecord(item) ? normalizeFormFillerData(item, path, subTablePaths) : item));
  }

  if (isPlainRecord(value)) {
    return normalizeFormFillerData(value, path, subTablePaths);
  }

  return value;
}

export function normalizeFormFillerData(
  data: Record<string, unknown>,
  basePath: NamePath = [],
  subTablePaths?: Set<string>,
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    normalized[key] = normalizeFieldValue(value, [...basePath, key], subTablePaths);
  }
  return normalized;
}

export function buildFormFillerPatches(data: Record<string, unknown>, basePath: NamePath = []): FormFillerPatch[] {
  const patches: FormFillerPatch[] = [];
  for (const [key, value] of Object.entries(data)) {
    const path = [...basePath, key];
    patches.push({ path, value });

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (isPlainRecord(item)) {
          patches.push(...buildFormFillerPatches(item, [...path, index]));
        }
      });
      continue;
    }

    if (isPlainRecord(value)) {
      patches.push(...buildFormFillerPatches(value, path));
    }
  }
  return patches;
}

export const formFillerTool: [string, ToolsOptions] = [
  'formFiller',
  {
    invoke: async (app, params: FormFillerParams) => {
      const { form: uid, data } = params;
      if (typeof uid !== 'string' || !isPlainRecord(data)) {
        return;
      }

      const model = (app as FormFillerAppLike).flowEngine?.getModel?.(uid, true);
      if (!model) {
        return;
      }

      const normalizedData = normalizeFormFillerData(data, [], collectSubTablePaths(model));
      if (typeof model.context?.setFormValues === 'function') {
        await model.context.setFormValues(buildFormFillerPatches(normalizedData), { source: 'system' });
        return;
      }

      if (typeof model.setFieldsValue === 'function') {
        model.setFieldsValue(normalizedData);
        return;
      }

      model.form?.setFieldsValue?.(normalizedData);
    },
  },
];
