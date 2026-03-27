/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { createCollectionContextMeta, observer, useFlowSettingsContext } from '@nocobase/flow-engine';
import { Form, Space, Cascader, Select, Input, Checkbox, Button, InputNumber } from 'antd';
import { DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined, PlusOutlined } from '@ant-design/icons';
import { useT } from '../../locale';
import { FilterGroup, VariableFilterItem, useCompile, useDataSourceManager } from '@nocobase/client';
import { useForm as useFormilyForm } from '@formily/react';
import {
  getFieldOptions,
  getCollectionOptions,
  getFormatterOptionsByField,
  buildOrderFieldOptions,
  validateQuery,
} from './QueryBuilder.service';
import { appendColon } from '../utils';

export type QueryBuilderRef = {
  validate: () => Promise<any>;
};

type QueryValue = {
  collectionPath?: string[];
  measures?: any[];
  dimensions?: any[];
  filter?: { logic: '$and' | '$or'; items: any[] };
  orders?: any[];
  limit?: number;
  offset?: number;
};

const EMPTY_FILTER = {
  logic: '$and' as const,
  items: [],
};

const QueryFilter: React.FC<{
  value?: QueryValue['filter'];
  onChange?: (value: QueryValue['filter']) => void;
  collectionPath?: string[];
}> = observer(({ value, onChange, collectionPath }) => {
  const ctx = useFlowSettingsContext<any>();
  const model = ctx.model;

  React.useEffect(() => {
    const [dataSourceKey, collectionName] = collectionPath || [];
    if (dataSourceKey && collectionName && model) {
      const collection = model?.context?.dataSourceManager?.getCollection(dataSourceKey, collectionName);
      if (collection) {
        model.context.defineProperty('collection', {
          get: () => collection,
          meta: createCollectionContextMeta(() => collection, ctx.t('Current collection')),
        });
      }
    }
  }, [collectionPath, ctx, model]);

  return (
    <FilterGroup
      value={value || { logic: '$and', items: [] }}
      onChange={onChange}
      FilterItem={(props) => <VariableFilterItem {...props} model={model} rightAsVariable />}
    />
  );
});

function ensureQueryShape(query?: QueryValue): Required<QueryValue> {
  return {
    collectionPath: query?.collectionPath || [],
    measures: query?.measures || [],
    dimensions: query?.dimensions || [],
    filter: query?.filter || EMPTY_FILTER,
    orders: query?.orders || [],
    limit: query?.limit as any,
    offset: query?.offset as any,
  };
}

