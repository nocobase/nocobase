/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DragHandler } from '@nocobase/flow-engine';
import { theme } from 'antd';
import React from 'react';
import { LEGACY_NAMESPACE, NAMESPACE, tExpr } from '../locale';

export const DATE_FIELD_TYPES = [
  'date',
  'datetime',
  'dateOnly',
  'datetimeNoTz',
  'unixTimestamp',
  'createdAt',
  'updatedAt',
];
export const TITLE_FIELD_TYPES = ['string'];
export const PROGRESS_FIELD_TYPES = ['float'];
export const COLOR_FIELD_TYPES = ['select', 'color'];
export const DEFAULT_PRESET_COLOR = '#d9d9d9';

const TIME_SCALE_OPTION_DEFS = [
  { label: 'Hour', value: 'hour' },
  { label: 'Quarter of day', value: 'quarterDay' },
  { label: 'Half of day', value: 'halfDay' },
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'QuarterYear', value: 'quarterYear' },
];

export const getTimeScaleOptions = (translate?: (key: string, options?: Record<string, any>) => string) => {
  return TIME_SCALE_OPTION_DEFS.map((item) => ({
    ...item,
    label: translate
      ? translate(item.label, { ns: [NAMESPACE, LEGACY_NAMESPACE, 'client'], nsMode: 'fallback' })
      : tExpr(item.label),
  }));
};

export const DRAG_HANDLER_TOOLBAR_ITEMS = [
  {
    key: 'drag-handler',
    component: DragHandler as React.ComponentType<any>,
    sort: 1,
  },
];

export const HIDDEN_GANTT_TABLE_SETTING_STEPS = ['quickEdit', 'tableDensity', 'dragSort', 'dragSortBy'];

export const HIDDEN_GANTT_TOP_ACTION_MODELS = new Set(['ExpandCollapseActionModel']);

export const isSupportedByValues = (value: any, values: string[]) => {
  return value && values.includes(value);
};

const hasOwn = (target: Record<string, any>, key: string) => Object.prototype.hasOwnProperty.call(target, key);

const isEmptyFieldName = (value: any) => value === undefined || value === null || value === '';

export const applyGanttFieldNames = (model: any, params: Record<string, any>) => {
  const fieldNames = { ...(model.props?.fieldNames || {}) };
  const syncedFieldStepParams: Record<string, any> = {};

  const setFieldName = (key: string, value: any, optional = false) => {
    if (optional && isEmptyFieldName(value)) {
      delete fieldNames[key];
      params[key] = null;
      syncedFieldStepParams[key] = null;
      return;
    }
    fieldNames[key] = value;
    syncedFieldStepParams[key] = value;
  };

  if (hasOwn(params, 'title')) {
    setFieldName('title', params.title);
  }
  if (hasOwn(params, 'start')) {
    setFieldName('start', params.start);
  }
  if (hasOwn(params, 'end')) {
    setFieldName('end', params.end);
  }
  if (hasOwn(params, 'progress')) {
    setFieldName('progress', params.progress, true);
  }
  if (hasOwn(params, 'color')) {
    setFieldName('color', params.color, true);
  }
  if (hasOwn(params, 'range')) {
    setFieldName('range', params.range || 'day');
  }

  model.setProps({
    fieldNames,
  });

  if (Object.keys(syncedFieldStepParams).length) {
    model.setStepParams?.('ganttSettings', 'fields', syncedFieldStepParams);
  }
};

export const getProgress = (record: any, progressFieldName?: string) => {
  if (!progressFieldName) {
    return 0;
  }
  const value = Number(record?.[progressFieldName]);
  if (!Number.isFinite(value)) {
    return 0;
  }
  const percent = Number((value * 100).toFixed(2));
  return percent > 100 ? 100 : percent || 0;
};

export const normalizeColorValue = (value: any) => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  if (typeof value === 'object') {
    return value.hex || value.hexString || value.color || value.value;
  }

  const color = String(value);
  if (color === 'default') {
    return DEFAULT_PRESET_COLOR;
  }

  return theme.defaultSeed[color] || color;
};

export const getFieldEnumColor = (field: any, value: any) => {
  const normalizedValue = normalizeColorValue(value);
  if (!normalizedValue) {
    return undefined;
  }

  const enumOptions = Array.isArray(field?.uiSchema?.enum) ? field.uiSchema.enum : [];
  const option = enumOptions.find((item: any) => {
    return String(item?.value ?? item?.name ?? item?.id ?? '') === String(normalizedValue);
  });

  return normalizeColorValue(option?.color);
};

export const normalizeEventOpenMode = (value?: string) => {
  if (value === 'modal') {
    return 'dialog';
  }

  if (value === 'page') {
    return 'embed';
  }

  return value === 'dialog' || value === 'embed' ? value : 'drawer';
};
