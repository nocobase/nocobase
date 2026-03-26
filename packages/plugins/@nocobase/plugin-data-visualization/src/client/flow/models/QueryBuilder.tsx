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
import { Space, Cascader, Select, Input, Checkbox, Button, InputNumber } from 'antd';
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
  const ctx = useFlowSettingsContext<any>();
  const lang = ctx?.i18n?.language;
  const dm = useDataSourceManager();
  const compile = useCompile();

  const query = ensureQueryShape(stepForm.values?.query);
  const collectionPath = query.collectionPath;
  const measuresValue = query.measures;
  const dimensionsValue = query.dimensions;

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

  const moveItem = React.useCallback(
    (key: 'measures' | 'dimensions' | 'orders', index: number, dir: -1 | 1) => {
      const arr = [...(ensureQueryShape(stepForm.values?.query)[key] || [])];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return;
      const [item] = arr.splice(index, 1);
      arr.splice(target, 0, item);
      setQueryValue(key, arr);
    },
    [setQueryValue, stepForm],
  );

  const updateListItem = React.useCallback(
    (key: 'measures' | 'dimensions' | 'orders', index: number, patch: Record<string, any>) => {
      const arr = [...(ensureQueryShape(stepForm.values?.query)[key] || [])];
      arr[index] = { ...(arr[index] || {}), ...patch };
      setQueryValue(key, arr);
    },
    [setQueryValue, stepForm],
  );

  const removeListItem = React.useCallback(
    (key: 'measures' | 'dimensions' | 'orders', index: number) => {
      const arr = [...(ensureQueryShape(stepForm.values?.query)[key] || [])];
      arr.splice(index, 1);
      setQueryValue(key, arr);
    },
    [setQueryValue, stepForm],
  );

  const addListItem = React.useCallback(
    (key: 'measures' | 'dimensions' | 'orders', initial: Record<string, any> = {}) => {
      const arr = [...(ensureQueryShape(stepForm.values?.query)[key] || [])];
      arr.push(initial);
      setQueryValue(key, arr);
    },
    [setQueryValue, stepForm],
  );

  const handleCollectionChange = React.useCallback(
    (val: any) => {
      stepForm.setValuesIn?.('query', {
        ...(stepForm.values?.query || {}),
        collectionPath: val,
        measures: [],
        dimensions: [],
        orders: [],
        filter: { logic: '$and', items: [] },
      });
    },
    [stepForm],
  );

  return (
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
        <div style={{ overflow: 'auto' }}>
          {measuresValue.map((item, idx) => (
            <Space align="center" size={[8, 4]} wrap={false} style={{ marginBottom: 8 }} key={`measure-${idx}`}>
              <Cascader
                style={{ minWidth: 114 }}
                placeholder={t('Select Field')}
                fieldNames={{ label: 'title', value: 'name', children: 'children' }}
                options={fieldOptions}
                value={item?.field}
                onChange={(value) => updateListItem('measures', idx, { field: value })}
              />
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
                value={item?.aggregation}
                onChange={(value) => updateListItem('measures', idx, { aggregation: value })}
              />
              <Input
                style={{ minWidth: 75 }}
                placeholder={t('Alias')}
                value={item?.alias}
                onChange={(e) => updateListItem('measures', idx, { alias: e.target.value })}
              />
              <Checkbox
                style={{ minWidth: 60 }}
                checked={!!item?.distinct}
                onChange={(e) => updateListItem('measures', idx, { distinct: e.target.checked })}
              >
                {t('Distinct')}
              </Checkbox>
              <Button
                size="small"
                type="text"
                onClick={() => removeListItem('measures', idx)}
                icon={<DeleteOutlined />}
              />
              {measuresValue.length > 1 && (
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
                    disabled={idx === measuresValue.length - 1}
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
          onClick={() => addListItem('measures')}
          style={{ marginTop: -8, padding: 0 }}
        >
          {t('Add field')}
        </Button>
      </div>

      <div style={{ fontWeight: 500, marginBottom: 8 }}>{appendColon(t('Dimensions'), lang)}</div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ overflow: 'auto' }}>
          {dimensionsValue.map((item, idx) => {
            const fmtOptions = getFormatterOptionsByField(dm, collectionPath, item?.field);
            return (
              <Space align="center" size={[8, 4]} wrap={false} style={{ marginBottom: 8 }} key={`dimension-${idx}`}>
                <Cascader
                  style={{ minWidth: 114 }}
                  placeholder={t('Select Field')}
                  fieldNames={{ label: 'title', value: 'name', children: 'children' }}
                  options={fieldOptions}
                  value={item?.field}
                  onChange={(value) => updateListItem('dimensions', idx, { field: value })}
                />
                {fmtOptions?.length ? (
                  <Select
                    placeholder={t('Format')}
                    popupMatchSelectWidth={false}
                    options={fmtOptions.map((o: any) => ({ label: o.label, value: o.value }))}
                    value={item?.format}
                    onChange={(value) => updateListItem('dimensions', idx, { format: value })}
                  />
                ) : null}
                <Input
                  style={{ minWidth: 75 }}
                  placeholder={t('Alias')}
                  value={item?.alias}
                  onChange={(e) => updateListItem('dimensions', idx, { alias: e.target.value })}
                />
                <Button
                  size="small"
                  type="text"
                  onClick={() => removeListItem('dimensions', idx)}
                  icon={<DeleteOutlined />}
                />
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
                  disabled={idx === dimensionsValue.length - 1}
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
          onClick={() => addListItem('dimensions')}
          style={{ marginTop: -8, padding: 0 }}
        >
          {t('Add field')}
        </Button>
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
        <div style={{ overflow: 'auto' }}>
          {query.orders.map((item, idx) => (
            <Space wrap align="center" size={[8, 4]} style={{ marginBottom: 8 }} key={`order-${idx}`}>
              <Cascader
                placeholder={t('Select Field')}
                fieldNames={{ label: 'title', value: 'name', children: 'children' }}
                options={orderFieldOptions}
                style={{ minWidth: 114 }}
                value={item?.field}
                onChange={(value) => updateListItem('orders', idx, { field: value })}
              />
              <Select
                style={{ minWidth: 100 }}
                options={[
                  { label: 'ASC', value: 'ASC' },
                  { label: 'DESC', value: 'DESC' },
                ]}
                value={item?.order || 'ASC'}
                onChange={(value) => updateListItem('orders', idx, { order: value })}
              />
              <Select
                style={{ minWidth: 110 }}
                options={[
                  { label: t('Default'), value: 'default' },
                  { label: t('NULLS first'), value: 'first' },
                  { label: t('NULLS last'), value: 'last' },
                ]}
                value={item?.nulls || 'default'}
                onChange={(value) => updateListItem('orders', idx, { nulls: value })}
              />
              <Button
                size="small"
                type="text"
                onClick={() => removeListItem('orders', idx)}
                icon={<DeleteOutlined />}
              />
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
                disabled={idx === query.orders.length - 1}
                onClick={() => moveItem('orders', idx, 1)}
                icon={<ArrowDownOutlined />}
              />
            </Space>
          ))}
        </div>
        <Button
          type="link"
          icon={<PlusOutlined />}
          onClick={() => addListItem('orders')}
          style={{ marginTop: -8, padding: 0 }}
        >
          {t('Add field')}
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>{appendColon(t('Limit'), lang)}</div>
        <InputNumber
          min={0}
          style={{ width: 120 }}
          value={query.limit}
          onChange={(value) => setQueryValue('limit', value)}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>{appendColon(t('Offset'), lang)}</div>
        <InputNumber
          min={0}
          style={{ width: 120 }}
          value={query.offset}
          onChange={(value) => setQueryValue('offset', value)}
        />
      </div>
    </div>
  );
});

export const QueryBuilder = React.forwardRef<QueryBuilderRef, Record<string, never>>((_props, ref) => {
  return <QueryBuilderInner forwardedRef={ref} />;
});
