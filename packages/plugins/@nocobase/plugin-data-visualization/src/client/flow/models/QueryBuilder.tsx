/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Collapse } from 'antd';
import { Field, ObjectField, ArrayField } from '@formily/react';
import { InputNumber, Filter } from '@nocobase/client';
import { useQueryBuilderLogic } from './queryBuilder.logic';
import { Space, Cascader, Select, Input, Checkbox, Button } from 'antd';
import { DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

// 极简适配器：让 antd 原生组件符合 Formily 的 value/onChange 协议，并对 dataSource 做 options 映射
// 顶部适配器定义区域
const CascaderAdapter: React.FC<any> = ({ dataSource, onChange, onValueChange, ...rest }) => {
  return (
    <Cascader
      {...rest}
      options={dataSource}
      onChange={(v) => {
        onChange?.(v); // 先写入 Formily 表单值
        onValueChange?.(v); // 再触发业务侧副作用
      }}
    />
  );
};

const SelectAdapter: React.FC<any> = ({ dataSource, onChange, onValueChange, ...rest }) => {
  return (
    <Select
      {...rest}
      options={dataSource}
      onChange={(v) => {
        onChange?.(v);
        onValueChange?.(v);
      }}
    />
  );
};

const InputAdapter: React.FC<any> = ({ onChange, onValueChange, ...rest }) => {
  return (
    <Input
      {...rest}
      onChange={(e) => {
        const v = e?.target?.value;
        onChange?.(v);
        onValueChange?.(v);
      }}
    />
  );
};

const CheckboxAdapter: React.FC<any> = ({ value, onChange, onValueChange, content, children, ...rest }) => {
  return (
    <Checkbox
      {...rest}
      checked={!!value}
      onChange={(e) => {
        const v = e?.target?.checked;
        onChange?.(v);
        onValueChange?.(v);
      }}
    >
      {children ?? content}
    </Checkbox>
  );
};
import FormItemLite from './FormItemLite';

export const QueryBuilder: React.FC = () => {
  const {
    t,
    token,
    collectionOptions,
    fieldOptions,
    filterOptions,
    formCollapse, // 暂时保留（未使用），后续步骤再考虑移除
    useFormatterOptions,
    useOrderOptions,
    useOrderReactionHook,
    onCollectionChange,
  } = useQueryBuilderLogic();

  return (
    <>
      {/* 设置：数据源/集合 */}
      <ObjectField name="settings">
        <Field
          name="collection"
          title={t('Collection')}
          decorator={[FormItemLite]}
          component={[
            CascaderAdapter,
            {
              showSearch: true,
              placeholder: t('Collection'),
              dataSource: collectionOptions,
              onValueChange: onCollectionChange,
            },
          ]}
        />
      </ObjectField>

      {/* 查询构建 */}
      <ObjectField name="query">
        <ObjectField name="builder">
          <Collapse
            size="small"
            bordered={false}
            defaultActiveKey={['measures']}
            style={{ border: 'none', boxShadow: 'none' }}
          >
            {/* Measures */}
            <Collapse.Panel key="measures" header={t('Measures')} style={{ background: token.colorBgContainer }}>
              <ArrayField name="measures" required>
                {(field) => (
                  <>
                    <div style={{ overflow: 'auto' }}>
                      {field.value?.map((item, index) => (
                        <ObjectField name={index} key={index}>
                          <Space wrap align="center" size={[8, 4]}>
                            <Field
                              name="field"
                              required
                              decorator={[FormItemLite]}
                              component={[
                                CascaderAdapter,
                                {
                                  placeholder: t('Select Field'),
                                  fieldNames: { label: 'title', value: 'name', children: 'children' },
                                  dataSource: fieldOptions,
                                },
                              ]}
                            />
                            <Field
                              name="aggregation"
                              decorator={[FormItemLite]}
                              component={[
                                SelectAdapter,
                                {
                                  placeholder: t('Aggregation'),
                                  style: { minWidth: 80 },
                                  dataSource: [
                                    { label: t('Sum'), value: 'sum' },
                                    { label: t('Count'), value: 'count' },
                                    { label: t('Avg'), value: 'avg' },
                                    { label: t('Max'), value: 'max' },
                                    { label: t('Min'), value: 'min' },
                                  ],
                                },
                              ]}
                            />
                            <Field
                              name="alias"
                              decorator={[FormItemLite]}
                              component={[InputAdapter, { placeholder: t('Alias'), style: { minWidth: 100 } }]}
                            />
                            <Field
                              name="distinct"
                              decorator={[FormItemLite]}
                              component={[CheckboxAdapter]}
                              content={t('Distinct')}
                            />
                            <Button
                              size="small"
                              type="text"
                              onClick={() => field.remove(index)}
                              icon={<DeleteOutlined />}
                            />
                            <Button
                              size="small"
                              type="text"
                              disabled={index === 0}
                              onClick={() => field.moveUp(index)}
                              icon={<ArrowUpOutlined />}
                            />
                            <Button
                              size="small"
                              type="text"
                              disabled={index === (field.value?.length ?? 0) - 1}
                              onClick={() => field.moveDown(index)}
                              icon={<ArrowDownOutlined />}
                            />
                          </Space>
                        </ObjectField>
                      ))}
                    </div>
                    <Button type="dashed" onClick={() => field.push({})}>
                      {t('Add field')}
                    </Button>
                  </>
                )}
              </ArrayField>
            </Collapse.Panel>

            {/* Dimensions */}
            <Collapse.Panel key="dimensions" header={t('Dimensions')} style={{ background: token.colorBgContainer }}>
              <ArrayField name="dimensions">
                {(field) => (
                  <>
                    <div style={{ overflow: 'auto' }}>
                      {field.value?.map((item, index) => (
                        <ObjectField name={index} key={index}>
                          <Space wrap align="center" size={[8, 4]}>
                            <Field
                              name="field"
                              required
                              decorator={[FormItemLite]}
                              component={[
                                CascaderAdapter,
                                {
                                  placeholder: t('Select Field'),
                                  fieldNames: { label: 'title', value: 'name', children: 'children' },
                                  dataSource: fieldOptions,
                                },
                              ]}
                            />
                            <Field
                              name="format"
                              decorator={[FormItemLite]}
                              reactions={[
                                useFormatterOptions,
                                (f) => {
                                  // 仅当存在可选项时显示
                                  // @ts-ignore
                                  f.visible = !!(f.dataSource && f.dataSource.length);
                                },
                              ]}
                              component={[SelectAdapter, { placeholder: t('Format'), style: { maxWidth: 120 } }]}
                            />
                            <Field
                              name="alias"
                              decorator={[FormItemLite]}
                              component={[InputAdapter, { placeholder: t('Alias'), style: { minWidth: 100 } }]}
                            />
                            <Button
                              size="small"
                              type="text"
                              onClick={() => field.remove(index)}
                              icon={<DeleteOutlined />}
                            />
                            <Button
                              size="small"
                              type="text"
                              disabled={index === 0}
                              onClick={() => field.moveUp(index)}
                              icon={<ArrowUpOutlined />}
                            />
                            <Button
                              size="small"
                              type="text"
                              disabled={index === (field.value?.length ?? 0) - 1}
                              onClick={() => field.moveDown(index)}
                              icon={<ArrowDownOutlined />}
                            />
                          </Space>
                        </ObjectField>
                      ))}
                    </div>
                    <Button type="dashed" onClick={() => field.push({})}>
                      {t('Add field')}
                    </Button>
                  </>
                )}
              </ArrayField>
            </Collapse.Panel>

            {/* Filter */}
            <Collapse.Panel key="filter" header={t('Filter')} style={{ background: token.colorBgContainer }}>
              <Field
                name="filter"
                decorator={[FormItemLite, { style: { overflow: 'auto' } }]}
                component={[Filter, { dynamicComponent: 'FilterDynamicComponent', dataSource: filterOptions }]}
              />
            </Collapse.Panel>

            {/* Sort */}
            <Collapse.Panel
              key="sort"
              header={t('Sort')}
              style={{ background: token.colorBgContainer, border: 'none' }}
            >
              <ArrayField name="orders" reactions={[useOrderReactionHook]}>
                {(field) => (
                  <>
                    <div style={{ overflow: 'auto' }}>
                      {field.value?.map((item, index) => (
                        <ObjectField name={index} key={index}>
                          <Space wrap align="center" size={[8, 4]}>
                            <Field
                              name="field"
                              required
                              decorator={[FormItemLite]}
                              reactions={[useOrderOptions]}
                              component={[CascaderAdapter, { placeholder: t('Select Field') }]}
                            />
                            <Field
                              name="order"
                              decorator={[FormItemLite]}
                              component={[
                                SelectAdapter,
                                {
                                  defaultValue: 'ASC',
                                  dataSource: [
                                    { label: 'ASC', value: 'ASC' },
                                    { label: 'DESC', value: 'DESC' },
                                  ],
                                  style: { minWidth: 100 },
                                },
                              ]}
                            />
                            <Field
                              name="nulls"
                              decorator={[FormItemLite]}
                              component={[
                                SelectAdapter,
                                {
                                  defaultValue: 'default',
                                  dataSource: [
                                    { label: t('Default'), value: 'default' },
                                    { label: t('NULLS first'), value: 'first' },
                                    { label: t('NULLS last'), value: 'last' },
                                  ],
                                  style: { minWidth: 110 },
                                },
                              ]}
                            />
                            <Button
                              size="small"
                              type="text"
                              onClick={() => field.remove(index)}
                              icon={<DeleteOutlined />}
                            />
                            <Button
                              size="small"
                              type="text"
                              disabled={index === 0}
                              onClick={() => field.moveUp(index)}
                              icon={<ArrowUpOutlined />}
                            />
                            <Button
                              size="small"
                              type="text"
                              disabled={index === (field.value?.length ?? 0) - 1}
                              onClick={() => field.moveDown(index)}
                              icon={<ArrowDownOutlined />}
                            />
                          </Space>
                        </ObjectField>
                      ))}
                    </div>
                    <Button type="dashed" onClick={() => field.push({})}>
                      {t('Add field')}
                    </Button>
                  </>
                )}
              </ArrayField>
            </Collapse.Panel>
          </Collapse>
        </ObjectField>

        {/* Limit / Offset */}
        <Field
          name="limit"
          title={t('Limit')}
          decorator={[FormItemLite]}
          component={[InputNumber, { defaultValue: 2000, min: 1, style: { width: 100 } }]}
        />
        <Field
          name="offset"
          title={t('Offset')}
          decorator={[FormItemLite]}
          component={[InputNumber, { defaultValue: 0, min: 0, style: { width: 100 } }]}
        />
      </ObjectField>
    </>
  );
};
