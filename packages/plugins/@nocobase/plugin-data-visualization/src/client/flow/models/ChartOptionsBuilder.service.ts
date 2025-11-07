/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type ChartTypeKey = 'line' | 'bar' | 'barHorizontal' | 'pie' | 'doughnut' | 'scatter' | 'area' | 'funnel';

const TYPE_FIELD_SPECS = {
  line: [
    { name: 'xField', valueType: 'string', required: true },
    { name: 'yField', valueType: 'string', required: true },
    { name: 'seriesField', valueType: 'string' },
    { name: 'smooth', valueType: 'boolean', default: false },
    { name: 'xAxisLabelRotate', valueType: 'number', default: 0 },
    { name: 'yAxisSplitLine', valueType: 'boolean', default: true },
  ],
  bar: [
    { name: 'xField', valueType: 'string', required: true },
    { name: 'yField', valueType: 'string', required: true },
    { name: 'seriesField', valueType: 'string' },
    { name: 'stack', valueType: 'boolean', default: false },
    { name: 'xAxisLabelRotate', valueType: 'number', default: 0 },
    { name: 'yAxisSplitLine', valueType: 'boolean', default: true },
  ],
  barHorizontal: [
    { name: 'xField', valueType: 'string', required: true },
    { name: 'yField', valueType: 'string', required: true },
    { name: 'seriesField', valueType: 'string' },
    { name: 'stack', valueType: 'boolean', default: false },
    { name: 'xAxisLabelRotate', valueType: 'number', default: 0 },
    { name: 'yAxisSplitLine', valueType: 'boolean', default: true },
  ],
  pie: [
    { name: 'pieCategory', valueType: 'string', required: true },
    { name: 'pieValue', valueType: 'string', required: true },
    { name: 'pieRadiusInner', valueType: 'number', default: 0 },
    { name: 'pieRadiusOuter', valueType: 'number', default: 70 },
    {
      name: 'pieLabelType',
      valueType: 'enum',
      default: 'percent',
      options: ['value', 'percent'],
      labelKey: 'Label content',
    },
  ],
  doughnut: [
    { name: 'doughnutCategory', valueType: 'string', required: true },
    { name: 'doughnutValue', valueType: 'string', required: true },
    { name: 'doughnutRadiusInner', valueType: 'number', default: 40 },
    { name: 'doughnutRadiusOuter', valueType: 'number', default: 70 },
    {
      name: 'doughnutLabelType',
      valueType: 'enum',
      default: 'percent',
      options: ['value', 'percent'],
      labelKey: 'Label content',
    },
  ],
  funnel: [
    { name: 'funnelCategory', valueType: 'string', required: true },
    { name: 'funnelValue', valueType: 'string', required: true },
    {
      name: 'funnelSort',
      valueType: 'enum',
      default: 'descending',
      options: ['descending', 'ascending'],
      labelKey: 'Sort',
    },
    { name: 'funnelMinSize', valueType: 'number', default: 0 },
    { name: 'funnelMaxSize', valueType: 'number', default: 80 },
  ],
  scatter: [
    { name: 'xField', valueType: 'string', required: true },
    { name: 'yField', valueType: 'string', required: true },
    { name: 'seriesField', valueType: 'string' },
    { name: 'sizeField', valueType: 'string' },
    { name: 'xAxisLabelRotate', valueType: 'number', default: 0 },
    { name: 'yAxisSplitLine', valueType: 'boolean', default: true },
  ],
  area: [
    { name: 'xField', valueType: 'string', required: true },
    { name: 'yField', valueType: 'string', required: true },
    { name: 'seriesField', valueType: 'string' },
    { name: 'smooth', valueType: 'boolean', default: false },
    { name: 'stack', valueType: 'boolean', default: false },
    { name: 'xAxisLabelRotate', valueType: 'number', default: 0 },
    { name: 'yAxisSplitLine', valueType: 'boolean', default: true },
  ],
};

