/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// 纯函数：从 columns 构建字段候选项
export function buildFieldOptions(columns: string[] = []) {
  return (columns || []).map((c) => ({ label: c, value: c }));
}

// 纯函数：清理引用了无效列的字段
export function stripInvalidColumns(builder: any = {}, columns: string[] = []) {
  const next = { ...builder };
  const colSet = new Set(columns || []);
  ['xField', 'yField', 'seriesField', 'pieCategory', 'pieValue'].forEach((k) => {
    if (next[k] && !colSet.has(next[k])) next[k] = undefined;
  });
  return next;
}

// 纯函数：按图表类型规范化（补默认、删无关字段）
export function normalizeBuilder(builder: any = {}, columns: string[] = []) {
  const next: any = stripInvalidColumns(builder, columns);
  const type: 'line' | 'bar' | 'pie' = next.type ?? 'line';

  if (type === 'pie') {
    if (!next.pieCategory && columns[0]) next.pieCategory = columns[0];
    if (!next.pieValue && columns[1]) next.pieValue = columns[1];
    if (next.pieRadiusInner == null) next.pieRadiusInner = 0;
    if (next.pieRadiusOuter == null) next.pieRadiusOuter = 70;
    delete next.xField;
    delete next.yField;
  } else {
    if (!next.xField && columns[0]) next.xField = columns[0];
    if (!next.yField && columns[1]) next.yField = columns[1];
    delete next.pieCategory;
    delete next.pieValue;
    delete next.pieRadiusInner;
    delete next.pieRadiusOuter;
  }

  return next;
}

// 纯函数：切换图表类型时的 builder 变换
export function applyTypeChange(builder: any = {}, nextType: 'line' | 'bar' | 'pie', columns: string[] = []) {
  const next: any = { ...builder, type: nextType };

  if (nextType === 'pie') {
    delete next.xField;
    delete next.yField;
    if (!next.pieCategory && columns[0]) next.pieCategory = columns[0];
    if (!next.pieValue && columns[1]) next.pieValue = columns[1];
    if (next.pieRadiusInner == null) next.pieRadiusInner = 0;
    if (next.pieRadiusOuter == null) next.pieRadiusOuter = 70;
  } else {
    delete next.pieCategory;
    delete next.pieValue;
    delete next.pieRadiusInner;
    delete next.pieRadiusOuter;
    if (!next.xField && columns[0]) next.xField = columns[0];
    if (!next.yField && columns[1]) next.yField = columns[1];
  }

  return next;
}

// 纯函数：根据 builder 生成 ECharts 的 raw 字符串
export function genRawByBuilder(builder: any) {
  if (!builder) return 'return {};';

  const {
    type = 'line',
    // common
    legend = true,
    tooltip = true,
    label = false,
    // line/bar
    xField,
    yField,
    seriesField,
    stack = false,
    smooth = false,
    // pie
    pieCategory,
    pieValue,
    pieRadiusInner = 0,
    pieRadiusOuter = 70,
  } = builder || {};

  const s = (v: any) => JSON.stringify(v ?? '');

  // 未满足必填条件时返回空对象，避免 runjs 报错
  if (type === 'line' || type === 'bar') {
    if (!xField || !yField) {
      return `return { tooltip: { show: ${!!tooltip} }, legend: { show: ${!!legend} } };`;
    }
  }
  if (type === 'pie') {
    if (!pieCategory || !pieValue) {
      return `return { tooltip: { show: ${!!tooltip} }, legend: { show: ${!!legend} } };`;
    }
  }

  if (type === 'pie') {
    // 饼图
    const code = `
return (function () {
  const data = (ctx && ctx.data && ctx.data.objects) || [];
  const categoryField = ${s(pieCategory)};
  const valueField = ${s(pieValue)};
  const radius = [${s(String(pieRadiusInner) + '%')}, ${s(String(pieRadiusOuter) + '%')}];

  const option = {
    tooltip: { show: ${!!tooltip} },
    legend: { show: ${!!legend} },
    series: [{
      type: 'pie',
      radius: radius,
      data: data.map(row => ({ name: row[categoryField], value: row[valueField] })),
      label: { show: ${!!label} },
    }]
  };
  return option;
})();`.trim();
    return code;
  }

  // 折/柱
  const code = `
return (function () {
  const data = (ctx && ctx.data && ctx.data.objects) || [];
  const xField = ${s(xField)};
  const yField = ${s(yField)};
  const seriesField = ${s(seriesField)};

  const seriesMap = new Map();
  data.forEach(row => {
    const seriesKey = seriesField ? row[seriesField] : '__default__';
    if (!seriesMap.has(seriesKey)) {
      seriesMap.set(seriesKey, []);
    }
    seriesMap.get(seriesKey).push({ x: row[xField], y: row[yField] });
  });

  const option = {
    tooltip: { show: ${!!tooltip} },
    legend: { show: ${!!legend} },
    xAxis: { type: 'category' },
    yAxis: { type: 'value' },
    series: Array.from(seriesMap.entries()).map(([key, arr]) => ({
      type: ${s(type)},
      name: key === '__default__' ? ${s('')} : String(key),
      data: arr.map(p => [p.x, p.y]),
      smooth: ${!!smooth},
      stack: ${!!stack} ? 'total' : undefined,
      label: { show: ${!!label} },
    })),
  };
  return option;
})();`.trim();

  return code;
}
