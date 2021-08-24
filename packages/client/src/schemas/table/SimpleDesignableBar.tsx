import React, { useContext, useMemo, useRef, useState } from 'react';
import { createForm } from '@formily/core';
import {
  SchemaOptionsContext,
  Schema,
  useFieldSchema,
  observer,
  SchemaExpressionScopeContext,
  FormProvider,
  ISchema,
  useField,
  useForm,
  RecursionField,
} from '@formily/react';
import {
  useSchemaPath,
  SchemaField,
  useDesignable,
  removeSchema,
  updateSchema,
} from '../';
import get from 'lodash/get';
import { Button, Dropdown, Menu, Select, Space } from 'antd';
import { MenuOutlined, DragOutlined } from '@ant-design/icons';
import cls from 'classnames';
import { FormDialog, FormLayout } from '@formily/antd';
import './style.less';
import AddNew from '../add-new';
import { DraggableBlockContext } from '../../components/drag-and-drop';
import { isGridRowOrCol } from '../grid';
import constate from 'constate';
import { useEffect } from 'react';
import { uid } from '@formily/shared';
import { getSchemaPath } from '../../components/schema-renderer';
import { set } from 'lodash';
import { DragHandle } from '../../components/Sortable';

export const SimpleDesignableBar = observer((props) => {
  const field = useField();
  const { designable, schema, refresh, deepRemove } = useDesignable();
  const [visible, setVisible] = useState(false);
  const { dragRef } = useContext(DraggableBlockContext);
  if (!designable) {
    return null;
  }
  const defaultPageSize =
    field?.componentProps?.pagination?.defaultPageSize || 10;
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
      >
        <Space size={'small'}>
          <AddNew.CardItem defaultAction={'insertAfter'} ghost />
          <DragHandle />
          <Dropdown
            trigger={['hover']}
            visible={visible}
            onVisibleChange={(visible) => {
              setVisible(visible);
            }}
            overlay={
              <Menu>
                <Menu.Item
                  key={'defaultFilter'}
                  onClick={async () => {
                    const { defaultFilter } = await FormDialog(
                      '设置数据范围',
                      () => {
                        return (
                          <FormLayout layout={'vertical'}>
                            <SchemaField
                              schema={{
                                type: 'object',
                                properties: {
                                  defaultFilter: {
                                    type: 'object',
                                    'x-component': 'Filter',
                                    properties: {
                                      column1: {
                                        type: 'void',
                                        title: '操作类型',
                                        'x-component': 'Filter.Column',
                                        'x-component-props': {
                                          operations: [
                                            {
                                              label: '等于',
                                              value: 'eq',
                                              selected: true,
                                              schema: {
                                                'x-component': 'Select',
                                              },
                                            },
                                            {
                                              label: '不等于',
                                              value: 'ne',
                                              schema: {
                                                'x-component': 'Select',
                                              },
                                            },
                                            {
                                              label: '包含',
                                              value: 'in',
                                              schema: {
                                                'x-component': 'Select',
                                                'x-component-props': {
                                                  mode: 'tags',
                                                },
                                              },
                                            },
                                            {
                                              label: '不包含',
                                              value: 'notIn',
                                              schema: {
                                                'x-component': 'Select',
                                                'x-component-props': {
                                                  mode: 'tags',
                                                },
                                              },
                                            },
                                            {
                                              label: '非空',
                                              value: '$notNull',
                                              noValue: true,
                                            },
                                            {
                                              label: '为空',
                                              value: '$null',
                                              noValue: true,
                                            },
                                          ],
                                        },
                                        properties: {
                                          type: {
                                            type: 'string',
                                            'x-component': 'Select',
                                            enum: [
                                              {
                                                label: '新增数据',
                                                value: 'create',
                                              },
                                              {
                                                label: '更新数据',
                                                value: 'update',
                                              },
                                              {
                                                label: '删除数据',
                                                value: 'destroy',
                                              },
                                            ],
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                              }}
                            />
                          </FormLayout>
                        );
                      },
                    ).open({
                      initialValues: {
                        defaultFilter:
                          field?.componentProps?.defaultFilter || {},
                      },
                    });
                    schema['x-component-props']['defaultFilter'] =
                      defaultFilter;
                    field.componentProps.defaultFilter = defaultFilter;
                    await updateSchema(schema);
                  }}
                >
                  设置数据范围
                </Menu.Item>
                <Menu.Item key={'defaultPageSize'}>
                  每页默认显示{' '}
                  <Select
                    bordered={false}
                    size={'small'}
                    onChange={(value) => {
                      const componentProps = schema['x-component-props'] || {};
                      set(componentProps, 'pagination.defaultPageSize', value);
                      set(componentProps, 'pagination.pageSize', value);
                      schema['x-component-props'] = componentProps;
                      field.componentProps.pagination.pageSize = value;
                      field.componentProps.pagination.defaultPageSize = value;
                      refresh();
                      updateSchema(schema);
                    }}
                    defaultValue={defaultPageSize}
                  >
                    <Select.Option value={10}>10</Select.Option>
                    <Select.Option value={20}>20</Select.Option>
                    <Select.Option value={50}>50</Select.Option>
                    <Select.Option value={100}>100</Select.Option>
                  </Select>{' '}
                  条
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  key={'delete'}
                  onClick={async () => {
                    const removed = deepRemove();
                    // console.log({ removed })
                    const last = removed.pop();
                    if (isGridRowOrCol(last)) {
                      await removeSchema(last);
                    }
                  }}
                >
                  移除
                </Menu.Item>
              </Menu>
            }
          >
            <MenuOutlined />
          </Dropdown>
        </Space>
      </span>
    </div>
  );
});