// 允许保留的公共键（不随类型清理掉）
const COMMON_FIELD_KEYS = [
  'type',
  'legend',
  'tooltip',
  'label',
  'boundaryGap',
  'xAxisLabelRotate',
  'yAxisSplitLine',
] as const;

// 根据类型自动填充的主字段规则
const AUTO_FILL_RULES: Record<ChartTypeKey, { first?: string; second?: string }> = {
  line: { first: 'xField', second: 'yField' },
  bar: { first: 'xField', second: 'yField' },
  barHorizontal: { first: 'xField', second: 'yField' },
  pie: { first: 'pieCategory', second: 'pieValue' },
  doughnut: { first: 'doughnutCategory', second: 'doughnutValue' },
  funnel: { first: 'funnelCategory', second: 'funnelValue' },
  scatter: { first: 'xField', second: 'yField' },
  area: { first: 'xField', second: 'yField' },
};

// 通用 normalize：按 TYPE_FIELD_SPECS 允许的字段集合进行过滤，并应用默认值
function normalizeByType(type: ChartTypeKey, builder = {}, columns: string[] = []) {
  const next = stripInvalidColumns(builder, columns);
  next.type = type;

  const specs = TYPE_FIELD_SPECS[type] || TYPE_FIELD_SPECS.line;
  const allowed = new Set<string>([...COMMON_FIELD_KEYS, ...specs.map((fs: any) => fs.name)]);

  // 根据类型自动填充主字段
  const { a, b } = pickFirstTwo(columns);
  const fill = AUTO_FILL_RULES[type] || {};
  if (fill.first && !next[fill.first] && a) next[fill.first] = a;
  if (fill.second && !next[fill.second] && b) next[fill.second] = b;

  // 应用默认值（仅当值为 null/undefined）
  specs.forEach((fs: any) => {
    if (Object.prototype.hasOwnProperty.call(fs, 'default')) {
      const v = (next as any)[fs.name];
      if (v == null) (next as any)[fs.name] = fs.default;
    }
  });

  // 清理掉不属于该类型的字段（保留公共键）
  Object.keys(next).forEach((k) => {
    if (!allowed.has(k)) {
      (next as any)[k] = undefined;
    }
  });

  return next;
}

const normalizeLine = (builder = {}, columns: string[]) => normalizeByType('line', builder, columns);
const normalizeBar = (builder = {}, columns: string[]) => normalizeByType('bar', builder, columns);
const normalizeBarHorizontal = (builder = {}, columns: string[]) => normalizeByType('barHorizontal', builder, columns);
const normalizePie = (builder = {}, columns: string[]) => normalizeByType('pie', builder, columns);
const normalizeDoughnut = (builder = {}, columns: string[]) => normalizeByType('doughnut', builder, columns);
const normalizeFunnel = (builder = {}, columns: string[]) => normalizeByType('funnel', builder, columns);
const normalizeScatter = (builder = {}, columns: string[]) => normalizeByType('scatter', builder, columns);
const normalizeArea = (builder = {}, columns: string[]) => normalizeByType('area', builder, columns);

const BOOL_LABEL_KEY = { smooth: 'Smooth', stack: 'Stack', yAxisSplitLine: 'Split line' };

const NUMBER_LIMITS = {
  pieRadiusInner: { min: 0, max: 100, labelKey: 'Inner radius (%)' },
  pieRadiusOuter: { min: 0, max: 100, labelKey: 'Outer radius (%)' },
  doughnutRadiusInner: { min: 0, max: 100, labelKey: 'Inner radius (%)' },
  doughnutRadiusOuter: { min: 0, max: 100, labelKey: 'Outer radius (%)' },
  xAxisLabelRotate: { min: 0, max: 90, labelKey: 'X axis label rotate' },
  funnelMinSize: { min: 0, max: 100, labelKey: 'Min size (%)' },
  funnelMaxSize: { min: 0, max: 100, labelKey: 'Max size (%)' },
};

