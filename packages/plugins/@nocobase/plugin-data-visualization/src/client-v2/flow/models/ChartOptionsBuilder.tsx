/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Select, InputNumber, Switch, Form, Slider, Segmented, Input, Radio, Space, Button, ColorPicker } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useT } from '../../locale';
import { normalizeBuilder, applyTypeChange, buildFieldOptions, getChartFormSpec } from './ChartOptionsBuilder.service';
import type { ChartTypeKey } from './ChartOptionsBuilder.service';
import { sleep, appendColon, useCompile } from '../utils';
import { useFlowSettingsContext } from '@nocobase/flow-engine';
import { useCharts, useDefaultChartType, type FieldOption } from '../../chart';

type BuilderFieldOption = Partial<FieldOption> & {
  label: string;
  value: string;
  key?: string;
};

const renderLabel = (label: string, lang?: string) => {
  return (
    <div
      style={{
        width: '100%',
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        fontWeight: 500,
      }}
    >
      <span>{appendColon(label, lang)}</span>
    </div>
  );
};

type FormItemSpec =
  | {
      kind: 'select';
      name: string;
      labelKey?: string;
      label?: string;
      required?: boolean;
      allowClear?: boolean;
      placeholderKey?: string;
    }
  | { kind: 'switch'; name: string; labelKey: string }
  | { kind: 'number'; name: string; labelKey: string; min?: number; max?: number }
  | { kind: 'enum'; name: string; labelKey: string; options: { labelKey?: string; label?: string; value: string }[] }
  | { kind: 'slider'; name: string; labelKey: string; min?: number; max?: number }
  | {
      kind: 'segmented';
      name: string;
      labelKey: string;
      options: { labelKey?: string; label?: string; value: number }[];
    };

