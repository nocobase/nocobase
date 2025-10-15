/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// 图表类型
export type ChartTypeKey = 'line' | 'bar' | 'barHorizontal' | 'pie' | 'scatter' | 'area';

const TYPE_FIELD_SPECS = {
  line: [
    { name: 'xField', valueType: 'string', required: true },
    { name: 'yField', valueType: 'string', required: true },
    { name: 'seriesField', valueType: 'string' },
    { name: 'smooth', valueType: 'boolean' },
  ],
  bar: [
    { name: 'xField', valueType: 'string', required: true },
    { name: 'yField', valueType: 'string', required: true },
    { name: 'seriesField', valueType: 'string' },
    { name: 'stack', valueType: 'boolean' },
  ],
  barHorizontal: [
    { name: 'xField', valueType: 'string', required: true },
    { name: 'yField', valueType: 'string', required: true },
    { name: 'seriesField', valueType: 'string' },
    { name: 'stack', valueType: 'boolean' },
  ],
  pie: [
    { name: 'pieCategory', valueType: 'string', required: true },
    { name: 'pieValue', valueType: 'string', required: true },
    { name: 'pieRadiusInner', valueType: 'number' },
    { name: 'pieRadiusOuter', valueType: 'number' },
  ],
  scatter: [
    { name: 'xField', valueType: 'string', required: true },
    { name: 'yField', valueType: 'string', required: true },
    { name: 'seriesField', valueType: 'string' },
    { name: 'sizeField', valueType: 'string' },
  ],
  area: [
    { name: 'xField', valueType: 'string', required: true },
    { name: 'yField', valueType: 'string', required: true },
    { name: 'seriesField', valueType: 'string' },
    { name: 'smooth', valueType: 'boolean' },
    { name: 'stack', valueType: 'boolean' },
  ],
};

const BOOL_LABEL_KEY = { smooth: 'Smooth', stack: 'Stack' };

const NUMBER_LIMITS = {
  pieRadiusInner: { min: 0, max: 100, labelKey: 'Inner radius (%)' },
  pieRadiusOuter: { min: 0, max: 100, labelKey: 'Outer radius (%)' },
};