export function getChartFormSpec(type: ChartTypeKey) {
  const specs = TYPE_FIELD_SPECS[type] || TYPE_FIELD_SPECS.line;
  return specs.map((fs: any) => {
    if (fs.valueType === 'enum') {
      return {
        kind: 'enum',
        name: fs.name,
        labelKey: fs.labelKey || fs.name,
        options: (fs.options || []).map((v: string) => ({ labelKey: v, value: v })),
      };
    }
    if (fs.valueType === 'string') {
      const labelKey =
        fs.name === 'pieCategory' || fs.name === 'funnelCategory' || fs.name === 'doughnutCategory'
          ? 'Category field'
          : fs.name === 'pieValue' || fs.name === 'funnelValue' || fs.name === 'doughnutValue'
            ? 'Value field'
            : fs.name; // xField/yField/seriesField 等直接使用同名键
      return {
        kind: 'select',
        name: fs.name,
        labelKey,
        required: !!fs.required,
        allowClear: !fs.required,
        placeholderKey: fs.name === 'seriesField' ? 'Optional series' : 'Select field',
      };
    }
    if (fs.valueType === 'boolean') {
      return {
        kind: 'switch',
        name: fs.name,
        labelKey: (BOOL_LABEL_KEY as any)[fs.name] || fs.name,
      };
    }
    const limits = (NUMBER_LIMITS as any)[fs.name] || {};
    // xAxisLabelRotate 使用 Segmented 二选一（0/90）
    if (fs.name === 'xAxisLabelRotate') {
      return {
        kind: 'segmented',
        name: fs.name,
        labelKey: limits.labelKey || fs.name,
        options: [
          { labelKey: 'Horizontal', value: 0 },
          { labelKey: 'Vertical', value: 90 },
        ],
      };
    }
    // 对饼图半径、环形图半径与漏斗尺寸使用 Slider（0-100，整数）
    if (
      fs.name === 'pieRadiusInner' ||
      fs.name === 'pieRadiusOuter' ||
      fs.name === 'doughnutRadiusInner' ||
      fs.name === 'doughnutRadiusOuter' ||
      fs.name === 'funnelMinSize' ||
      fs.name === 'funnelMaxSize'
    ) {
      return {
        kind: 'slider',
        name: fs.name,
        labelKey: limits.labelKey || fs.name,
        min: limits.min ?? 0,
        max: limits.max ?? 100,
      };
    }
    return {
      kind: 'number',
      name: fs.name,
      labelKey: limits.labelKey || fs.name,
      min: limits.min,
      max: limits.max,
    };
  });
}

const pickFirstTwo = (columns: string[]) => ({ a: columns[0], b: columns[1] });

// 从 columns 构建字段候选项
export function buildFieldOptions(columns: string[] = []) {
  return (columns || []).map((c) => ({ label: c, value: c }));
}

// 清理引用了无效列的字段
export function stripInvalidColumns(builder = {}, columns: string[] = []): any {
  const next = { ...builder };
  const colSet = new Set(columns || []);
  [
    'xField',
    'yField',
    'seriesField',
    'pieCategory',
    'pieValue',
    'doughnutCategory',
    'doughnutValue',
    'sizeField',
    'funnelCategory',
    'funnelValue',
  ].forEach((k) => {
    if (next[k] && !colSet.has(next[k])) next[k] = undefined;
  });
  return next;
}

const s = (v) => JSON.stringify(v ?? '');

const genRawPie = (builder: any) => {
  const {
    pieCategory,
    pieValue,
    pieRadiusInner = 0,
    pieRadiusOuter = 70,
    tooltip = true,
    legend = true,
    label = false,
    pieLabelType = 'percent',
  } = builder || {};

  if (!pieCategory || !pieValue) {
    return `return { tooltip: { show: ${!!tooltip} }, legend: { show: ${!!legend} } };`;
  }

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
      label: { show: ${!!label}, formatter: (${s(pieLabelType)}) === 'percent' ? '{d}%' : '{c}' },
    }]
  };
  return option;
})();`.trim();
  return code;
};

const genRawDoughnut = (builder: any) => {
  const {
    doughnutCategory,
    doughnutValue,
    doughnutRadiusInner = 40,
    doughnutRadiusOuter = 70,
    tooltip = true,
    legend = true,
    label = false,
    doughnutLabelType = 'percent',
  } = builder || {};

  if (!doughnutCategory || !doughnutValue) {
    return `return { tooltip: { show: ${!!tooltip} }, legend: { show: ${!!legend} } };`;
  }

  const code = `
