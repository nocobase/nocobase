/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';

import { tExpr, translateExpr, useT } from '../locale';

export function convertDatasetFormats(data: Record<string, any>[]) {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      objects: [],
      rows: [],
      columns: [],
    };
  }

  const dimensions = Object.keys(data[0]);
  const categoryKey = dimensions[0];
  const valueKeys = dimensions.slice(1);

  const objects = data;

  const rows = [dimensions];
  data.forEach((row) => {
    rows.push(dimensions.map((k) => row[k]));
  });

  const categories = data.map((row) => row[categoryKey]);
  const columns = [categories];
  valueKeys.forEach((key) => {
    columns.push(data.map((row) => row[key]));
  });

  return {
    dimensions,
    objects,
    rows,
    columns,
  };
}

/**
 * Normalize ECharts option for dataset-based pie charts.
 * Fixes `{c}` showing `[object Object]` when `dataset.source` is an array of objects by rewriting `{c}` to `{@<valueField>}`.
 */
export function normalizeEChartsOption(option: any) {
  if (!option) return option;

  const dataset = option.dataset;
  const source = Array.isArray(dataset) ? dataset[0]?.source : dataset?.source;
  const seriesRaw = option.series;
  const seriesArr = Array.isArray(seriesRaw) ? seriesRaw : seriesRaw ? [seriesRaw] : [];

  if (!Array.isArray(source) || source.length === 0) return option;
  const first = source[0];
  if (!first || typeof first !== 'object' || Array.isArray(first)) return option;

  const pieSeries = seriesArr.filter((s: any) => s?.type === 'pie');
  if (pieSeries.length === 0) return option;

  const valueField = pieSeries[0]?.encode?.value;
  let valueDim = Array.isArray(valueField) ? valueField[0] : valueField;
  if (typeof valueDim !== 'string' || !valueDim) {
    if (Object.prototype.hasOwnProperty.call(first, 'value')) {
      valueDim = 'value';
    }
  }
  if (typeof valueDim !== 'string' || !valueDim) return option;

  const replaceC = (tpl: string) => (tpl.includes('{c}') ? tpl.replace(/\{c\}/g, '{@' + valueDim + '}') : tpl);

  pieSeries.forEach((s: any) => {
    if (s?.label && typeof s.label.formatter === 'string') {
      s.label.formatter = replaceC(s.label.formatter);
    }
    if (s?.tooltip && typeof s.tooltip.formatter === 'string') {
      s.tooltip.formatter = replaceC(s.tooltip.formatter);
    }
  });

  if (option.tooltip && typeof option.tooltip.formatter === 'string') {
    option.tooltip.formatter = replaceC(option.tooltip.formatter);
  }

  return option;
}

