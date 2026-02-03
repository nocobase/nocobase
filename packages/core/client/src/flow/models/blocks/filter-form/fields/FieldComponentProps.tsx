/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo } from 'react';
import { useField } from '@formily/react';
import { FormItem } from '@formily/antd-v5';
import { Input, Radio, Checkbox, Space, Button, Select } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { FilterableItemModel, useFlowContext, useFlowEngine } from '@nocobase/flow-engine';

import { isTitleField } from '../../../../../data-source';

const RECORD_SELECT_DATA_SOURCE_KEY = 'recordSelectDataSourceKey';
const RECORD_SELECT_COLLECTION_KEY = 'recordSelectTargetCollection';
const RECORD_SELECT_TITLE_FIELD_KEY = 'recordSelectTitleField';

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
  const appDataSourceManager = ctx?.app?.dataSourceManager;

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

    const nextValue = { ...props, ...fieldProps, ...propsValue };

    if (fieldModel === 'RecordSelectFieldModel' && collectionField?.targetCollection) {
      nextValue[RECORD_SELECT_DATA_SOURCE_KEY] = collectionField.dataSourceKey;
      nextValue[RECORD_SELECT_COLLECTION_KEY] = collectionField.target;
      nextValue[RECORD_SELECT_TITLE_FIELD_KEY] =
        collectionField.targetCollectionTitleFieldName ||
        collectionField.targetCollection?.titleCollectionField?.name ||
        nextValue[RECORD_SELECT_TITLE_FIELD_KEY];
    }

    field.setValue(nextValue);
  }, [fieldModel, source.join('.')]);

  const dataSources = useMemo(() => flowEngine?.dataSourceManager?.getDataSources?.() ?? [], [flowEngine]);
  const dataSourceOptions = useMemo(
    () =>
      dataSources.map((dataSource) => ({
        label: dataSource.displayName ?? dataSource.key,
        value: dataSource.key,
      })),
    [dataSources],
  );
  const activeDataSourceKey = propsValue?.[RECORD_SELECT_DATA_SOURCE_KEY] || dataSources[0]?.key || 'main';
  const activeDataSource = activeDataSourceKey
    ? flowEngine?.dataSourceManager?.getDataSource?.(activeDataSourceKey)
    : undefined;
  const activeCollectionName = propsValue?.[RECORD_SELECT_COLLECTION_KEY];
  const activeCollection = activeCollectionName ? activeDataSource?.getCollection?.(activeCollectionName) : undefined;
  const collectionOptions = useMemo(() => {
    if (!activeDataSource?.getCollections) return [];
    return activeDataSource
      .getCollections()
      .filter((item) => !item.options?.hidden)
      .map((item) => ({
        label: item.title || item.name,
        value: item.name,
      }));
  }, [activeDataSource]);
  const titleFieldOptions = useMemo(() => {
    if (!activeCollection?.getFields) return [];
    const shouldKeep = (fieldItem: any) =>
      appDataSourceManager ? isTitleField(appDataSourceManager, fieldItem.options) : true;
    return (activeCollection.getFields() || [])
      .filter((fieldItem: any) => shouldKeep(fieldItem))
      .map((fieldItem: any) => ({
        label: fieldItem.options?.uiSchema?.title || fieldItem.title || fieldItem.name,
        value: fieldItem.name,
      }));
  }, [activeCollection, appDataSourceManager]);

  useEffect(() => {
    if (fieldModel !== 'RecordSelectFieldModel') return;
    if (!activeCollectionName || propsValue?.[RECORD_SELECT_TITLE_FIELD_KEY]) return;
    const defaultTitleField = activeCollection?.titleCollectionField?.name;
    if (!defaultTitleField) return;
    field.setValue({
      ...propsValue,
      [RECORD_SELECT_TITLE_FIELD_KEY]: defaultTitleField,
    });
  }, [fieldModel, activeCollectionName, activeCollection, propsValue]);

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

  if (fieldModel === 'RecordSelectFieldModel') {
    return (
      <>
        {dataSourceOptions.length > 1 && (
          <FormItem label={t('Data source')}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={t('Please select')}
              value={activeDataSourceKey}
              options={dataSourceOptions}
              onChange={(value) => {
                field.setValue({
                  ...propsValue,
                  [RECORD_SELECT_DATA_SOURCE_KEY]: value,
                  [RECORD_SELECT_COLLECTION_KEY]: undefined,
                  [RECORD_SELECT_TITLE_FIELD_KEY]: undefined,
                });
              }}
            />
          </FormItem>
        )}
        <FormItem label={t('Target collection')}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={t('Select collection')}
            value={activeCollectionName}
            options={collectionOptions}
            onChange={(value) => {
              field.setValue({
                ...propsValue,
                [RECORD_SELECT_COLLECTION_KEY]: value,
                [RECORD_SELECT_TITLE_FIELD_KEY]: undefined,
              });
            }}
          />
        </FormItem>
        <FormItem label={t('Title field')}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={t('Please select')}
            value={propsValue?.[RECORD_SELECT_TITLE_FIELD_KEY]}
            options={titleFieldOptions}
            onChange={(value) => updateProps(RECORD_SELECT_TITLE_FIELD_KEY, value)}
          />
        </FormItem>
      </>
    );
  }

  return null;
};
