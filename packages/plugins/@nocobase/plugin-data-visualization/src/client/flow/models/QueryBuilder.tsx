/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useFlowSettingsContext } from '@nocobase/flow-engine';
import { Form, Space, Cascader, Select, Input, Checkbox, Button, InputNumber } from 'antd';
import { DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined, PlusOutlined } from '@ant-design/icons';
import { useT } from '../../locale';
import { useDataSourceManager, useCompile } from '@nocobase/client';
import { getFieldOptions, getCollectionOptions, getFormatterOptionsByField } from './QueryBuilder.service';
import { appendColon, debugLog } from '../utils';
import AntdFilterSelector from '../components/AntdFilterSelector';

export type QueryBuilderRef = {
  validate: () => Promise<any>;
};

export const QueryBuilder = React.forwardRef<
  QueryBuilderRef,
  {
    initialValues?: any;
    onChange?: (v: any) => void;
  }
>(({ initialValues, onChange }, ref) => {
  const t = useT();
  const [form] = Form.useForm();
  const ctx = useFlowSettingsContext<any>();
  const lang = ctx?.i18n?.language;

  React.useImperativeHandle(ref, () => ({
    validate: () => form.validateFields(),
  }));

  // 从内表单读取 collectionPath，驱动字段树
  const collectionPath = Form.useWatch('collectionPath', form);

  // 构建集合选项（改为 service 纯函数）
  const dm = useDataSourceManager();
  const compile = useCompile();
  const collectionOptions = React.useMemo(() => getCollectionOptions(dm, compile), [dm, compile]);
  const fieldOptions = React.useMemo(() => getFieldOptions(dm, compile, collectionPath), [dm, compile, collectionPath]);

  // 切换集合后，清理依赖旧集合的字段配置
  const onCollectionChange = (val: any) => {
    form.setFieldsValue({
      collectionPath: val,
      measures: [],
      dimensions: [],
      orders: [],
      filter: undefined,
    });
    onChange?.(form.getFieldsValue(true));
  };

  const handleValuesChange = (_: any, allValues: any) => {
    debugLog('---handleValuesChange', allValues);
    onChange?.(allValues);
  };

  // 工具：数组上移/下移
  const moveItem = (name: string, index: number, dir: -1 | 1) => {
    const arr = form.getFieldValue(name) || [];
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    const next = arr.slice();
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    form.setFieldsValue({ [name]: next });
    onChange?.({ ...(form.getFieldsValue(true) || {}), [name]: next });
  };

  return (
    <div style={{ paddingTop: 8 }}>
      <Form form={form} layout="vertical" initialValues={initialValues} onValuesChange={handleValuesChange}>
        {/* 设置：数据源/集合 */}
        <Form.Item
          name="collectionPath"
          label={<span style={{ fontWeight: 500 }}>{appendColon(t('Collection'), lang)}</span>}
          rules={[{ required: true }]}
        >
          <Cascader
            showSearch
            placeholder={t('Collection')}
            options={collectionOptions}
            onChange={onCollectionChange}
            style={{ width: 222 }}
          />
        </Form.Item>

        {/* Measures */}
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

        {/* Dimensions 标题 */}
        <div style={{ fontWeight: 500, marginBottom: 8 }}>{appendColon(t('Dimensions'), lang)}</div>
        <div style={{ marginBottom: 16 }}>
          <Form.List name="dimensions">
            {(fields, { add, remove }) => (
              <>
                <div style={{ overflow: 'auto' }}>
                  {fields.map((field, idx) => {
                    const fieldName = field.name;
                    const dimField = form.getFieldValue(['dimensions', fieldName, 'field']);
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
                        {/* 仅当 fmtOptions 有值时展示 Format 选择项 */}
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

        {/* Filter 标题 */}
        <div style={{ fontWeight: 500, marginBottom: 8 }}>{appendColon(t('Filter'), lang)}</div>
        <div style={{ marginBottom: 16 }}>
          <Form.Item name="filter" style={{ overflow: 'auto' }}>
            <AntdFilterSelector model={ctx.model} rightAsVariable />
          </Form.Item>
        </div>

        {/* Sort */}
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
                          options={fieldOptions}
                          style={{ minWidth: 114 }}
                        />
                      </Form.Item>
                      <Form.Item name={[field.name, 'order']} style={{ marginBottom: 0 }}>
                        <Select
                          defaultValue="ASC"
                          style={{ minWidth: 100 }}
                          options={[
                            { label: 'ASC', value: 'ASC' },
                            { label: 'DESC', value: 'DESC' },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item name={[field.name, 'nulls']} style={{ marginBottom: 0 }}>
                        <Select
                          defaultValue="default"
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

        {/* Limit */}
        <Form.Item name="limit" label={<span style={{ fontWeight: 500 }}>{appendColon(t('Limit'), lang)}</span>}>
          <InputNumber min={0} style={{ width: 120 }} />
        </Form.Item>

        {/* Offset */}
        <Form.Item name="offset" label={<span style={{ fontWeight: 500 }}>{appendColon(t('Offset'), lang)}</span>}>
          <InputNumber min={0} style={{ width: 120 }} />
        </Form.Item>
      </Form>
    </div>
  );
});
