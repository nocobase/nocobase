/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Select, InputNumber, Switch, Form, Slider, Segmented } from 'antd';
import { useT } from '../../locale';
import { normalizeBuilder, applyTypeChange, buildFieldOptions, getChartFormSpec } from './ChartOptionsBuilder.service';
import type { ChartTypeKey } from './ChartOptionsBuilder.service';
import { sleep, appendColon } from '../utils';
import { useFlowSettingsContext } from '@nocobase/flow-engine';

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
  initialValues: any;
  onChange: (next: any) => void;
}> = ({ columns, initialValues, onChange }) => {
  const t = useT();
  const [form] = Form.useForm();
  const ctx = useFlowSettingsContext<any>();
  const lang = ctx?.i18n?.language;

  // 为通用布尔项注入默认值，保证 UI 与生成配置一致
  const computedInitialValues = useMemo(
    () => ({ legend: true, tooltip: true, label: false, ...initialValues }),
    [initialValues],
  );

  // 程序化回填时抑制一次 onValuesChange，避免循环
  const ignoreOnValuesChangeRef = useRef(false);

  // 列变化规范化：仅在列非空时执行；基于当前表单值进行规范化并外抛，同时回填到表单
  useEffect(() => {
    if (!columns || columns.length === 0) return;
    const handleColumnChange = async () => {
      const current = form.getFieldsValue(true);
      const next = normalizeBuilder(current, columns);
      if (JSON.stringify(next) !== JSON.stringify(current)) {
        ignoreOnValuesChangeRef.current = true;
        form.setFieldsValue(next);
        await sleep(0);
        ignoreOnValuesChangeRef.current = false;
        onChange(next);
      }
    };
    handleColumnChange();
  }, [columns, form, onChange]);

  // 用户编辑：基于 all（当前表单值），在列就绪时规范化并外抛；列未就绪时仅外抛用户变更
  const handleValuesChange = (changed: any, all: any) => {
    if (ignoreOnValuesChangeRef.current) return;

    const noColumns = !columns || columns.length === 0;
    let next = { ...all };

    if ('type' in changed && !noColumns) {
      next = applyTypeChange(next, all.type, columns);
    }
    if (!noColumns) {
      next = normalizeBuilder(next, columns);
    }

    onChange(next);
  };

  const type = Form.useWatch('type', form) ?? 'line';
  const fieldOptions = useMemo(() => buildFieldOptions(columns || []), [columns]);

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
        <Form.Item
          label={<span style={{ fontWeight: 500 }}>{appendColon(t('Chart type'), lang)}</span>}
          name="type"
          required
        >
          <Select
            style={{ width: 180 }}
            options={[
              { label: t('Line'), value: 'line' },
              { label: t('Area'), value: 'area' },
              { label: t('Column'), value: 'bar' },
              { label: t('Bar'), value: 'barHorizontal' },
              { label: t('Pie'), value: 'pie' },
              { label: t('Doughnut'), value: 'doughnut' },
              { label: t('Funnel'), value: 'funnel' },
              { label: t('Scatter'), value: 'scatter' },
            ]}
          />
        </Form.Item>

        {/* 图表属性 */}
        {renderChartOptions(type, { t, fieldOptions, lang })}

        {/* 公共属性 */}
        {/* <Form.Item label={t('Height')} name="height">
          <InputNumber min={100} style={{ width: 180 }} />
        </Form.Item> */}
        <Form.Item
          name="legend"
          valuePropName="checked"
          label={<span style={{ fontWeight: 500 }}>{appendColon(t('Legend'), lang)}</span>}
        >
          <Switch />
        </Form.Item>
        <Form.Item
          name="tooltip"
          valuePropName="checked"
          label={<span style={{ fontWeight: 500 }}>{appendColon(t('Tooltip'), lang)}</span>}
        >
          <Switch />
        </Form.Item>
        <Form.Item
          name="label"
          valuePropName="checked"
          label={<span style={{ fontWeight: 500 }}>{appendColon(t('Label'), lang)}</span>}
        >
          <Switch />
        </Form.Item>
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
        label={<span style={{ fontWeight: 500 }}>{appendColon(t(spec.labelKey || spec.label || ''), lang)}</span>}
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
      <Form.Item
        key={spec.name}
        name={spec.name}
        valuePropName="checked"
        label={<span style={{ fontWeight: 500 }}>{appendColon(t(spec.labelKey), lang)}</span>}
      >
        <Switch />
      </Form.Item>
    );
  }
  if (spec.kind === 'number') {
    return (
      <Form.Item
        key={spec.name}
        label={<span style={{ fontWeight: 500 }}>{appendColon(t(spec.labelKey), lang)}</span>}
        name={spec.name}
      >
        <InputNumber min={spec.min} max={spec.max} style={{ width: 180 }} />
      </Form.Item>
    );
  }
  if (spec.kind === 'slider') {
    const min = spec.min ?? 0;
    const max = spec.max ?? 100;
    return (
      <Form.Item key={spec.name} label={<span style={{ fontWeight: 500 }}>{appendColon(t(spec.labelKey), lang)}</span>}>
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
      <Form.Item
        key={spec.name}
        label={<span style={{ fontWeight: 500 }}>{appendColon(t(spec.labelKey), lang)}</span>}
        name={spec.name}
      >
        <Select
          style={{ width: 180 }}
          options={(spec.options || []).map((o) => ({ label: t(o.labelKey || o.label || ''), value: o.value }))}
        />
      </Form.Item>
    );
  }
  if (spec.kind === 'segmented') {
    return (
      <Form.Item
        key={spec.name}
        label={<span style={{ fontWeight: 500 }}>{appendColon(t(spec.labelKey), lang)}</span>}
        name={spec.name}
      >
        <Segmented
          options={(spec.options || []).map((o) => ({ label: t(o.labelKey || o.label || ''), value: o.value }))}
        />
      </Form.Item>
    );
  }
  return null;
}

const renderChartOptions = (
  type: ChartTypeKey,
  options: { t: (s: string) => string; fieldOptions: { label: string; value: string }[]; lang?: string },
) => {
  const formSpecs = getChartFormSpec(type);
  return <>{(formSpecs as any[]).map((spec) => renderItem(spec as any, options))}</>;
};
