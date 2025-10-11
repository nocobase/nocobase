/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Select, InputNumber, Checkbox, Form } from 'antd';
import { useT } from '../../locale';
import { normalizeBuilder, applyTypeChange, buildFieldOptions } from './ChartOptionsBuilder.service';
import { sleep } from '../utils';

export const ChartOptionsBuilder: React.FC<{
  columns?: string[];
  initialValues: any;
  onChange: (next: any) => void;
}> = ({ columns, initialValues, onChange }) => {
  const t = useT();
  const [form] = Form.useForm();

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
  }, [columns]);

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
        layout="horizontal"
        labelCol={{ flex: '120px' }}
        wrapperCol={{ flex: 'auto' }}
        labelAlign="right"
        colon={false}
        style={{ textAlign: 'left' }}
        initialValues={initialValues}
        onValuesChange={handleValuesChange}
      >
        {/* 图表类型 */}
        <Form.Item label={t('Chart type')} name="type">
          <Select
            style={{ width: 160 }}
            options={[
              { label: t('Line'), value: 'line' },
              { label: t('Bar'), value: 'bar' },
              { label: t('Pie'), value: 'pie' },
            ]}
          />
        </Form.Item>

        {/* 图表属性 */}
        {getChartFormItems(type, { t, fieldOptions })}

        {/* 公共属性 */}
        {/* <Form.Item label={t('Height')} name="height">
          <InputNumber min={100} style={{ width: 160 }} />
        </Form.Item> */}
        <Form.Item name="legend" valuePropName="checked" colon={false} label=" ">
          <Checkbox>{t('Legend')}</Checkbox>
        </Form.Item>
        <Form.Item name="tooltip" valuePropName="checked" colon={false} label=" ">
          <Checkbox>{t('Tooltip')}</Checkbox>
        </Form.Item>
        <Form.Item name="label" valuePropName="checked" colon={false} label=" ">
          <Checkbox>{t('Label')}</Checkbox>
        </Form.Item>
      </Form>
    </div>
  );
};

const getChartFormItems = (
  type: 'line' | 'bar' | 'pie' = 'line',
  options: {
    t: (s: string) => string;
    fieldOptions: { label: string; value: string }[];
  },
) => {
  const { t, fieldOptions } = options;
  if (type === 'line' || type === 'bar') {
    return (
      <>
        {/* required */}
        <Form.Item label="xField" name="xField" required>
          <Select style={{ width: 160 }} placeholder={t('Select field')} options={fieldOptions} />
        </Form.Item>

        <Form.Item label="yField" name="yField" required>
          <Select style={{ width: 160 }} placeholder={t('Select field')} options={fieldOptions} />
        </Form.Item>

        {/* optional */}
        <Form.Item label="seriesField" name="seriesField">
          <Select style={{ width: 160 }} allowClear placeholder={t('Optional series')} options={fieldOptions} />
        </Form.Item>

        {type === 'line' ? (
          <Form.Item name="smooth" valuePropName="checked" colon={false} label=" ">
            <Checkbox>{t('Smooth')}</Checkbox>
          </Form.Item>
        ) : (
          <></>
          // TODO: 关于堆叠stack https://echarts.apache.org/handbook/zh/how-to/chart-types/bar/stacked-bar
          // <Form.Item name="stack" valuePropName="checked" colon={false} label=" ">
          //   <Checkbox>{t('Stack')}</Checkbox>
          // </Form.Item>
        )}
      </>
    );
  }
  // pie
  if (type === 'pie') {
    return (
      <>
        {/* required */}
        <Form.Item label={t('Category')} name="pieCategory" required>
          <Select style={{ width: 160 }} placeholder={t('Select field')} options={fieldOptions} />
        </Form.Item>

        <Form.Item label={t('Value field')} name="pieValue" required>
          <Select style={{ width: 160 }} placeholder={t('Select field')} options={fieldOptions} />
        </Form.Item>

        {/* optional */}
        <Form.Item label={t('Inner radius (%)')} name="pieRadiusInner">
          <InputNumber min={0} max={100} style={{ width: 160 }} />
        </Form.Item>

        <Form.Item label={t('Outer radius (%)')} name="pieRadiusOuter">
          <InputNumber min={0} max={100} style={{ width: 160 }} />
        </Form.Item>
      </>
    );
  }
  return null;
};