export const ChartOptionsBuilder: React.FC<{
  columns?: string[];
  fieldOptions?: BuilderFieldOption[];
  query?: any;
  initialValues: any;
  onChange: (next: any) => void;
}> = ({ columns, fieldOptions: fieldOptionsProp, query, initialValues, onChange }) => {
  const t = useT();
  const compile = useCompile();
  const [form] = Form.useForm();
  const ctx = useFlowSettingsContext<any>();
  const lang = ctx?.i18n?.language;
  const charts = useCharts();
  const defaultRegisteredChartType = useDefaultChartType();
  const fieldOptions = useMemo(() => fieldOptionsProp || buildFieldOptions(columns || []), [columns, fieldOptionsProp]);
  const registeredChartOptions = useMemo(() => {
    return Object.entries(charts).map(([value, chart]: any) => ({
      label: compile(chart.title),
      value,
    }));
  }, [charts, compile]);
  const defaultChartType = initialValues?.type || defaultRegisteredChartType || 'line';

  const renderText = React.useCallback(
    (value?: string) => {
      if (!value) return '';
      const compiled = compile(value);
      return typeof compiled === 'string' && compiled !== value ? compiled : t(value);
    },
    [compile, t],
  );

  // 为通用布尔项注入默认值，保证 UI 与生成配置一致
  const computedInitialValues = useMemo(
    () => ({ legend: true, tooltip: true, label: false, type: defaultChartType, ...initialValues }),
    [defaultChartType, initialValues],
  );

  // 程序化回填时抑制一次 onValuesChange，避免循环
  const ignoreOnValuesChangeRef = useRef(false);

  // 列变化规范化：仅在列非空时执行；基于当前表单值进行规范化并外抛，同时回填到表单
  useEffect(() => {
    if (!columns || columns.length === 0) return;
    const handleColumnChange = async () => {
      const current = form.getFieldsValue(true);
      const chart = charts[current?.type];
      const next = chart
        ? normalizeRegisteredChartBuilder(current, chart, fieldOptions, query)
        : normalizeBuilder(current, columns);
      if (JSON.stringify(next) !== JSON.stringify(current)) {
        ignoreOnValuesChangeRef.current = true;
        form.setFieldsValue(next);
        await sleep(0);
        ignoreOnValuesChangeRef.current = false;
        onChange(next);
      }
    };
    handleColumnChange();
  }, [charts, columns, fieldOptions, form, onChange, query]);

  // 用户编辑：基于 all（当前表单值），在列就绪时规范化并外抛；列未就绪时仅外抛用户变更
  const handleValuesChange = (changed: any, all: any) => {
    if (ignoreOnValuesChangeRef.current) return;

    const noColumns = !columns || columns.length === 0;
    let next = { ...all };

    const chart = charts[all?.type];
    if ('type' in changed && chart) {
      next = normalizeRegisteredChartBuilder(all, chart, fieldOptions, query, true);
      ignoreOnValuesChangeRef.current = true;
      form.setFieldsValue(next);
      setTimeout(() => {
        ignoreOnValuesChangeRef.current = false;
      }, 0);
      onChange(next);
      return;
    }

    if ('type' in changed && !noColumns) {
      next = applyTypeChange(next, all.type, columns);
    }
    if (!noColumns && !chart) {
      next = normalizeBuilder(next, columns);
    }

    onChange(next);
  };

  const type = Form.useWatch('type', form) ?? defaultChartType;
  const registeredChart = charts[type];
  const chartTypeOptions = useMemo(() => {
    const builtinOptions = [
      { label: t('Line'), value: 'line' },
      { label: t('Area'), value: 'area' },
      { label: t('Column'), value: 'bar' },
      { label: t('Bar'), value: 'barHorizontal' },
      { label: t('Pie'), value: 'pie' },
      { label: t('Doughnut'), value: 'doughnut' },
      { label: t('Funnel'), value: 'funnel' },
      { label: t('Scatter'), value: 'scatter' },
    ] as any;

    if (!registeredChartOptions.length) {
      return builtinOptions;
    }

    return [
      {
        label: t('Extension charts'),
        options: registeredChartOptions,
      },
      {
        label: t('Built-in charts'),
        options: builtinOptions,
      },
    ];
  }, [registeredChartOptions, t]);

  return (
    <div style={{ padding: 1 }}>
      <Form
        form={form}
        layout="vertical"
        colon
        initialValues={computedInitialValues}
        onValuesChange={handleValuesChange}
      >
        {/* 图表类型 */}
        <Form.Item label={renderLabel(t('Chart type'), lang)} name="type" required>
          <Select style={{ width: 180 }} options={chartTypeOptions as any} />
        </Form.Item>

        {/* 图表属性 */}
        {registeredChart
          ? renderRegisteredChartOptions(registeredChart, { renderText, fieldOptions, lang })
          : renderChartOptions(type, { t, fieldOptions, lang })}

        {!registeredChart && (
          <>
            <Form.Item name="legend" valuePropName="checked" label={renderLabel(t('Legend'), lang)}>
              <Switch />
            </Form.Item>
            <Form.Item name="tooltip" valuePropName="checked" label={renderLabel(t('Tooltip'), lang)}>
              <Switch />
            </Form.Item>
            <Form.Item name="label" valuePropName="checked" label={renderLabel(t('Label'), lang)}>
              <Switch />
            </Form.Item>
          </>
        )}
      </Form>
    </div>
  );
};