export function getChartFormSpec(type: ChartTypeKey) {
  const specs = TYPE_FIELD_SPECS[type] || TYPE_FIELD_SPECS.line;
  return specs.map((fs: any) => {
    if (fs.valueType === 'string') {
      return {
        kind: 'select',
        name: fs.name,
        label: fs.name,
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

// 纯函数：从 columns 构建字段候选项
export function buildFieldOptions(columns: string[] = []) {
  return (columns || []).map((c) => ({ label: c, value: c }));
}

// 纯函数：清理引用了无效列的字段
export function stripInvalidColumns(builder = {}, columns: string[] = []): any {
  const next = { ...builder };
  const colSet = new Set(columns || []);
  ['xField', 'yField', 'seriesField', 'pieCategory', 'pieValue'].forEach((k) => {
    if (next[k] && !colSet.has(next[k])) next[k] = undefined;
  });
  return next;
}

const normalizeLine = (builder = {}, columns: string[]) => {
  const next = stripInvalidColumns(builder, columns);
  next.type = 'line';
  const { a, b } = pickFirstTwo(columns);
  if (!next.xField && a) next.xField = a;
  if (!next.yField && b) next.yField = b;
  delete next.pieCategory;
  delete next.pieValue;
  delete next.pieRadiusInner;
  delete next.pieRadiusOuter;
  delete next.sizeField;
  return next;
};

const normalizeBarLike = (key: 'bar' | 'barHorizontal') => {
  return (builder = {}, columns: string[]) => {
    const next = stripInvalidColumns(builder, columns);
    next.type = key;
    const { a, b } = pickFirstTwo(columns);
    if (!next.xField && a) next.xField = a;
    if (!next.yField && b) next.yField = b;
    delete next.pieCategory;
    delete next.pieValue;
    delete next.pieRadiusInner;
    delete next.pieRadiusOuter;
    delete next.sizeField;
    return next;
  };
};

const normalizeBar = normalizeBarLike('bar');
const normalizeBarHorizontal = normalizeBarLike('barHorizontal');

const normalizePie = (builder = {}, columns: string[]) => {
  const next = stripInvalidColumns(builder, columns);
  next.type = 'pie';
  const { a, b } = pickFirstTwo(columns);
  if (!next.pieCategory && a) next.pieCategory = a;
  if (!next.pieValue && b) next.pieValue = b;
  if (next.pieRadiusInner == null) next.pieRadiusInner = 0;
  if (next.pieRadiusOuter == null) next.pieRadiusOuter = 70;
  delete next.xField;
  delete next.yField;
  delete next.seriesField;
  delete next.smooth;
  delete next.stack;
  delete next.sizeField;
  return next;
};

const normalizeScatter = (builder = {}, columns: string[]) => {
  const next = stripInvalidColumns(builder, columns);
  next.type = 'scatter';
  const { a, b } = pickFirstTwo(columns);
  if (!next.xField && a) next.xField = a;
  if (!next.yField && b) next.yField = b;
  delete next.pieCategory;
  delete next.pieValue;
  delete next.pieRadiusInner;
  delete next.pieRadiusOuter;
  delete next.stack;
  delete next.smooth;
  return next;
};

const normalizeArea = (builder = {}, columns: string[]) => {
  const next = stripInvalidColumns(builder, columns);
  next.type = 'area';
  const { a, b } = pickFirstTwo(columns);
  if (!next.xField && a) next.xField = a;
  if (!next.yField && b) next.yField = b;
  delete next.pieCategory;
  delete next.pieValue;
  delete next.pieRadiusInner;
  delete next.pieRadiusOuter;
  delete next.sizeField;
  return next;
};

const applyLine = (builder, columns: string[]) => normalizeLine({ ...builder }, columns);
const applyBar = (builder, columns: string[]) => normalizeBar({ ...builder }, columns);
const applyBarHorizontal = (builder, columns: string[]) => normalizeBarHorizontal({ ...builder }, columns);
const applyPie = (builder, columns: string[]) => normalizePie({ ...builder }, columns);
const applyScatter = (builder, columns: string[]) => normalizeScatter({ ...builder }, columns);
const applyArea = (builder, columns: string[]) => normalizeArea({ ...builder }, columns);

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
    xAxis: { type: 'category', boundaryGap: ${!!boundaryGap} },
    yAxis: { type: 'value' },
    series: Array.from(seriesMap.entries()).map(([key, arr]) => ({
      type: 'line',
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
    xAxis: { type: 'category', boundaryGap: ${!!boundaryGap} },
    yAxis: { type: 'value' },
    series: Array.from(seriesMap.entries()).map(([key, arr]) => ({
      type: 'bar',
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
    xAxis: { type: 'value' },
    yAxis: { type: 'category', boundaryGap: ${!!boundaryGap} },
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
    xAxis: { type: 'category', data: categories, boundaryGap: ${!!boundaryGap} },
    yAxis: { type: 'value' },
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
        name: key === '__default__' ? ${s('')} : String(key),
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
    xAxis: { type: 'category', boundaryGap: ${!!boundaryGap} },
    yAxis: { type: 'value' },
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
  line: { key: 'line', normalize: normalizeLine, applyType: applyLine, genRaw: genRawLine },
  bar: { key: 'bar', normalize: normalizeBar, applyType: applyBar, genRaw: genRawBar },
  barHorizontal: {
    key: 'barHorizontal',
    normalize: normalizeBarHorizontal,
    applyType: applyBarHorizontal,
    genRaw: (b) => genRawBarHorizontal(b),
  },
  pie: { key: 'pie', normalize: normalizePie, applyType: applyPie, genRaw: genRawPie },
  scatter: { key: 'scatter', normalize: normalizeScatter, applyType: applyScatter, genRaw: genRawScatter },
  area: { key: 'area', normalize: normalizeArea, applyType: applyArea, genRaw: genRawArea },
};

// 纯函数：按图表类型规范化（补默认、删无关字段）
export function normalizeBuilder(builder, columns: string[] = []) {
  const type: ChartTypeKey = builder?.type ?? 'line';
  const cfg = TYPE_REGISTRY[type] || TYPE_REGISTRY.line;
  return cfg.normalize(builder, columns);
}

// 纯函数：切换图表类型时的 builder 变换
export function applyTypeChange(builder = {}, nextType: ChartTypeKey, columns: string[] = []) {
  const cfg = TYPE_REGISTRY[nextType] || TYPE_REGISTRY.line;
  return cfg.applyType({ ...builder, type: nextType }, columns);
}

// 纯函数：根据 builder 生成 ECharts 的 raw 字符串
export function genRawByBuilder(builder) {
  if (!builder) return 'return {};';
  const type: ChartTypeKey = builder?.type ?? 'line';
  const cfg = TYPE_REGISTRY[type] || TYPE_REGISTRY.line;
  return cfg.genRaw(builder);
}
