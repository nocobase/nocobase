/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React, { useEffect, useMemo } from 'react';
import { observer, ObjectField, Field, useForm } from '@formily/react';
import { Select, InputNumber, Checkbox, Space, Divider, Typography } from 'antd';
import { useFlowSettingsContext } from '@nocobase/flow-engine';
import { ChartBlockModel } from './ChartBlockModel';
import { configStore } from './config-store';
import FormItemLite from './FormItemLite';
import { useT } from '../../locale';

const { Text } = Typography;

// 轻量适配器：对 antd 组件做 Formily 协议适配（value/onChange），并提供 onValueChange 钩子
const SelectAdapter: React.FC<any> = ({ dataSource, onChange, onValueChange, ...rest }) => {
  return (
    <Select
      {...rest}
      options={dataSource}
      onChange={(v) => {
        onChange?.(v);
        onValueChange?.(v);
      }}
    />
  );
};

const InputNumberAdapter: React.FC<any> = ({ onChange, onValueChange, ...rest }) => {
  return (
    <InputNumber
      {...rest}
      onChange={(v) => {
        onChange?.(v);
        onValueChange?.(v);
      }}
    />
  );
};

const CheckboxAdapter: React.FC<any> = ({ value, onChange, onValueChange, content, children, ...rest }) => {
  return (
    <Checkbox
      {...rest}
      checked={!!value}
      onChange={(e) => {
        const v = e?.target?.checked;
        onChange?.(v);
        onValueChange?.(v);
      }}
    >
      {children ?? content}
    </Checkbox>
  );
};

// 根据 builder 值生成 ECharts 的 raw 字符串（return ...）
function genRawByBuilder(builder: any) {
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

  // 工具：安全字符串
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
      label: { show: ${!!label} }
    }]
  };

  return option;
})();`;
    return code.trim();
  }

  // 折线/柱状
  const code = `
