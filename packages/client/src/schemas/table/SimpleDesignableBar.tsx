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
import { Button, Dropdown, Menu, Modal, Select, Space } from 'antd';
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
import { Trans, useTranslation } from 'react-i18next';

export const SimpleDesignableBar = observer((props) => {
  const { t } = useTranslation();
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
                      t('Set the data scope'),
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
                                        title: t('Action type'),
                                        'x-component': 'Filter.Column',
                                        'x-component-props': {
                                          operations: [
                                            {
                                              label: '{{t("is")}}',
                                              value: 'eq',
                                              selected: true,
                                              schema: {
                                                'x-component': 'Select',
                                              },
                                            },
                                            {
                                              label: '{{t("is not")}}',
                                              value: 'ne',
                                              schema: {
                                                'x-component': 'Select',
                                              },
                                            },
                                            {
                                              label: '{{t("contains")}}',
                                              value: 'in',
                                              schema: {
                                                'x-component': 'Select',
                                                'x-component-props': {
                                                  mode: 'tags',
                                                },
                                              },
                                            },
                                            {
                                              label: '{{t("does not contain")}}',
                                              value: 'notIn',
                                              schema: {
                                                'x-component': 'Select',
                                                'x-component-props': {
                                                  mode: 'tags',
                                                },
                                              },
                                            },
                                            {
                                              label: '{{t("is empty")}}',
                                              value: '$null',
                                              noValue: true,
                                            },
                                            {
                                              label: '{{t("is not empty")}}',
                                              value: '$notNull',
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
                                                label: '{{t("Insert")}}',
                                                value: 'create',
                                              },
                                              {
                                                label: '{{t("Update")}}',
                                                value: 'update',
                                              },
                                              {
                                                label: '{{t("Delete")}}',
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
                    setVisible(false);
                  }}
                >
                  {t('Set the data scope')}
                </Menu.Item>
                <Menu.Item key={'defaultPageSize'}>
                  <Trans>
                    {'Display '}
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
                        setVisible(false);
                      }}
                      defaultValue={defaultPageSize}
                    >
                      <Select.Option value={10}>10</Select.Option>
                      <Select.Option value={20}>20</Select.Option>
                      <Select.Option value={50}>50</Select.Option>
                      <Select.Option value={100}>100</Select.Option>
                    </Select>
                    {' items per page'}
                  </Trans>
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  key={'delete'}
                  onClick={async () => {
                    Modal.confirm({
                      title: t('Delete block'),
                      content: t('Are you sure you want to delete it?'),
                      onOk: async () => {
                        const removed = deepRemove();
                        // console.log({ removed })
                        const last = removed.pop();
                        await removeSchema(last);
                        setVisible(false);
                      },
                    });
                  }}
                >
                  {t('Delete')}
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
