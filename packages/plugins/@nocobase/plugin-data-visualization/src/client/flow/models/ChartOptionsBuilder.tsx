/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Select, InputNumber, Checkbox, Space, Divider, Typography, Form } from 'antd';
import { useT } from '../../locale';

const { Text } = Typography;

// 顶部模块作用域：替换内联函数为从 service 引入
import { genRawByBuilder, normalizeBuilder, applyTypeChange, buildFieldOptions } from './ChartOptionsBuilder.service';

// 将各图表类型的“必选/可选”UI 片段集中配置，避免在渲染处多重条件判断
const typeUISchema: Record<
  'line' | 'bar' | 'pie',
  {
    required: (ctx: {
      t: (s: string) => string;
      disabled?: boolean;
      fieldOptions: { label: string; value: string }[];
      builder: any;
      setBuilder: (patch: Partial<any>) => void;
    }) => React.ReactNode;
    optional: (ctx: {
      t: (s: string) => string;
      disabled?: boolean;
      fieldOptions: { label: string; value: string }[];
      builder: any;
      setBuilder: (patch: Partial<any>) => void;
    }) => React.ReactNode;
  }
> = {
  line: {
    required: ({ t, disabled, fieldOptions, builder, setBuilder }) => (
      <Space wrap size={[12, 8]} align="start" style={{ marginBottom: 8, width: '100%', justifyContent: 'flex-start' }}>
        <div>
          <Typography.Text style={{ display: 'block', marginBottom: 4 }}>xField</Typography.Text>
          <Select
            placeholder={t('Select field')}
            style={{ minWidth: 160 }}
            disabled={disabled}
            options={fieldOptions}
            value={builder.xField}
            onChange={(v) => setBuilder({ xField: v })}
          />
        </div>
        <div>
          <Typography.Text style={{ display: 'block', marginBottom: 4 }}>yField</Typography.Text>
          <Select
            placeholder={t('Select field')}
            style={{ minWidth: 160 }}
            disabled={disabled}
            options={fieldOptions}
            value={builder.yField}
            onChange={(v) => setBuilder({ yField: v })}
          />
        </div>
      </Space>
    ),
    optional: ({ t, disabled, fieldOptions, builder, setBuilder }) => (
      <Space wrap size={[12, 8]} align="start" style={{ marginBottom: 8, width: '100%', justifyContent: 'flex-start' }}>
        <div>
          <Typography.Text style={{ display: 'block', marginBottom: 4 }}>seriesField</Typography.Text>
          <Select
            allowClear
            placeholder={t('Optional series')}
            style={{ minWidth: 160 }}
            disabled={disabled}
            options={fieldOptions}
            value={builder.seriesField}
            onChange={(v) => setBuilder({ seriesField: v })}
          />
        </div>
        <Checkbox
          disabled={disabled}
          checked={!!builder.smooth}
          onChange={(e) => setBuilder({ smooth: e.target.checked })}
        >
          {t('Smooth')}
        </Checkbox>
      </Space>
    ),
  },
  bar: {
    required: ({ t, disabled, fieldOptions, builder, setBuilder }) =>
      typeUISchema.line.required({ t, disabled, fieldOptions, builder, setBuilder }),
    optional: ({ t, disabled, fieldOptions, builder, setBuilder }) => (
      <Space wrap size={[12, 8]} align="start" style={{ marginBottom: 8, width: '100%', justifyContent: 'flex-start' }}>
        <div>
          <Typography.Text style={{ display: 'block', marginBottom: 4 }}>seriesField</Typography.Text>
          <Select
            allowClear
            placeholder={t('Optional series')}
            style={{ minWidth: 160 }}
            disabled={disabled}
            options={fieldOptions}
            value={builder.seriesField}
            onChange={(v) => setBuilder({ seriesField: v })}
          />
        </div>
        <Checkbox
          disabled={disabled}
          checked={!!builder.stack}
          onChange={(e) => setBuilder({ stack: e.target.checked })}
        >
          {t('Stack')}
        </Checkbox>
      </Space>
    ),
  },
  pie: {
    required: ({ t, disabled, fieldOptions, builder, setBuilder }) => (
      <Space wrap size={[12, 8]} align="start" style={{ marginBottom: 8, width: '100%', justifyContent: 'flex-start' }}>
        <div>
          <Typography.Text style={{ display: 'block', marginBottom: 4 }}>{t('Category')}</Typography.Text>
          <Select
            placeholder={t('Select field')}
            style={{ minWidth: 160 }}
            disabled={disabled}
            options={fieldOptions}
            value={builder.pieCategory}
            onChange={(v) => setBuilder({ pieCategory: v })}
          />
        </div>
        <div>
          <Typography.Text style={{ display: 'block', marginBottom: 4 }}>{t('Value field')}</Typography.Text>
          <Select
            placeholder={t('Select field')}
            style={{ minWidth: 160 }}
            disabled={disabled}
            options={fieldOptions}
            value={builder.pieValue}
            onChange={(v) => setBuilder({ pieValue: v })}
          />
        </div>
      </Space>
    ),
    optional: ({ t, disabled, builder, setBuilder }) => (
      <Space wrap size={[12, 8]} align="start" style={{ marginBottom: 8, width: '100%', justifyContent: 'flex-start' }}>
        <div>
          <Typography.Text style={{ display: 'block', marginBottom: 4 }}>{t('Inner radius (%)')}</Typography.Text>
          <InputNumber
            min={0}
            max={100}
            style={{ width: 120 }}
            disabled={disabled}
            value={builder.pieRadiusInner}
            onChange={(v) => setBuilder({ pieRadiusInner: v ?? 0 })}
          />
        </div>
        <div>
          <Typography.Text style={{ display: 'block', marginBottom: 4 }}>{t('Outer radius (%)')}</Typography.Text>
          <InputNumber
            min={0}
            max={100}
            style={{ width: 120 }}
            disabled={disabled}
            value={builder.pieRadiusOuter}
            onChange={(v) => setBuilder({ pieRadiusOuter: v ?? 70 })}
          />
        </div>
      </Space>
    ),
  },
};