return (function () {
  const data = (ctx && ctx.data && ctx.data.objects) || [];
  const categoryField = ${s(doughnutCategory)};
  const valueField = ${s(doughnutValue)};
  const radius = [${s(String(doughnutRadiusInner) + '%')}, ${s(String(doughnutRadiusOuter) + '%')}];

  const option = {
    tooltip: { show: ${!!tooltip} },
    legend: { show: ${!!legend} },
    series: [{
      type: 'pie',
      radius: radius,
      data: data.map(row => ({ name: row[categoryField], value: row[valueField] })),
      label: { show: ${!!label}, formatter: (${s(doughnutLabelType)}) === 'percent' ? '{d}%' : '{c}' },
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
    }]
  };
  return option;
})();`.trim();
  return code;
};

const genRawFunnel = (builder: any) => {
  const {
    funnelCategory,
    funnelValue,
    funnelSort = 'descending',
    funnelMinSize = 0,
    funnelMaxSize = 80,
    tooltip = true,
    legend = true,
    label = false,
  } = builder || {};

  if (!funnelCategory || !funnelValue) {
    return `return { tooltip: { show: ${!!tooltip} }, legend: { show: ${!!legend} } };`;
  }

  const code = `
return (function () {
  const data = (ctx && ctx.data && ctx.data.objects) || [];
  const categoryField = ${s(funnelCategory)};
  const valueField = ${s(funnelValue)};
  const minSize = ${s(String(funnelMinSize) + '%')};
  const maxSize = ${s(String(funnelMaxSize) + '%')};

  const option = {
    tooltip: { show: ${!!tooltip} },
    legend: { show: ${!!legend} },
    series: [{
      type: 'funnel',
      sort: ${s(funnelSort)},
      minSize: minSize,
      maxSize: maxSize,
      data: data.map(row => ({ name: row[categoryField], value: Number(row[valueField]) })),
      label: { show: ${!!label} },
    }]
  };
  return option;
})();`.trim();
  return code;
};

const genRawLine = (builder: any) => {
  const {
    xField,
    yField,
    seriesField,
    tooltip = true,
    legend = true,
    label = false,
    smooth = false,
    stack = false,
    boundaryGap = false,
    xAxisLabelRotate = 0,
    yAxisSplitLine = true,
  } = builder || {};

  if (!xField || !yField) {
    return `return { tooltip: { show: ${!!tooltip} }, legend: { show: ${!!legend} } };`;
  }

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
    xAxis: { type: 'category', boundaryGap: ${!!boundaryGap}, axisLabel: { rotate: ${
      Number.isFinite(xAxisLabelRotate) ? Number(xAxisLabelRotate) : 0
    } } },
    yAxis: { type: 'value', splitLine: { show: ${!!yAxisSplitLine} } },
    series: Array.from(seriesMap.entries()).map(([key, arr]) => ({
      type: 'line',
      // 默认系列名：无 seriesField 时用 yField，确保图例可见
      name: key === '__default__' ? yField : String(key),
      data: arr.map(p => [p.x, p.y]),
      smooth: ${!!smooth},
      stack: ${!!stack} ? 'total' : undefined,
      label: { show: ${!!label} },
    })),
  };
  return option;
})();`.trim();
  return code;
};

