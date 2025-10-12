/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FilterFormCustomItemModel } from '../FilterFormCustomItemModel';
import { escapeT } from '@nocobase/flow-engine';
import { useField } from '@formily/react';
import { FormItem } from '@formily/antd-v5';
import { Input, Radio, Checkbox, Space, Button } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

// 字段组件属性配置组件
const FieldComponentProps: React.FC<{ fieldModel: string }> = ({ fieldModel }) => {
  const field = useField<any>();
  const { t } = useTranslation();
  const propsValue = field.value || {};

  const updateProps = (key: string, value: any) => {
    field.setValue({ ...propsValue, [key]: value });
  };

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
          <Space direction="vertical" style={{ width: '100%' }}>
            {options.map((option: any, index: number) => (
              <Space key={index} style={{ width: '100%' }}>
                <Input
                  placeholder={t('Option label')}
                  value={option.label}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[index] = { ...option, label: e.target.value };
                    updateProps('options', newOptions);
                  }}
                />
                <Input
                  placeholder={t('Option value')}
                  value={option.value}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[index] = { ...option, value: e.target.value };
                    updateProps('options', newOptions);
                  }}
                />
                <Button
                  icon={<CloseOutlined />}
                  onClick={() => {
                    const newOptions = options.filter((_: any, i: number) => i !== index);
                    updateProps('options', newOptions);
                  }}
                />
              </Space>
            ))}
            <Button
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
        <Space direction="vertical" style={{ width: '100%' }}>
          {options.map((option: any, index: number) => (
            <Space key={`${option.value}-${index}`} style={{ width: '100%' }}>
              <Input
                placeholder={t('Option label')}
                value={option.label}
                onChange={(e) => {
                  const newOptions = [...options];
                  newOptions[index] = { ...option, label: e.target.value };
                  updateProps('options', newOptions);
                }}
              />
              <Input
                placeholder={t('Option value')}
                value={option.value}
                onChange={(e) => {
                  const newOptions = [...options];
                  newOptions[index] = { ...option, value: e.target.value };
                  updateProps('options', newOptions);
                }}
              />
              <Button
                icon={<CloseOutlined />}
                onClick={() => {
                  const newOptions = options.filter((_: any, i: number) => i !== index);
                  updateProps('options', newOptions);
                }}
              />
            </Space>
          ))}
          <Button
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

export class FilterFormCustomFieldModel extends FilterFormCustomItemModel {
  render() {
    return <div>123</div>;
  }
}

FilterFormCustomFieldModel.define({
  label: '{{t("Custom field")}}',
  sort: 1,
});

FilterFormCustomFieldModel.registerFlow({
  key: 'formItemSettings',
  title: escapeT('Form item settings'),
  steps: {
    fieldSettings: {
      preset: true,
      title: escapeT('Field Settings'),
      uiSchema: {
        title: {
          type: 'string',
          title: escapeT('Field title'),
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          required: true,
        },
        source: {
          type: 'string',
          title: escapeT('Field source'),
          'x-decorator': 'FormItem',
          'x-component': 'Cascader',
          'x-component-props': {
            placeholder: escapeT('Select a source field to use metadata of the field'),
          },
          description: escapeT('Select a source field to use metadata of the field'),
        },
        fieldModel: {
          type: 'string',
          title: escapeT('Field model'),
          'x-component': 'Select',
          'x-decorator': 'FormItem',
          required: true,
          enum: [
            { label: escapeT('Input'), value: 'InputFieldModel' },
            { label: escapeT('Number'), value: 'NumberFieldModel' },
            { label: escapeT('Date'), value: 'DateTimeFilterFieldModel' },
            { label: escapeT('Select'), value: 'SelectFieldModel' },
            { label: escapeT('Radio group'), value: 'RadioGroupFieldModel' },
            { label: escapeT('Checkbox group'), value: 'CheckboxGroupFieldModel' },
            { label: escapeT('Record select'), value: 'RecordSelectFieldModel' },
          ],
          'x-component-props': {
            placeholder: escapeT('Please select'),
          },
        },
        props: {
          type: 'object',
          title: escapeT('Component properties'),
          'x-component': FieldComponentProps,
          'x-reactions': [
            {
              dependencies: ['fieldModel'],
              fulfill: {
                state: {
                  componentProps: {
                    fieldModel: '{{$deps[0]}}',
                  },
                },
              },
            },
          ],
        },
      },
      handler(ctx, params) {},
    },
  },
});