export const ChartOptionsBuilder: React.FC<{
  columns: string[];
  value?: any;
  defaultValue?: any;
  onChange?: (next: any) => void;
  onRawChange?: (raw: string) => void;
  disabled?: boolean;
}> = ({ columns, value, defaultValue, onChange, onRawChange, disabled }) => {
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

  // [删除] 重复的 useEffect（会重复触发 onRawChange）
  // // builder 改变时，同步 raw
  // useEffect(() => {
  //   onRawChange?.(genRawByBuilder(builder));
  // }, [builder, onRawChange]);

  // [删除] 重复的 type 声明
  // const type = builder?.type ?? 'line';

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
        disabled={disabled}
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
        {/* 必选配置 */}
        <Divider style={{ margin: '8px 0' }} />
        <Text strong style={{ display: 'block', marginBottom: 6 }}>
          {t('Required')}
        </Text>
        {type === 'line' || type === 'bar' ? (
          <Space wrap size={[12, 8]} style={{ marginBottom: 8 }}>
            <Form.Item label="xField" name="xField">
              <Select placeholder={t('Select field')} style={{ minWidth: 160 }} options={fieldOptions} />
            </Form.Item>
            <Form.Item label="yField" name="yField">
              <Select placeholder={t('Select field')} style={{ minWidth: 160 }} options={fieldOptions} />
            </Form.Item>
          </Space>
        ) : (
          <Space wrap size={[12, 8]} style={{ marginBottom: 8 }}>
            <Form.Item label={t('Category')} name="pieCategory">
              <Select placeholder={t('Select field')} style={{ minWidth: 160 }} options={fieldOptions} />
            </Form.Item>
            <Form.Item label={t('Value field')} name="pieValue">
              <Select placeholder={t('Select field')} style={{ minWidth: 160 }} options={fieldOptions} />
            </Form.Item>
          </Space>
        )}

        {/* 可选配置 */}
        <Divider style={{ margin: '8px 0' }} />
        <Text strong style={{ display: 'block', marginBottom: 6 }}>
          {t('Optional')}
        </Text>
        {type === 'line' && (
          <Space wrap size={[12, 8]} style={{ marginBottom: 8 }}>
            <Form.Item label="seriesField" name="seriesField">
              <Select allowClear placeholder={t('Optional series')} style={{ minWidth: 160 }} options={fieldOptions} />
            </Form.Item>
            <Form.Item name="smooth" valuePropName="checked" colon={false} label=" ">
              <Checkbox>{t('Smooth')}</Checkbox>
            </Form.Item>
          </Space>
        )}
        {type === 'bar' && (
          <Space wrap size={[12, 8]} style={{ marginBottom: 8 }}>
            <Form.Item label="seriesField" name="seriesField">
              <Select allowClear placeholder={t('Optional series')} style={{ minWidth: 160 }} options={fieldOptions} />
            </Form.Item>
            <Form.Item name="stack" valuePropName="checked" colon={false} label=" ">
              <Checkbox>{t('Stack')}</Checkbox>
            </Form.Item>
          </Space>
        )}
        {type === 'pie' && (
          <Space wrap size={[12, 8]} style={{ marginBottom: 8 }}>
            <Form.Item label={t('Inner radius (%)')} name="pieRadiusInner">
              <InputNumber min={0} max={100} style={{ width: 120 }} />
            </Form.Item>
            <Form.Item label={t('Outer radius (%)')} name="pieRadiusOuter">
              <InputNumber min={0} max={100} style={{ width: 120 }} />
            </Form.Item>
          </Space>
        )}
        {/* 公共属性 */}
        <Divider style={{ margin: '8px 0' }} />
        <Text strong style={{ display: 'block', marginBottom: 6 }}>
          {t('Common')}
        </Text>
        <Space wrap size={[12, 8]} style={{ marginBottom: 8 }}>
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
        </Space>
      </Form>
    </div>
  );
};