const genRawBar = (builder: any) => {
  const {
    xField,
    yField,
    seriesField,
    tooltip = true,
    legend = true,
    label = false,
    smooth = false,
    stack = false,
    boundaryGap = true,
    xAxisLabelRotate = 0,
    yAxisSplitLine = true,
  } = builder || {};

  if (!xField || !yField) {
    return `return { tooltip: { show: ${!!tooltip} }, legend: { show: ${!!legend} } };`;
  }

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
    xAxis: { type: 'category', boundaryGap: ${!!boundaryGap}, axisLabel: { rotate: ${
      Number.isFinite(xAxisLabelRotate) ? Number(xAxisLabelRotate) : 0
    } } },
    yAxis: { type: 'value', splitLine: { show: ${!!yAxisSplitLine} } },
    series: Array.from(seriesMap.entries()).map(([key, arr]) => ({
      type: 'bar',
      // 默认系列名：无 seriesField 时用 yField
      name: key === '__default__' ? yField : String(key),
      data: arr.map(p => [p.x, p.y]),
      stack: ${!!stack} ? 'total' : undefined,
      label: { show: ${!!label} },
    })),
  };
  return option;
})();`.trim();
  return code;
};

const genRawBarHorizontal = (builder: any) => {
  const {
    xField,
    yField,
    seriesField,
    tooltip = true,
    legend = true,
    label = false,
    stack = false,
    boundaryGap = true,
    xAxisLabelRotate = 0,
    yAxisSplitLine = true,
  } = builder || {};

  if (!xField || !yField) {
    return `return { tooltip: { show: ${!!tooltip} }, legend: { show: ${!!legend} } };`;
  }

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
    // 横向条形图：x 为值，y 为类目
    seriesMap.get(seriesKey).push({ x: row[yField], y: row[xField] });
  });

  const option = {
    tooltip: { show: ${!!tooltip} },
    legend: { show: ${!!legend} },
    xAxis: { type: 'value', splitLine: { show: ${!!yAxisSplitLine} } },
    yAxis: { type: 'category', boundaryGap: ${!!boundaryGap}, axisLabel: { rotate: ${
      Number.isFinite(xAxisLabelRotate) ? Number(xAxisLabelRotate) : 0
    } } },
    series: Array.from(seriesMap.entries()).map(([key, arr]) => ({
      type: 'bar',
      name: key === '__default__' ? ${s('')} : String(key),
      data: arr.map(p => [p.x, p.y]),
      stack: ${!!stack} ? 'total' : undefined,
      label: { show: ${!!label} },
    })),
  };
  return option;
})();`.trim();
  return code;
};

const genRawScatter = (builder: any) => {
  const {
    xField,
    yField,
    seriesField,
    sizeField,
    tooltip = true,
    legend = true,
    label = false,
    boundaryGap = true,
    xAxisLabelRotate = 0,
    yAxisSplitLine = true,
  } = builder || {};

  if (!xField || !yField) {
    return `return { tooltip: { show: ${!!tooltip} }, legend: { show: ${!!legend} } };`;
  }

  const code = `
return (function () {
  const data = (ctx && ctx.data && ctx.data.objects) || [];
  const xField = ${s(xField)};
  const yField = ${s(yField)};
  const seriesField = ${s(seriesField)};
  const sizeField = ${s(sizeField)};

  // 收集类目
  const categories = [];
  const catSet = new Set();
  data.forEach(row => {
    const cat = row[xField];
    if (!catSet.has(cat)) {
      catSet.add(cat);
      categories.push(cat);
    }
  });

  // 聚合为系列：每个系列一个 Map<classCategory, { y, size }>
  const seriesMap = new Map();
  data.forEach(row => {
    const key = seriesField ? row[seriesField] : '__default__';
    if (!seriesMap.has(key)) {
      seriesMap.set(key, new Map());
    }
    const sizeVal = sizeField ? Number(row[sizeField]) || 20 : 20;
    seriesMap.get(key).set(row[xField], { y: row[yField], size: sizeVal });
  });

  const option = {
    tooltip: { show: ${!!tooltip} },
    legend: { show: ${!!legend} },
    xAxis: { type: 'category', data: categories, boundaryGap: ${!!boundaryGap}, axisLabel: { rotate: ${
      Number.isFinite(xAxisLabelRotate) ? Number(xAxisLabelRotate) : 0
    } } },
    yAxis: { type: 'value', splitLine: { show: ${!!yAxisSplitLine} } },
    series: Array.from(seriesMap.entries()).map(([key, map]) => {
      const yArr = categories.map(cat => {
        const p = map.get(cat);
        return p ? p.y : null;
      });
      const sizeArr = categories.map(cat => {
        const p = map.get(cat);
        return p ? p.size : 20;
      });
      return {
        type: 'scatter',
        // 默认系列名：无 seriesField 时用 yField
        name: key === '__default__' ? yField : String(key),
        data: yArr,
        symbolSize: (value, params) => sizeArr[params.dataIndex] || 20,
        label: { show: ${!!label} },
      };
    }),
  };
  return option;
})();`.trim();
  return code;
};

