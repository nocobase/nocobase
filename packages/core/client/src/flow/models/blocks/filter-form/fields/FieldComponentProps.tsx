/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { useField } from '@formily/react';
import { FormItem } from '@formily/antd-v5';
import { Input, Radio, Checkbox, Space, Button } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { FilterableItemModel, useFlowContext, useFlowEngine } from '@nocobase/flow-engine';

// 字段组件属性配置组件
export const FieldComponentProps: React.FC<{ fieldModel: string; source: string[] }> = ({
  fieldModel,
  source = [],
}) => {
  const field = useField<any>();
  const { t } = useTranslation();
  const propsValue = field.value || {};
  const flowEngine = useFlowEngine();
  const ctx = useFlowContext();

  const updateProps = (key: string, value: any) => {
    field.setValue({ ...propsValue, [key]: value });
  };

  useEffect(() => {
    if (!source.length) return undefined;
    const collectionField = flowEngine.dataSourceManager.getCollectionField(source.join('.'));
    const binding = FilterableItemModel.getDefaultBindingByField(ctx.model.context, collectionField);
    if (!binding) {
      return;
    }

    const fieldProps = collectionField.getComponentProps();

    const props =
      typeof binding.defaultProps === 'function'
        ? binding.defaultProps(ctx.model.context, field)
        : binding.defaultProps;

    field.setValue({ ...props, ...fieldProps, ...propsValue });
  }, [source.join('.')]);

  // DateTimeFilterFieldModel 的配置
  if (fieldModel === 'DateTimeFilterFieldModel') {
    return (
      <>
        <FormItem label={t('Date format')}>
          <Radio.Group
            value={propsValue.format || 'YYYY-MM-DD'}
            onChange={(e) => updateProps('format', e.target.value)}
          >
            <Radio value="YYYY/MM/DD">{t('Year/Month/Day')}</Radio>
            <Radio value="YYYY-MM-DD">{t('Year-Month-Day')}</Radio>
            <Radio value="DD/MM/YYYY">{t('Day/Month/Year')}</Radio>
          </Radio.Group>
        </FormItem>
        <FormItem label={t('Time')}>
          <Checkbox checked={propsValue.showTime} onChange={(e) => updateProps('showTime', e.target.checked)}>
            {t('Show time')}
          </Checkbox>
        </FormItem>
        <FormItem label={t('Date range')}>
          <Checkbox checked={propsValue.isRange} onChange={(e) => updateProps('isRange', e.target.checked)}>
            {t('Show date range')}
          </Checkbox>
        </FormItem>
      </>
    );
  }

  // SelectFieldModel 的配置
  if (fieldModel === 'SelectFieldModel') {
    const options = propsValue.options || [];
    return (
      <>
        <FormItem label={t('Mode')}>
          <Radio.Group value={propsValue.mode || ''} onChange={(e) => updateProps('mode', e.target.value)}>
            <Radio value="">{t('Single select')}</Radio>
            <Radio value="multiple">{t('Multiple select')}</Radio>
          </Radio.Group>
        </FormItem>
        <FormItem label={t('Options')}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {options.map((option: any, index: number) => (
              <Space key={index} style={{ width: '100%' }} size={8} wrap align="start">
                <Input
                  style={{ flex: 1, minWidth: 120 }}
                  placeholder={t('Option label')}
                  value={option.label}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[index] = { ...option, label: e.target.value };
                    updateProps('options', newOptions);
                  }}
                />
                <Input
                  style={{ flex: 1, minWidth: 120 }}
                  placeholder={t('Option value')}
                  value={option.value}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[index] = { ...option, value: e.target.value };
                    updateProps('options', newOptions);
                  }}
                />
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={() => {
                    const newOptions = options.filter((_: any, i: number) => i !== index);
                    updateProps('options', newOptions);
                  }}
                />
              </Space>
            ))}
            <Button
              type="dashed"
              block
              icon={<PlusOutlined />}
              onClick={() => {
                updateProps('options', [...options, { label: '', value: '' }]);
              }}
            >
              {t('Add')}
            </Button>
          </Space>
        </FormItem>
      </>
    );
  }

  // CheckboxGroupFieldModel 和 RadioGroupFieldModel 的配置
  if (fieldModel === 'CheckboxGroupFieldModel' || fieldModel === 'RadioGroupFieldModel') {
    const options = propsValue.options || [];
    return (
      <FormItem label={t('Options')}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          {options.map((option: any, index: number) => (
            <Space key={`${option.value}-${index}`} style={{ width: '100%' }} size={8} wrap align="start">
              <Input
                style={{ flex: 1, minWidth: 120 }}
                placeholder={t('Option label')}
                value={option.label}
                onChange={(e) => {
                  const newOptions = [...options];
                  newOptions[index] = { ...option, label: e.target.value };
                  updateProps('options', newOptions);
                }}
              />
              <Input
                style={{ flex: 1, minWidth: 120 }}
                placeholder={t('Option value')}
                value={option.value}
                onChange={(e) => {
                  const newOptions = [...options];
                  newOptions[index] = { ...option, value: e.target.value };
                  updateProps('options', newOptions);
                }}
              />
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={() => {
                  const newOptions = options.filter((_: any, i: number) => i !== index);
                  updateProps('options', newOptions);
                }}
              />
            </Space>
          ))}
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={() => {
              updateProps('options', [...options, { label: '', value: '' }]);
            }}
          >
            {t('Add')}
          </Button>
        </Space>
      </FormItem>
    );
  }

  return null;
};
