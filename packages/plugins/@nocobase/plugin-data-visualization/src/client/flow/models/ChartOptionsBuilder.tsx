/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// 顶部引入：移除 Row/Col
import React, { useEffect, useMemo, useState } from 'react';
import { Select, InputNumber, Checkbox, Space, Divider, Typography, Form } from 'antd';
import { useT } from '../../locale';
import { Row, Col } from 'antd';

const { Text } = Typography;

// 顶部模块作用域：替换内联函数为从 service 引入
import { genRawByBuilder, normalizeBuilder, applyTypeChange, buildFieldOptions } from './ChartOptionsBuilder.service';

export const ChartOptionsBuilder: React.FC<{
  columns: string[];
  value?: any;
  defaultValue?: any;
  onChange?: (next: any) => void;
  onRawChange?: (raw: string) => void;
}> = ({ columns, value, defaultValue, onChange, onRawChange }) => {
  const t = useT();
  const [form] = Form.useForm();

  // 受控/非受控一致化
  const [inner, setInner] = useState<any>(
    value ?? defaultValue ?? { type: 'line', legend: true, tooltip: true, label: false, height: 400 },
  );
  const builder = value ?? inner;

  // 将 builder 同步进表单（受控时由外部驱动，未受控时内部驱动）
  useEffect(() => {
    form.setFieldsValue(builder || {});
  }, [builder, form]);

  // 统一处理变更：类型切换、列变化的补全/清理，然后向外同步
  const handleValuesChange = (changed: any, all: any) => {
    let next = { ...builder, ...all };
    if ('type' in changed) {
      next = applyTypeChange(next, all.type, columns || []);
    }
    next = normalizeBuilder(next, columns || []);

    // 如果规范化后与当前表单值不同，回填到表单，避免 UI 与数据不一致
    if (JSON.stringify(next) !== JSON.stringify(all)) {
      form.setFieldsValue(next);
    }

    if (value !== undefined) {
      onChange?.(next);
    } else {
      setInner(next);
      onChange?.(next);
    }
  };

  // builder 变化 -> 同步 raw（保留这一处）
  useEffect(() => {
    onRawChange?.(genRawByBuilder(builder));
  }, [builder, onRawChange]);

  const type = Form.useWatch('type', form) ?? builder?.type ?? 'line';
  const fieldOptions = useMemo(() => buildFieldOptions(columns), [columns]);

  // 规范化：当列或图表类型变化时，补全/清理必填字段与无效选项
  useEffect(() => {
    const next = normalizeBuilder(builder, columns || []);
    const changed = JSON.stringify(next) !== JSON.stringify(builder);
    if (changed) {
      if (value !== undefined) {
        onChange?.(next);
      } else {
        setInner(next);
        onChange?.(next);
      }
    }
  }, [columns, builder?.type]); // 当列或图表类型变化时规范化

  // helper：统一更新 builder，并向外同步
  const setBuilder = (patch: Partial<typeof builder>) => {
    const next = { ...builder, ...patch };
    if (value !== undefined) {
      onChange?.(next);
    } else {
      setInner(next);
      onChange?.(next);
    }
  };

  // 切换图表类型
  const handleTypeChange = (v: 'line' | 'bar' | 'pie') => {
    const next = applyTypeChange(builder, v, columns || []);
    setBuilder(next);
  };

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
        initialValues={builder}
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
            onChange={handleTypeChange}
          />
        </Form.Item>

        <Divider style={{ margin: '8px 0' }} />

        {/* 图表属性 */}
        {getChartFormItems(type, { t, fieldOptions, builder })}

        <Divider style={{ margin: '8px 0' }} />

        {/* 公共属性 */}
        <Text strong style={{ display: 'block', marginBottom: 6 }}>
          {t('Common')}
        </Text>
        <Form.Item label={t('Height')} name="height">
          <InputNumber min={100} style={{ width: 120 }} />
        </Form.Item>
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
    builder?: any;
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
          <Form.Item name="stack" valuePropName="checked" colon={false} label=" ">
            <Checkbox>{t('Stack')}</Checkbox>
          </Form.Item>
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
          <InputNumber min={0} max={100} style={{ width: 120 }} />
        </Form.Item>

        <Form.Item label={t('Outer radius (%)')} name="pieRadiusOuter">
          <InputNumber min={0} max={100} style={{ width: 120 }} />
        </Form.Item>
      </>
    );
  }
  return null;
};