const genRawArea = (builder: any) => {
  const {
    xField,
    yField,
    seriesField,
    tooltip = true,
    legend = true,
    label = false,
    smooth = false,
    stack = false,
    boundaryGap = false,
    xAxisLabelRotate = 0,
    yAxisSplitLine = true,
  } = builder || {};

  if (!xField || !yField) {
    return `return { tooltip: { show: ${!!tooltip} }, legend: { show: ${!!legend} } };`;
  }

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
    xAxis: { type: 'category', boundaryGap: ${!!boundaryGap}, axisLabel: { rotate: ${
      Number.isFinite(xAxisLabelRotate) ? Number(xAxisLabelRotate) : 0
    } } },
    yAxis: { type: 'value', splitLine: { show: ${!!yAxisSplitLine} } },
    series: Array.from(seriesMap.entries()).map(([key, arr]) => ({
      type: 'line',
      name: key === '__default__' ? ${s('')} : String(key),
      data: arr.map(p => [p.x, p.y]),
      smooth: ${!!smooth},
      stack: ${!!stack} ? 'total' : undefined,
      areaStyle: {},
      label: { show: ${!!label} },
    })),
  };
  return option;
})();`.trim();
  return code;
};

const TYPE_REGISTRY = {
  line: { key: 'line', normalize: normalizeLine, genRaw: genRawLine },
  bar: { key: 'bar', normalize: normalizeBar, genRaw: genRawBar },
  barHorizontal: {
    key: 'barHorizontal',
    normalize: normalizeBarHorizontal,
    genRaw: (b) => genRawBarHorizontal(b),
  },
  pie: { key: 'pie', normalize: normalizePie, genRaw: genRawPie },
  doughnut: { key: 'doughnut', normalize: normalizeDoughnut, genRaw: genRawDoughnut },
  funnel: { key: 'funnel', normalize: normalizeFunnel, genRaw: genRawFunnel },
  scatter: { key: 'scatter', normalize: normalizeScatter, genRaw: genRawScatter },
  area: { key: 'area', normalize: normalizeArea, genRaw: genRawArea },
};

// 按图表类型规范化（补默认、删无关字段）
export function normalizeBuilder(builder, columns: string[] = []) {
  const type: ChartTypeKey = builder?.type ?? 'line';
  const cfg = TYPE_REGISTRY[type] || TYPE_REGISTRY.line;
  return cfg.normalize(builder, columns);
}

// 切换图表类型时的 builder 变换
export function applyTypeChange(builder = {}, nextType: ChartTypeKey, columns: string[] = []) {
  const cfg = TYPE_REGISTRY[nextType] || TYPE_REGISTRY.line;
  return cfg.normalize({ ...builder, type: nextType }, columns);
}

// 根据 builder 生成 ECharts 的 raw 字符串
export function genRawByBuilder(builder) {
  if (!builder) return 'return {};';
  const type: ChartTypeKey = builder?.type ?? 'line';
  const cfg = TYPE_REGISTRY[type] || TYPE_REGISTRY.line;
  return cfg.genRaw(builder);
}