const QueryBuilderInner: React.FC<{
  forwardedRef: React.ForwardedRef<QueryBuilderRef>;
}> = observer(({ forwardedRef }) => {
  const t = useT();
  const stepForm = useFormilyForm();
  const [form] = Form.useForm();
  const ctx = useFlowSettingsContext<any>();
  const lang = ctx?.i18n?.language;
  const dm = useDataSourceManager();
  const compile = useCompile();

  const query = ensureQueryShape(stepForm.values?.query);
  const collectionPath = query.collectionPath;
  const measuresValue = query.measures;
  const dimensionsValue = query.dimensions;

  React.useEffect(() => {
    form.setFieldsValue(query);
  }, [form, query]);

  React.useImperativeHandle(
    forwardedRef,
    () => ({
      validate: async () => {
        const candidate = { ...(stepForm.values?.query || {}), mode: 'builder' };
        const { success, message } = validateQuery(candidate);
        if (!success) {
          throw new Error(message);
        }
      },
    }),
    [stepForm],
  );

  const collectionOptions = React.useMemo(() => getCollectionOptions(dm, compile), [dm, compile]);
  const fieldOptions = React.useMemo(() => getFieldOptions(dm, compile, collectionPath), [dm, compile, collectionPath]);
  const orderFieldOptions = React.useMemo(
    () => buildOrderFieldOptions(fieldOptions, dimensionsValue, measuresValue),
    [dimensionsValue, measuresValue, fieldOptions],
  );

  const setQueryValue = React.useCallback(
    (key: keyof QueryValue, value: any) => {
      stepForm.setValuesIn?.(`query.${key}`, value);
    },
    [stepForm],
  );

  const syncQuery = React.useCallback(
    (patch: Partial<QueryValue>) => {
      stepForm.setValuesIn?.('query', {
        ...(stepForm.values?.query || {}),
        ...patch,
      });
    },
    [stepForm],
  );

  const moveItem = React.useCallback(
    (key: 'measures' | 'dimensions' | 'orders', index: number, dir: -1 | 1) => {
      const arr = [...((form.getFieldValue(key) as any[]) || [])];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return;
      const [item] = arr.splice(index, 1);
      arr.splice(target, 0, item);
      form.setFieldValue(key, arr);
      syncQuery({ [key]: arr });
    },
    [form, syncQuery],
  );

  const handleCollectionChange = React.useCallback(
    (val: any) => {
      const nextQuery = {
        ...(stepForm.values?.query || {}),
        collectionPath: val,
        measures: [],
        dimensions: [],
        orders: [],
        filter: { logic: '$and', items: [] },
      };
      form.setFieldsValue(nextQuery);
      stepForm.setValuesIn?.('query', nextQuery);
    },
    [form, stepForm],
  );

  const handleValuesChange = React.useCallback(
    (_: any, allValues: QueryValue) => {
      syncQuery(allValues);
    },
    [syncQuery],
  );

  return (
    <Form form={form} layout="vertical" component={false} initialValues={query} onValuesChange={handleValuesChange}>
      <div style={{ paddingTop: 8 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>{appendColon(t('Collection'), lang)}</div>
          <Cascader
            showSearch
            placeholder={t('Collection')}
            options={collectionOptions}
            value={collectionPath}
            onChange={handleCollectionChange}
            style={{ width: 222 }}
          />
        </div>

        <div style={{ fontWeight: 500, marginBottom: 8 }}>{appendColon(t('Measures'), lang)}</div>
        <div style={{ marginBottom: 16 }}>
          <Form.List name="measures">
            {(fields, { add, remove }) => (
              <>
                <div style={{ overflow: 'auto' }}>
                  {fields.map((field, idx) => (
                    <Space align="center" size={[8, 4]} wrap={false} style={{ marginBottom: 8 }} key={field.key}>
                      <Form.Item name={[field.name, 'field']} style={{ marginBottom: 0 }}>
                        <Cascader
                          style={{ minWidth: 114 }}
                          placeholder={t('Select Field')}
                          fieldNames={{ label: 'title', value: 'name', children: 'children' }}
                          options={fieldOptions}
                        />
                      </Form.Item>
                      <Form.Item name={[field.name, 'aggregation']} style={{ marginBottom: 0 }}>
                        <Select
                          style={{ minWidth: 75 }}
                          placeholder={t('Aggregation')}
                          options={[
                            { label: t('Sum'), value: 'sum' },
                            { label: t('Count'), value: 'count' },
                            { label: t('Avg'), value: 'avg' },
                            { label: t('Max'), value: 'max' },
                            { label: t('Min'), value: 'min' },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item name={[field.name, 'alias']} style={{ marginBottom: 0 }}>
                        <Input style={{ minWidth: 75 }} placeholder={t('Alias')} />
                      </Form.Item>
                      <Form.Item name={[field.name, 'distinct']} valuePropName="checked" style={{ marginBottom: 0 }}>
                        <Checkbox style={{ minWidth: 60 }}>{t('Distinct')}</Checkbox>
                      </Form.Item>
                      <Button size="small" type="text" onClick={() => remove(field.name)} icon={<DeleteOutlined />} />
                      {fields.length > 1 && (
                        <>
                          <Button
                            size="small"
                            type="text"
                            disabled={idx === 0}
                            onClick={() => moveItem('measures', idx, -1)}
                            icon={<ArrowUpOutlined />}
                          />
                          <Button
                            size="small"
                            type="text"
                            disabled={idx === fields.length - 1}
                            onClick={() => moveItem('measures', idx, 1)}
                            icon={<ArrowDownOutlined />}
                          />
                        </>
                      )}
                    </Space>
                  ))}
                </div>
                <Button
                  type="link"
                  icon={<PlusOutlined />}
                  onClick={() => add({})}
                  style={{ marginTop: -8, padding: 0 }}
                >
                  {t('Add field')}
                </Button>
              </>
            )}
          </Form.List>
        </div>

        <div style={{ fontWeight: 500, marginBottom: 8 }}>{appendColon(t('Dimensions'), lang)}</div>
        <div style={{ marginBottom: 16 }}>
          <Form.List name="dimensions">
            {(fields, { add, remove }) => (
              <>
                <div style={{ overflow: 'auto' }}>
                  {fields.map((field, idx) => {
                    const dimField = form.getFieldValue(['dimensions', field.name, 'field']);
                    const fmtOptions = getFormatterOptionsByField(dm, collectionPath, dimField);
                    return (
                      <Space align="center" size={[8, 4]} wrap={false} style={{ marginBottom: 8 }} key={field.key}>
                        <Form.Item name={[field.name, 'field']} style={{ marginBottom: 0 }}>
                          <Cascader
                            style={{ minWidth: 114 }}
                            placeholder={t('Select Field')}
                            fieldNames={{ label: 'title', value: 'name', children: 'children' }}
                            options={fieldOptions}
                          />
                        </Form.Item>
                        {fmtOptions?.length ? (
                          <Form.Item name={[field.name, 'format']} style={{ marginBottom: 0 }}>
                            <Select
                              placeholder={t('Format')}
                              popupMatchSelectWidth={false}
                              options={fmtOptions.map((o: any) => ({ label: o.label, value: o.value }))}
                            />
                          </Form.Item>
                        ) : null}
                        <Form.Item name={[field.name, 'alias']} style={{ marginBottom: 0 }}>
                          <Input style={{ minWidth: 75 }} placeholder={t('Alias')} />
                        </Form.Item>
                        <Button size="small" type="text" onClick={() => remove(field.name)} icon={<DeleteOutlined />} />
                        <Button
                          size="small"
                          type="text"
                          disabled={idx === 0}
                          onClick={() => moveItem('dimensions', idx, -1)}
                          icon={<ArrowUpOutlined />}
                        />
                        <Button
                          size="small"
                          type="text"
                          disabled={idx === fields.length - 1}
                          onClick={() => moveItem('dimensions', idx, 1)}
                          icon={<ArrowDownOutlined />}
                        />
                      </Space>
                    );
                  })}
                </div>
                <Button
                  type="link"
                  icon={<PlusOutlined />}
                  onClick={() => add({})}
                  style={{ marginTop: -8, padding: 0 }}
                >
                  {t('Add field')}
                </Button>
              </>
            )}
          </Form.List>
        </div>

        <div style={{ fontWeight: 500, marginBottom: 8 }}>{appendColon(t('Filter'), lang)}</div>
        <div style={{ marginBottom: 16, overflow: 'auto' }}>
          <QueryFilter
            value={query.filter}
            onChange={(value) => setQueryValue('filter', value)}
            collectionPath={collectionPath}
          />
        </div>

        <div style={{ fontWeight: 500, marginBottom: 4 }}>{appendColon(t('Sort'), lang)}</div>
        <div style={{ marginBottom: 16 }}>
          <Form.List name="orders">
            {(fields, { add, remove }) => (
              <>
                <div style={{ overflow: 'auto' }}>
                  {fields.map((field, idx) => (
                    <Space wrap align="center" size={[8, 4]} style={{ marginBottom: 8 }} key={field.key}>
                      <Form.Item name={[field.name, 'field']} style={{ marginBottom: 0 }}>
                        <Cascader
                          placeholder={t('Select Field')}
                          fieldNames={{ label: 'title', value: 'name', children: 'children' }}
                          options={orderFieldOptions}
                          style={{ minWidth: 114 }}
                        />
                      </Form.Item>
                      <Form.Item name={[field.name, 'order']} style={{ marginBottom: 0 }}>
                        <Select
                          style={{ minWidth: 100 }}
                          options={[
                            { label: 'ASC', value: 'ASC' },
                            { label: 'DESC', value: 'DESC' },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item name={[field.name, 'nulls']} style={{ marginBottom: 0 }}>
                        <Select
                          style={{ minWidth: 110 }}
                          options={[
                            { label: t('Default'), value: 'default' },
                            { label: t('NULLS first'), value: 'first' },
                            { label: t('NULLS last'), value: 'last' },
                          ]}
                        />
                      </Form.Item>
                      <Button size="small" type="text" onClick={() => remove(field.name)} icon={<DeleteOutlined />} />
                      <Button
                        size="small"
                        type="text"
                        disabled={idx === 0}
                        onClick={() => moveItem('orders', idx, -1)}
                        icon={<ArrowUpOutlined />}
                      />
                      <Button
                        size="small"
                        type="text"
                        disabled={idx === fields.length - 1}
                        onClick={() => moveItem('orders', idx, 1)}
                        icon={<ArrowDownOutlined />}
                      />
                    </Space>
                  ))}
                </div>
                <Button
                  type="link"
                  icon={<PlusOutlined />}
                  onClick={() => add({})}
                  style={{ marginTop: -8, padding: 0 }}
                >
                  {t('Add field')}
                </Button>
              </>
            )}
          </Form.List>
        </div>

        <Form.Item name="limit" label={<span style={{ fontWeight: 500 }}>{appendColon(t('Limit'), lang)}</span>}>
          <InputNumber min={0} style={{ width: 120 }} />
        </Form.Item>

        <Form.Item name="offset" label={<span style={{ fontWeight: 500 }}>{appendColon(t('Offset'), lang)}</span>}>
          <InputNumber min={0} style={{ width: 120 }} />
        </Form.Item>
      </div>
    </Form>
  );
});

export const QueryBuilder = React.forwardRef<QueryBuilderRef>((_props, ref) => {
  return <QueryBuilderInner forwardedRef={ref} />;
});
