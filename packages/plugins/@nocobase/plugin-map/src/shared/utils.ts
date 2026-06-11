/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const getSource = (data: Record<string, any>, fields?: string[], type?: string) => {
  const res = fields?.reduce((obj, field, index) => {
    if (index === fields.length - 1 && (type === 'o2m' || type === 'm2m')) {
      return obj?.map((item) => item[field]).filter((v) => v !== null && v !== undefined);
    }
    return obj?.[field];
  }, data);
  return type === 'o2m' || type === 'm2m' ? res : [res];
};

export const runIdleTask = (callback: () => void) => {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      callback();
    });
    return;
  }
  window.setTimeout(callback, 1);
};

export const normalizeErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const { message } = error as { message?: unknown };
    if (typeof message === 'string' && message) {
      return message;
    }
  }
  return fallbackMessage;
};

export const compileTemplate = (value: any, t?: (key: string, options?: any) => string) => {
  if (typeof value !== 'string') {
    return value;
  }
  return value.replace(/\{\{\s*t\(['"]([^'"]+)['"](?:,\s*([^}]+))?\)\s*\}\}/g, (_, key) => {
    return t ? t(key) : key;
  });
};

export const getLabelFormatValue = (uiSchema: any, value: any) => {
  if (value == null) {
    return value;
  }
  const enumOptions = uiSchema?.enum || uiSchema?.['x-component-props']?.options;
  if (Array.isArray(enumOptions)) {
    const matched = enumOptions.find((item) => item?.value === value);
    if (matched) {
      return matched.label ?? matched.title ?? value;
    }
  }
  return value;
};