export const formatters = {
  datetime: [
    {
      label: tExpr('YYYY'),
      value: 'YYYY',
    },
    {
      label: tExpr('MM'),
      value: 'MM',
    },
    {
      label: tExpr('DD'),
      value: 'DD',
    },
    {
      label: tExpr('HH:mm'),
      value: 'HH:mm',
    },
    {
      label: tExpr('YYYY-MM'),
      value: 'YYYY-MM',
    },
    {
      label: tExpr('YYYY-MM-DD'),
      value: 'YYYY-MM-DD',
    },
    {
      label: tExpr('YYYY-MM-DD HH:mm'),
      value: 'YYYY-MM-DD HH:mm',
    },
    {
      label: tExpr('YYYY-MM-DD HH:mm:ss'),
      value: 'YYYY-MM-DD HH:mm:ss',
    },

    // 英美格式
    {
      label: tExpr('MM/DD/YYYY'),
      value: 'MM/DD/YYYY',
    },
    {
      label: tExpr('MM/DD/YYYY HH:mm'),
      value: 'MM/DD/YYYY HH:mm',
    },
    {
      label: tExpr('MM/DD/YYYY HH:mm:ss'),
      value: 'MM/DD/YYYY HH:mm:ss',
    },
  ],
  date: [
    {
      label: tExpr('YYYY'),
      value: 'YYYY',
    },
    {
      label: tExpr('MM'),
      value: 'MM',
    },
    {
      label: tExpr('DD'),
      value: 'DD',
    },
    {
      label: tExpr('YYYY-MM'),
      value: 'YYYY-MM',
    },
    {
      label: tExpr('YYYY-MM-DD'),
      value: 'YYYY-MM-DD',
    },
    {
      label: tExpr('MM/DD/YYYY'),
      value: 'MM/DD/YYYY',
    },
  ],
  time: [
    {
      label: tExpr('HH'),
      value: 'HH',
    },
    {
      label: tExpr('HH:mm'),
      value: 'HH:mm',
    },
    {
      label: tExpr('HH:mm:ss'),
      value: 'HH:mm:ss',
    },
  ],
};

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function appendColon(label: string, lang?: string): string {
  if (typeof label !== 'string') {
    return '';
  }
  const trimmed = label.trim();
  if (!trimmed) {
    return '';
  }
  // 先移除末尾已有的半角/全角冒号（以及其后的空白）
  const noColon = trimmed.replace(/[：:]\s*$/u, '');
  const isZh = typeof lang === 'string' && /^zh([-_]|$)/i.test(lang);
  const colon = isZh ? '：' : ':';
  return `${noColon}${colon}`;
}

// 调试日志开关：支持 URL 参数 ?_debug=true 或 localStorage('nocobase.debug')
export const isDebugEnabled = () => {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search || '');
    const q = params.get('_debug');
    if (q === 'true' || q === '1') return true;
    const ls = window.localStorage?.getItem('nocobase.debug');
    if (ls === 'true' || ls === '1') return true;
  } catch {
    // ignore
  }
  return false;
};

// 统一调试日志入口，仅在开启调试时输出
export const debugLog = (...args: any[]) => {
  if (!isDebugEnabled()) return;
  console.log(...args);
};

export const useCompile = () => {
  const t = useT();
  return React.useCallback((source: any) => translateExpr(source, t), [t]);
};

export const parseField = (field: string | string[]) => {
  let target: string;
  let name: string;
  if (!Array.isArray(field)) {
    name = field;
  } else if (field.length === 1) {
    name = field[0];
  } else if (field.length > 1) {
    [target, name] = field;
  }
  return { target, name, alias: target ? `${target}.${name}` : name };
};

export const removeUnparsableFilter = (filter: any) => {
  if (typeof filter === 'object' && filter !== null) {
    if (Array.isArray(filter)) {
      const newLogic = filter.map((condition) => removeUnparsableFilter(condition)).filter(Boolean);
      return newLogic.length > 0 ? newLogic : null;
    }
    const newLogic: any = {};
    for (const [key, rawVal] of Object.entries(filter)) {
      if (typeof key === 'string' && key.trim().length === 0) {
        continue;
      }
      const value = removeUnparsableFilter(rawVal);
      if (
        value !== null &&
        value !== undefined &&
        !(
          typeof value === 'object' &&
          ((Array.isArray(value) && value.length === 0) || Object.keys(value).length === 0)
        )
      ) {
        newLogic[key] = value;
      }
    }
    return Object.keys(newLogic).length > 0 ? newLogic : null;
  }
  if (typeof filter === 'string' && filter.startsWith('{{$nFilter.') && filter.endsWith('}}')) {
    return null;
  }
  return filter;
};

export const isEmptyFilterObject = (filter: any) => {
  if (!filter) return true;
  if (Array.isArray(filter)) return filter.length === 0;
  if (typeof filter === 'object') {
    const keys = Object.keys(filter);
    if (keys.length === 0) return true;
    if (Array.isArray((filter as any).$and) && (filter as any).$and.length === 0) return true;
    if (Array.isArray((filter as any).$or) && (filter as any).$or.length === 0) return true;
  }
  return false;
};