return (function () {
  const data = (ctx && ctx.data && ctx.data.objects) || [];
  const type = ${s(type)}; // 'line' | 'bar'
  const xField = ${s(xField)};
  const yField = ${s(yField)};
  const seriesField = ${s(seriesField)};

  // x 轴类目
  const xData = Array.from(new Set(data.map(row => row[xField])));

  const option = {
    tooltip: { show: ${!!tooltip} },
    legend: { show: ${!!legend} },
    xAxis: { type: 'category', data: xData },
    yAxis: { type: 'value' },
    series: []
  };

  if (seriesField) {
    const grouped = {};
    data.forEach(row => {
      const key = row[seriesField] ?? 'Series';
      if (!grouped[key]) grouped[key] = {};
      grouped[key][row[xField]] = row[yField];
    });
    Object.keys(grouped).forEach(name => {
      option.series.push({
        name,
        type,
        data: xData.map(x => grouped[name][x] ?? 0),
        ${type === 'line' ? `smooth: ${!!smooth},` : ''}
        ${type === 'bar' ? `stack: ${!!stack} ? 'total' : undefined,` : ''}
        label: { show: ${!!label} }
      });
    });
  } else {
    const byX = {};
    data.forEach(row => { byX[row[xField]] = row[yField]; });
    option.series.push({
      type,
      data: xData.map(x => byX[x] ?? 0),
      ${type === 'line' ? `smooth: ${!!smooth},` : ''}
      ${type === 'bar' ? `stack: ${!!stack} ? 'total' : undefined,` : ''}
      label: { show: ${!!label} }
    });
  }

  return option;
})();`;
  return code.trim();
}

export const ChartOptionsBuilder: React.FC = observer(() => {
  const t = useT();
  const form = useForm();
  const ctx = useFlowSettingsContext<ChartBlockModel>();

  // 获取预览数据列名，用作字段选项
  const uid = ctx?.model?.uid;
  const previewData = configStore.results[uid]?.result || [];
  const fieldOptions = useMemo(() => {
    const cols = Object.keys(previewData?.[0] ?? {});
    return cols.map((c) => ({ label: c, value: c }));
  }, [previewData]);

  // 初始化 builder 默认值
  useEffect(() => {
    const builder = form.values?.chart?.option?.builder || {};
    // 如果尚未初始化，做一次初始化（包含公共属性与字段默认）
    if (!form.values?.chart?.option?.builder) {
      const cols = Object.keys(previewData?.[0] ?? {});
      const defaults: any = {
        type: 'line',
        legend: true,
        tooltip: true,
        label: false,
        height: 400,
      };
      // 根据列推断 x/y 或 category/value
      if (cols.length >= 2) {
        defaults.xField = cols[0];
        defaults.yField = cols[1];
        defaults.pieCategory = cols[0];
        defaults.pieValue = cols[1];
      } else if (cols.length === 1) {
        defaults.xField = cols[0];
        defaults.pieCategory = cols[0];
      }
      defaults.pieRadiusInner = 0;
      defaults.pieRadiusOuter = 70;

      form.setValuesIn('chart.option.builder', defaults);
      // 立即生成一次 raw
      form.setValuesIn('chart.option.raw', genRawByBuilder(defaults));
    }
  }, [form, previewData]);

  // 监听 builder 值变化，实时生成 raw
  // useEffect(() => {
  //   const builder = form.values?.chart?.option?.builder;
  //   if (!builder) return;
  //   const raw = genRawByBuilder(builder);
  //   form.setValuesIn('chart.option.raw', raw);
  // }, [form.values?.chart?.option?.builder]);

  // 联动：切换图表类型时重置无关字段
  const handleTypeChange = (v: 'line' | 'bar' | 'pie') => {
    const cols = Object.keys(previewData?.[0] ?? {});
    if (v === 'pie') {
      form.setValuesIn('chart.option.builder.xField', undefined);
      form.setValuesIn('chart.option.builder.yField', undefined);
      // 初始化饼图必填
      if (!form.values?.chart?.option?.builder?.pieCategory && cols[0]) {
        form.setValuesIn('chart.option.builder.pieCategory', cols[0]);
      }
      if (!form.values?.chart?.option?.builder?.pieValue && cols[1]) {
        form.setValuesIn('chart.option.builder.pieValue', cols[1]);
      }
      if (form.values?.chart?.option?.builder?.pieRadiusInner == null) {
        form.setValuesIn('chart.option.builder.pieRadiusInner', 0);
      }
      if (form.values?.chart?.option?.builder?.pieRadiusOuter == null) {
        form.setValuesIn('chart.option.builder.pieRadiusOuter', 70);
      }
    } else {
      form.setValuesIn('chart.option.builder.pieCategory', undefined);
      form.setValuesIn('chart.option.builder.pieValue', undefined);
      form.setValuesIn('chart.option.builder.pieRadiusInner', undefined);
      form.setValuesIn('chart.option.builder.pieRadiusOuter', undefined);
      // 初始化折线/柱状必填
      if (!form.values?.chart?.option?.builder?.xField && cols[0]) {
        form.setValuesIn('chart.option.builder.xField', cols[0]);
      }
      if (!form.values?.chart?.option?.builder?.yField && cols[1]) {
        form.setValuesIn('chart.option.builder.yField', cols[1]);
      }
    }
  };

  const type = form.values?.chart?.option?.builder?.type ?? 'line';

  return (
    <ObjectField name="builder">
      {/* 图表类型 */}
      <div style={{ marginBottom: 8 }}>
        <Field
          name="type"
          title={t('Chart type')}
          decorator={[FormItemLite]}
          component={[
            SelectAdapter,
            {
              style: { width: 160 },
              dataSource: [
                { label: t('Line'), value: 'line' },
                { label: t('Bar'), value: 'bar' },
                { label: t('Pie'), value: 'pie' },
              ],
              onValueChange: handleTypeChange,
            },
          ]}
        />
      </div>

      {/* 必选配置 */}
      <Divider style={{ margin: '8px 0' }} />
      <Text strong style={{ display: 'block', marginBottom: 6 }}>
        {t('Required')}
      </Text>
      {type === 'line' || type === 'bar' ? (
        <Space wrap size={[12, 8]} style={{ marginBottom: 8 }}>
          <Field
            name="xField"
            required
            title="xField"
            decorator={[FormItemLite]}
            component={[
              SelectAdapter,
              {
                placeholder: t('Select field'),
                style: { minWidth: 160 },
                dataSource: fieldOptions,
              },
            ]}
          />
          <Field
            name="yField"
            required
            title="yField"
            decorator={[FormItemLite]}
            component={[
              SelectAdapter,
              {
                placeholder: t('Select field'),
                style: { minWidth: 160 },
                dataSource: fieldOptions,
              },
            ]}
          />
        </Space>
      ) : (
        <Space wrap size={[12, 8]} style={{ marginBottom: 8 }}>
          <Field
            name="pieCategory"
            required
            title={t('Category')}
            decorator={[FormItemLite]}
            component={[
              SelectAdapter,
              {
                placeholder: t('Select field'),
                style: { minWidth: 160 },
                dataSource: fieldOptions,
              },
            ]}
          />
          <Field
            name="pieValue"
            required
            title={t('Value field')}
            decorator={[FormItemLite]}
            component={[
              SelectAdapter,
              {
                placeholder: t('Select field'),
                style: { minWidth: 160 },
                dataSource: fieldOptions,
              },
            ]}
          />
        </Space>
      )}

      {/* 可选配置 */}
      <Divider style={{ margin: '8px 0' }} />
      <Text strong style={{ display: 'block', marginBottom: 6 }}>
        {t('Optional')}
      </Text>
      {type === 'line' && (
        <Space wrap size={[12, 8]} style={{ marginBottom: 8 }}>
          <Field
            name="seriesField"
            title="seriesField"
            decorator={[FormItemLite]}
            component={[
              SelectAdapter,
              {
                allowClear: true,
                placeholder: t('Optional series'),
                style: { minWidth: 160 },
                dataSource: fieldOptions,
              },
            ]}
          />
          <Field name="smooth" decorator={[FormItemLite]} component={[CheckboxAdapter]} content={t('Smooth')} />
        </Space>
      )}
      {type === 'bar' && (
        <Space wrap size={[12, 8]} style={{ marginBottom: 8 }}>
          <Field
            name="seriesField"
            title="seriesField"
            decorator={[FormItemLite]}
            component={[
              SelectAdapter,
              {
                allowClear: true,
                placeholder: t('Optional series'),
                style: { minWidth: 160 },
                dataSource: fieldOptions,
              },
            ]}
          />
          <Field name="stack" decorator={[FormItemLite]} component={[CheckboxAdapter]} content={t('Stack')} />
        </Space>
      )}
      {type === 'pie' && (
        <Space wrap size={[12, 8]} style={{ marginBottom: 8 }}>
          <Field
            name="pieRadiusInner"
            title={t('Inner radius (%)')}
            decorator={[FormItemLite]}
            component={[InputNumberAdapter, { min: 0, max: 100, style: { width: 120 } }]}
          />
          <Field
            name="pieRadiusOuter"
            title={t('Outer radius (%)')}
            decorator={[FormItemLite]}
            component={[InputNumberAdapter, { min: 0, max: 100, style: { width: 120 } }]}
          />
        </Space>
      )}

      {/* 公共属性 */}
      <Divider style={{ margin: '8px 0' }} />
      <Text strong style={{ display: 'block', marginBottom: 6 }}>
        {t('Common')}
      </Text>
      <Space wrap size={[12, 8]} style={{ marginBottom: 8 }}>
        <Field
          name="height"
          title={t('Height')}
          decorator={[FormItemLite]}
          component={[InputNumberAdapter, { min: 100, style: { width: 120 } }]}
        />
        <Field name="legend" decorator={[FormItemLite]} component={[CheckboxAdapter]} content={t('Legend')} />
        <Field name="tooltip" decorator={[FormItemLite]} component={[CheckboxAdapter]} content={t('Tooltip')} />
        <Field name="label" decorator={[FormItemLite]} component={[CheckboxAdapter]} content={t('Label')} />
      </Space>
    </ObjectField>
  );
});