function renderItem(
  spec: FormItemSpec,
  ctx: { t: (s: string) => string; fieldOptions: { label: string; value: string }[]; lang?: string },
) {
  const { t, fieldOptions, lang } = ctx;
  if (spec.kind === 'select') {
    return (
      <Form.Item
        key={spec.name}
        label={renderLabel(t(spec.labelKey || spec.label || ''), lang)}
        name={spec.name}
        required={spec.required}
      >
        <Select
          style={{ width: 180 }}
          allowClear={!!spec.allowClear}
          placeholder={spec.placeholderKey ? t(spec.placeholderKey) : undefined}
          options={fieldOptions}
        />
      </Form.Item>
    );
  }
  if (spec.kind === 'switch') {
    return (
      <Form.Item key={spec.name} name={spec.name} valuePropName="checked" label={renderLabel(t(spec.labelKey), lang)}>
        <Switch />
      </Form.Item>
    );
  }
  if (spec.kind === 'number') {
    return (
      <Form.Item key={spec.name} label={renderLabel(t(spec.labelKey), lang)} name={spec.name}>
        <InputNumber min={spec.min} max={spec.max} style={{ width: 180 }} />
      </Form.Item>
    );
  }
  if (spec.kind === 'slider') {
    const min = spec.min ?? 0;
    const max = spec.max ?? 100;
    return (
      <Form.Item key={spec.name} label={renderLabel(t(spec.labelKey), lang)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Form.Item name={spec.name} style={{ margin: 0, paddingLeft: 6 }}>
            <Slider min={min} max={max} step={1} style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name={spec.name} noStyle>
            <InputNumber min={min} max={max} step={1} style={{ width: 80 }} />
          </Form.Item>
        </div>
      </Form.Item>
    );
  }
  if (spec.kind === 'enum') {
    return (
      <Form.Item key={spec.name} label={renderLabel(t(spec.labelKey), lang)} name={spec.name}>
        <Select
          style={{ width: 180 }}
          options={(spec.options || []).map((o) => ({ label: t(o.labelKey || o.label || ''), value: o.value }))}
        />
      </Form.Item>
    );
  }
  if (spec.kind === 'segmented') {
    return (
      <Form.Item key={spec.name} label={renderLabel(t(spec.labelKey), lang)} name={spec.name}>
        <Segmented
          options={(spec.options || []).map((o) => ({ label: t(o.labelKey || o.label || ''), value: o.value }))}
        />
      </Form.Item>
    );
  }
  return null;
}

function normalizeRegisteredChartBuilder(
  builder: any = {},
  chart: any,
  fieldOptions: BuilderFieldOption[],
  query?: any,
  reset = false,
) {
  const properties = chart.schema?.properties;
  const defaults = getSchemaDefaults(properties);
  const initValues = chart.init?.(buildChartFields(fieldOptions), {
    measures: query?.measures || [],
    dimensions: query?.dimensions || [],
  })?.general;
  const currentValues = reset
    ? {}
    : normalizeRegisteredChartFieldValues(builder, properties, fieldOptions, query, initValues);

  return {
    ...defaults,
    ...initValues,
    ...currentValues,
    type: builder?.type,
  };
}

function getValidChartFieldValues(fieldOptions: BuilderFieldOption[], query?: any) {
  const queryItems = [...(query?.dimensions || []), ...(query?.measures || [])];
  const queryValues = queryItems
    .map((item) => item?.alias || (Array.isArray(item?.field) ? item.field.filter(Boolean).join('.') : item?.field))
    .filter(Boolean);

  if (query?.mode !== 'sql' && queryValues.length) {
    return new Set(queryValues);
  }

  return new Set((fieldOptions || []).map((field) => field.value).filter(Boolean));
}

function getChartFieldNames(properties: Record<string, any> = {}) {
  return Object.entries(properties).reduce((result, [name, schema]: any) => {
    if (schema?.['x-reactions'] === '{{ useChartFields }}') {
      result.add(name);
    }
    return result;
  }, new Set<string>());
}

function isValidChartFieldValue(value: any, validValues: Set<string>) {
  if (Array.isArray(value)) {
    return value.length > 0 && value.every((item) => validValues.has(item));
  }
  return value !== undefined && value !== null && value !== '' && validValues.has(value);
}

function normalizeRegisteredChartFieldValues(
  builder: any = {},
  properties: Record<string, any> = {},
  fieldOptions: BuilderFieldOption[],
  query?: any,
  initValues: Record<string, any> = {},
) {
  const next = { ...builder };
  const validValues = getValidChartFieldValues(fieldOptions, query);
  const fieldNames = getChartFieldNames(properties);

  Object.entries(initValues || {}).forEach(([name, value]) => {
    if (isValidChartFieldValue(value, validValues)) {
      fieldNames.add(name);
    }
  });

  fieldNames.forEach((name) => {
    if (Object.prototype.hasOwnProperty.call(next, name) && !isValidChartFieldValue(next[name], validValues)) {
      delete next[name];
    }
  });

  return next;
}

function getSchemaDefaults(properties: Record<string, any> = {}) {
  return Object.entries(properties).reduce(
    (result, [name, schema]: any) => {
      if (schema?.default !== undefined) {
        result[name] = schema.default;
      }
      if (schema?.type === 'object' && schema?.properties) {
        const childDefaults = getSchemaDefaults(schema.properties);
        if (Object.keys(childDefaults).length) {
          result[name] = { ...(result[name] || {}), ...childDefaults };
        }
      }
      return result;
    },
    {} as Record<string, any>,
  );
}

function normalizeFieldType(field: BuilderFieldOption) {
  const type = field.type || field.interface;
  if (type && ['datetimeTz', 'datetimeNoTz', 'createdAt', 'updatedAt', 'unixTimestamp'].includes(type)) {
    return 'datetime';
  }
  return type;
}

function buildChartFields(fieldOptions: BuilderFieldOption[]) {
  return fieldOptions.map((field) => ({
    ...field,
    key: field.value,
    name: field.value,
    value: field.value,
    label: field.label,
    type: normalizeFieldType(field),
  }));
}

function renderRegisteredChartOptions(
  chart: any,
  ctx: {
    renderText: (value?: string) => string;
    fieldOptions: BuilderFieldOption[];
    lang?: string;
  },
) {
  const properties = chart?.schema?.properties || {};
  return <>{Object.entries(properties).map(([name, schema]: any) => renderSchemaItem(name, schema, ctx))}</>;
}

function renderSchemaItem(
  name: string,
  schema: any,
  ctx: {
    renderText: (value?: string) => string;
    fieldOptions: BuilderFieldOption[];
    lang?: string;
  },
) {
  const { renderText, fieldOptions, lang } = ctx;
  const component = schema?.['x-component'];
  const label = renderLabel(renderText(schema?.title || schema?.['x-content'] || name), lang);

  if (component === 'Select') {
    const isFieldSelect = schema?.['x-reactions'] === '{{ useChartFields }}';
    const options = isFieldSelect
      ? fieldOptions
      : (schema?.enum || schema?.['x-component-props']?.options || []).map((option: any) => ({
          ...option,
          label: renderText(option.label),
        }));
    return (
      <Form.Item key={name} label={label} name={name} required={schema?.required}>
        <Select style={{ width: 180 }} allowClear={!schema?.required} options={options} />
      </Form.Item>
    );
  }

  if (component === 'Radio.Group') {
    return (
      <Form.Item key={name} label={label} name={name}>
        <Radio.Group
          options={(schema?.enum || []).map((option: any) => ({ ...option, label: renderText(option.label) }))}
        />
      </Form.Item>
    );
  }

  if (component === 'Checkbox') {
    return (
      <Form.Item key={name} name={name} valuePropName="checked" label={label}>
        <Switch />
      </Form.Item>
    );
  }

  if (component === 'InputNumber') {
    const componentProps = schema?.['x-component-props'] || {};
    return (
      <Form.Item key={name} label={label} name={name}>
        <InputNumber min={componentProps.min} max={componentProps.max} style={{ width: 180 }} />
      </Form.Item>
    );
  }

  if (component === 'Slider') {
    const componentProps = schema?.['x-component-props'] || {};
    return (
      <Form.Item key={name} label={label}>
        <Space>
          <Form.Item name={name} noStyle>
            <Slider min={componentProps.min ?? 0} max={componentProps.max ?? 100} step={1} style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name={name} noStyle>
            <InputNumber min={componentProps.min ?? 0} max={componentProps.max ?? 100} step={1} style={{ width: 80 }} />
          </Form.Item>
        </Space>
      </Form.Item>
    );
  }

  if (component === 'Input') {
    return (
      <Form.Item key={name} label={label} name={name}>
        <Input style={{ width: 180 }} />
      </Form.Item>
    );
  }

  if (component === 'ArrayItems') {
    return renderArraySchemaItem(name, schema, ctx);
  }

  if (component === 'Space' && schema?.properties) {
    return (
      <Form.Item key={name} label={label}>
        {renderSpaceSchemaControls([name], schema, ctx)}
      </Form.Item>
    );
  }

  return null;
}

function renderSpaceSchemaControls(
  namePath: (string | number)[],
  schema: any,
  ctx: {
    renderText: (value?: string) => string;
    fieldOptions: BuilderFieldOption[];
    lang?: string;
  },
) {
  return (
    <Space wrap>
      {Object.entries(schema.properties || {}).map(([childName, childSchema]: any) =>
        renderInlineSchemaControl([...namePath, childName], childName, childSchema, ctx),
      )}
    </Space>
  );
}

function renderInlineSchemaControl(
  namePath: (string | number)[],
  key: string,
  schema: any,
  ctx: {
    renderText: (value?: string) => string;
    fieldOptions: BuilderFieldOption[];
    lang?: string;
  },
) {
  const { renderText } = ctx;
  const component = schema?.['x-component'];
  const componentProps = schema?.['x-component-props'] || {};

  if (component === 'Text') {
    return <span key={key}>{renderText(componentProps.children)}</span>;
  }

  if (component === 'Space' && schema?.properties) {
    return (
      <Space key={key} wrap>
        {Object.entries(schema.properties).map(([childName, childSchema]: any) =>
          renderInlineSchemaControl([...namePath, childName], childName, childSchema, ctx),
        )}
      </Space>
    );
  }

  if (component === 'Select') {
    return (
      <Form.Item key={key} name={namePath} style={{ margin: 0 }} required={schema?.required}>
        <Select
          style={{ width: 120 }}
          allowClear={componentProps.allowClear !== false}
          options={(schema?.enum || componentProps.options || []).map((option: any) => ({
            ...option,
            label: renderText(option.label),
          }))}
        />
      </Form.Item>
    );
  }

  if (component === 'InputNumber') {
    return (
      <Form.Item key={key} name={namePath} style={{ margin: 0 }} required={schema?.required}>
        <InputNumber
          placeholder={renderText(componentProps.placeholder)}
          min={componentProps.min}
          max={componentProps.max}
          style={{ width: 90 }}
        />
      </Form.Item>
    );
  }

  if (component === 'ColorPicker') {
    return (
      <Form.Item key={key} name={namePath} style={{ margin: 0 }} getValueFromEvent={(_, hex) => hex}>
        <ColorPicker showText />
      </Form.Item>
    );
  }

  return (
    <Form.Item key={key} name={namePath} style={{ margin: 0 }} required={schema?.required}>
      <Input placeholder={renderText(componentProps.placeholder)} style={{ width: 90 }} />
    </Form.Item>
  );
}

function renderArraySchemaItem(
  name: string,
  schema: any,
  ctx: {
    renderText: (value?: string) => string;
    fieldOptions: BuilderFieldOption[];
    lang?: string;
  },
) {
  const { renderText, lang } = ctx;
  const label = renderLabel(renderText(schema?.title || name), lang);
  const itemProperties = schema?.items?.properties?.space?.properties || schema?.items?.properties || {};
  const isPrimitiveColorArray =
    name === 'colors' && Object.keys(itemProperties).some((propertyName) => propertyName === 'color');

  return (
    <Form.Item key={name} label={label}>
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <Space direction="vertical" style={{ width: '100%' }}>
            {fields.map((field) => (
              <Space key={field.key} wrap align="baseline">
                {isPrimitiveColorArray
                  ? renderColorPicker(field.name, undefined)
                  : Object.entries(itemProperties)
                      .filter(([, childSchema]: any) => childSchema?.type !== 'void')
                      .map(([childName, childSchema]: any) =>
                        renderArrayProperty(field.name, childName, childSchema, renderText),
                      )}
                <Button type="text" icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
              </Space>
            ))}
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => add(isPrimitiveColorArray ? undefined : {})}>
              {renderText('Add')}
            </Button>
          </Space>
        )}
      </Form.List>
    </Form.Item>
  );
}

