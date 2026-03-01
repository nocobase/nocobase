/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useCallback } from 'react';
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
const RECORD_SELECT_VALUE_FIELD_KEY = 'recordSelectValueField';
const RECORD_SELECT_ALLOW_MULTIPLE_KEY = 'allowMultiple';
const RECORD_SELECT_MULTIPLE_KEY = 'multiple';
const RECORD_SELECT_VALUE_MODE_KEY = 'valueMode';
const RELATION_FIELD_TYPES = new Set(['belongsTo', 'belongsToMany', 'hasOne', 'hasMany', 'belongsToArray']);

// 字段组件属性配置组件
export const FieldComponentProps: React.FC<{ fieldModel: string; source: string[] }> = ({
  fieldModel,
  source = [],
}) => {
  const field = useField<any>();
  const { t } = useTranslation();
  const propsValue = field.value || {};
  const resolvedFieldModel = fieldModel || propsValue?.fieldModel;
  const flowEngine = useFlowEngine();
  const ctx = useFlowContext();
  const appDataSourceManager = ctx?.app?.dataSourceManager;

  const getCurrentValue = () => field.value || {};
  const updateProps = (key: string, value: any) => {
    field.setValue({ ...getCurrentValue(), [key]: value });
  };
  const applyFieldValue = (value: any) => {
    if (field?.form?.setValuesIn && field?.path) {
      field.form.setValuesIn(field.path, value);
      return;
    }
    field.setValue(value);
  };
  const getSubFieldMessages = (subFieldKey: string) => {
    const subFieldPath = `${field.path.toString()}.${subFieldKey}`;
    const subField = field.form?.query?.(subFieldPath)?.take?.() as any;
    const errors = Array.isArray(subField?.errors) ? subField.errors : [];
    return errors
      .flatMap((item: any) => {
        if (!item) return [];
        if (Array.isArray(item.messages)) return item.messages;
        if (item.messages) return [item.messages];
        return [];
      })
      .filter(Boolean);
  };
  const getSubFieldFeedbackProps = (subFieldKey: string) => {
    const messages = getSubFieldMessages(subFieldKey);
    if (!messages.length) return {};
    return {
      feedbackStatus: 'error' as const,
      feedbackText: messages.join(', '),
    };
  };

  useEffect(() => {
    const sourceValue = source.length ? source : propsValue?.source || [];
    if (!sourceValue.length) return undefined;
    const hasDataSourceKey = !!flowEngine?.dataSourceManager?.getDataSource?.(sourceValue[0]);
    const dataSources = flowEngine?.dataSourceManager?.getDataSources?.() ?? [];
    const resolvedDataSourceKey =
      (hasDataSourceKey ? sourceValue[0] : undefined) ||
      propsValue?.[RECORD_SELECT_DATA_SOURCE_KEY] ||
      dataSources[0]?.key ||
      'main';
    const fieldPath = (hasDataSourceKey ? sourceValue.slice(1) : sourceValue).join('.');
    const collectionField = flowEngine.dataSourceManager.getCollectionField(`${resolvedDataSourceKey}.${fieldPath}`);
    const binding = FilterableItemModel.getDefaultBindingByField(ctx.model.context, collectionField);
    if (!collectionField && resolvedFieldModel !== 'FilterFormCustomRecordSelectFieldModel') {
      return;
    }
    if (!binding && resolvedFieldModel !== 'FilterFormCustomRecordSelectFieldModel') {
      return;
    }

    const fieldProps = collectionField?.getComponentProps?.() || {};

    const props =
      binding && typeof binding.defaultProps === 'function'
        ? binding.defaultProps(ctx.model.context, field)
        : binding?.defaultProps;

    const nextValue = { ...(props || {}), ...fieldProps, ...getCurrentValue() };

    const shouldFillRecordSelect =
      resolvedFieldModel === 'FilterFormCustomRecordSelectFieldModel' ||
      (!resolvedFieldModel && collectionField?.target);
    if (shouldFillRecordSelect && collectionField?.target) {
      const targetCollection =
        collectionField.targetCollection ||
        flowEngine.dataSourceManager.getCollection(collectionField.dataSourceKey, collectionField.target);
      nextValue[RECORD_SELECT_DATA_SOURCE_KEY] = collectionField.dataSourceKey || resolvedDataSourceKey;
      nextValue[RECORD_SELECT_COLLECTION_KEY] = collectionField.target;
      nextValue[RECORD_SELECT_TITLE_FIELD_KEY] =
        collectionField.targetCollectionTitleFieldName ||
        targetCollection?.titleCollectionField?.name ||
        nextValue[RECORD_SELECT_TITLE_FIELD_KEY];
      nextValue[RECORD_SELECT_VALUE_FIELD_KEY] =
        nextValue[RECORD_SELECT_VALUE_FIELD_KEY] || targetCollection?.filterTargetKey || 'id';
      if (
        nextValue[RECORD_SELECT_ALLOW_MULTIPLE_KEY] === undefined &&
        nextValue[RECORD_SELECT_MULTIPLE_KEY] === undefined
      ) {
        nextValue[RECORD_SELECT_ALLOW_MULTIPLE_KEY] = true;
        nextValue[RECORD_SELECT_MULTIPLE_KEY] = true;
      }
      if (!nextValue[RECORD_SELECT_VALUE_MODE_KEY]) {
        nextValue[RECORD_SELECT_VALUE_MODE_KEY] = 'value';
      }
    }

    applyFieldValue(nextValue);
  }, [fieldModel, resolvedFieldModel, source.join('.'), propsValue?.source, flowEngine]);

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
  const translateLabel = useCallback(
    (rawLabel: any) => {
      if (!rawLabel) return rawLabel;
      if (ctx?.t) return ctx.t(rawLabel);
      return t(rawLabel);
    },
    [ctx, t],
  );
  const collectionOptions = useMemo(() => {
    if (!activeDataSource?.getCollections) return [];
    return activeDataSource
      .getCollections()
      .filter((item) => !item.options?.hidden)
      .map((item) => ({
        label: translateLabel(item.title) || item.name,
        value: item.name,
      }));
  }, [activeDataSource, translateLabel]);
  const titleFieldOptions = useMemo(() => {
    if (!activeCollection?.getFields) return [];
    const shouldKeep = (fieldItem: any) =>
      appDataSourceManager ? isTitleField(appDataSourceManager, fieldItem.options) : true;
    return (activeCollection.getFields() || [])
      .filter((fieldItem: any) => shouldKeep(fieldItem))
      .map((fieldItem: any) => ({
        label: translateLabel(fieldItem.options?.uiSchema?.title) || translateLabel(fieldItem.title) || fieldItem.name,
        value: fieldItem.name,
      }));
  }, [activeCollection, appDataSourceManager, translateLabel]);
  const valueFieldOptions = useMemo(() => {
    if (!activeCollection?.getFields) return [];
    const shouldKeep = (fieldItem: any) => {
      const fieldOptions = fieldItem?.options || {};
      const interfaceName = fieldOptions.interface || fieldItem?.interface;
      if (fieldOptions.filterable === false || !interfaceName) {
        return false;
      }
      if (appDataSourceManager) {
        const fieldInterface = appDataSourceManager.collectionFieldInterfaceManager?.getFieldInterface?.(interfaceName);
        if (!fieldInterface?.filterable) {
          return false;
        }
      }
      const relationType = fieldOptions.type || fieldItem?.type;
      return !RELATION_FIELD_TYPES.has(relationType);
    };
    return (activeCollection.getFields() || [])
      .filter((fieldItem: any) => shouldKeep(fieldItem))
      .map((fieldItem: any) => ({
        label: translateLabel(fieldItem.options?.uiSchema?.title) || translateLabel(fieldItem.title) || fieldItem.name,
        value: fieldItem.name,
      }));
  }, [activeCollection, appDataSourceManager, translateLabel]);

  useEffect(() => {
    if (resolvedFieldModel !== 'FilterFormCustomRecordSelectFieldModel') return;
    if (!activeCollectionName || propsValue?.[RECORD_SELECT_TITLE_FIELD_KEY]) return;
    const defaultTitleField = activeCollection?.titleCollectionField?.name;
    if (!defaultTitleField) return;
    field.setValue({
      ...getCurrentValue(),
      [RECORD_SELECT_TITLE_FIELD_KEY]: defaultTitleField,
    });
  }, [fieldModel, resolvedFieldModel, activeCollectionName, activeCollection, propsValue]);
  useEffect(() => {
    if (resolvedFieldModel !== 'FilterFormCustomRecordSelectFieldModel') return;
    if (!activeCollectionName) return;
    const currentValueField = propsValue?.[RECORD_SELECT_VALUE_FIELD_KEY];
    const availableValueFields = valueFieldOptions.map((item) => item.value);
    if (currentValueField && availableValueFields.includes(currentValueField)) return;
    const preferredValueField = activeCollection?.filterTargetKey;
    const defaultValueField =
      (preferredValueField && availableValueFields.includes(preferredValueField) && preferredValueField) ||
      availableValueFields[0];
    if (!defaultValueField) return;
    field.setValue({
      ...getCurrentValue(),
      [RECORD_SELECT_VALUE_FIELD_KEY]: defaultValueField,
    });
  }, [fieldModel, resolvedFieldModel, activeCollectionName, activeCollection, propsValue, valueFieldOptions]);

  useEffect(() => {
    if (resolvedFieldModel !== 'FilterFormCustomRecordSelectFieldModel') return;
    if (
      propsValue?.[RECORD_SELECT_ALLOW_MULTIPLE_KEY] !== undefined ||
      propsValue?.[RECORD_SELECT_MULTIPLE_KEY] !== undefined
    ) {
      return;
    }
    field.setValue({
      ...getCurrentValue(),
      [RECORD_SELECT_ALLOW_MULTIPLE_KEY]: true,
      [RECORD_SELECT_MULTIPLE_KEY]: true,
    });
  }, [fieldModel, resolvedFieldModel, propsValue]);

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

  if (resolvedFieldModel === 'FilterFormCustomRecordSelectFieldModel') {
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
        <FormItem label={t('Target collection')} asterisk {...getSubFieldFeedbackProps(RECORD_SELECT_COLLECTION_KEY)}>
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
        <FormItem label={t('Title field')} asterisk {...getSubFieldFeedbackProps(RECORD_SELECT_TITLE_FIELD_KEY)}>
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
        <div style={{ color: 'var(--colorTextDescription)', marginTop: -8, marginBottom: 8 }}>
          {t('Used for display in the dropdown and selected tags.')}
        </div>
        <FormItem label={t('Value field')} asterisk {...getSubFieldFeedbackProps(RECORD_SELECT_VALUE_FIELD_KEY)}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={t('Please select')}
            value={propsValue?.[RECORD_SELECT_VALUE_FIELD_KEY]}
            options={valueFieldOptions}
            onChange={(value) => updateProps(RECORD_SELECT_VALUE_FIELD_KEY, value)}
          />
        </FormItem>
        <div style={{ color: 'var(--colorTextDescription)', marginTop: -8, marginBottom: 8 }}>
          {t('Stored as the field value for filtering (usually the primary key).')}
        </div>
        <FormItem label={t('Multiple')}>
          <Checkbox
            checked={propsValue?.[RECORD_SELECT_ALLOW_MULTIPLE_KEY] !== false}
            onChange={(e) => {
              const checked = e.target.checked;
              field.setValue({
                ...propsValue,
                [RECORD_SELECT_ALLOW_MULTIPLE_KEY]: checked,
                [RECORD_SELECT_MULTIPLE_KEY]: checked,
              });
            }}
          >
            {t('Allow multiple selection')}
          </Checkbox>
        </FormItem>
      </>
    );
  }

  return null;
};