function renderArrayProperty(
  listIndex: number,
  propertyName: string,
  schema: any,
  renderText: (value?: string) => string,
) {
  const component = schema?.['x-component'];
  const componentProps = schema?.['x-component-props'] || {};
  const name = [listIndex, propertyName];

  if (component === 'InputNumber') {
    return (
      <Form.Item key={propertyName} name={name} style={{ margin: 0 }} required={schema?.required}>
        <InputNumber
          placeholder={renderText(componentProps.placeholder)}
          min={componentProps.min}
          max={componentProps.max}
          style={{ width: 110 }}
        />
      </Form.Item>
    );
  }

  if (component === 'ColorPicker') {
    return renderColorPicker(listIndex, propertyName);
  }

  return (
    <Form.Item key={propertyName} name={name} style={{ margin: 0 }} required={schema?.required}>
      <Input placeholder={renderText(componentProps.placeholder)} style={{ width: 120 }} />
    </Form.Item>
  );
}

function renderColorPicker(listIndex: number, propertyName?: string) {
  const name = propertyName ? [listIndex, propertyName] : listIndex;
  return (
    <Form.Item key={propertyName || 'color'} name={name} style={{ margin: 0 }} getValueFromEvent={(_, hex) => hex}>
      <ColorPicker showText />
    </Form.Item>
  );
}

const renderChartOptions = (
  type: ChartTypeKey,
  options: { t: (s: string) => string; fieldOptions: { label: string; value: string }[]; lang?: string },
) => {
  const formSpecs = getChartFormSpec(type);
  return <>{(formSpecs as any[]).map((spec) => renderItem(spec as any, options))}</>;
};
