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
import { Modal, Dropdown, Menu, Select, Space } from 'antd';
import {
  MenuOutlined,
  DragOutlined,
  CalendarOutlined,
  FontSizeOutlined,
} from '@ant-design/icons';
import cls from 'classnames';
import { FormDialog, FormLayout } from '@formily/antd';
// import './style.less';
import AddNew from '../add-new';
import { DraggableBlockContext } from '../../components/drag-and-drop';
import { isGridRowOrCol } from '../grid';
import constate from 'constate';
import { useEffect } from 'react';
import { uid } from '@formily/shared';
import { getSchemaPath } from '../../components/schema-renderer';
import { useCollection, useCollectionContext } from '../../constate';
import { useTable } from '../table/hooks/useTable';
import { fieldsToFilterColumns } from './';
import { set } from 'lodash';
import { DragHandle } from '../../components/Sortable';
import { DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../../hooks/useCompile';

export const DesignableBar = observer((props) => {
  const { t } = useTranslation();
  const compile = useCompile();
  const field = useField();
  const { designable, schema, refresh, deepRemove } = useDesignable();
  const [visible, setVisible] = useState(false);
  const { dragRef } = useContext(DraggableBlockContext);
  const { props: tableProps } = useTable();
  const collectionName =
    field.componentProps?.collectionName || tableProps?.collectionName;
  const { collection, fields } = useCollection({ collectionName });
  const fieldNames = field.componentProps.fieldNames;
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <div className={'designable-info'}>
        {compile(collection?.title || collection?.name)}
      </div>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
      >
        <Space size={2}>
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
                <Menu.Item icon={<FontSizeOutlined />}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    {t('Title field')}
                    <Select
                      bordered={false}
                      size={'small'}
                      style={{ minWidth: 160 }}
                      value={field.componentProps?.fieldNames.title}
                      onChange={async (title) => {
                        field.componentProps.fieldNames = {
                          ...fieldNames,
                          title,
                        };
                        // set(field.componentProps, 'fieldNames.title', value);
                        set(
                          schema['x-component-props'],
                          'fieldNames.title',
                          title,
                        );
                        await updateSchema(schema);
                      }}
                      options={fields?.map((field) => {
                        return {
                          label: compile(field?.uiSchema.title),
                          value: field?.name,
                        };
                      })}
                    />
                  </div>
                </Menu.Item>
                <Menu.Item icon={<CalendarOutlined />}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    {t('Start date field')}
                    <Select
                      bordered={false}
                      size={'small'}
                      style={{ minWidth: 160 }}
                      value={field.componentProps?.fieldNames.start}
                      onChange={async (value) => {
                        field.componentProps.fieldNames = {
                          ...fieldNames,
                          start: value,
                        };
                        // set(field.componentProps, 'fieldNames.start', value);
                        set(
                          schema['x-component-props'],
                          'fieldNames.start',
                          value,
                        );
                        await updateSchema(schema);
                      }}
                      options={fields
                        ?.filter((field) => field.dataType === 'date')
                        ?.map((field) => {
                          return {
                            label: compile(field?.uiSchema.title),
                            value: field?.name,
                          };
                        })}
                    />
                  </div>
                </Menu.Item>
                <Menu.Item icon={<CalendarOutlined />}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    {t('End date field')}
                    <Select
                      bordered={false}
                      size={'small'}
                      style={{ minWidth: 160 }}
                      value={field.componentProps?.fieldNames.end}
                      onChange={async (value) => {
                        field.componentProps.fieldNames = {
                          ...fieldNames,
                          end: value,
                        };
                        set(
                          schema['x-component-props'],
                          'fieldNames.end',
                          value,
                        );
                        await updateSchema(schema);
                      }}
                      options={fields
                        ?.filter((field) => field.dataType === 'date')
                        ?.map((field) => {
                          return {
                            label: compile(field?.uiSchema.title),
                            value: field?.name,
                          };
                        })}
                    />
                  </div>
                </Menu.Item>
                <Menu.Item
                  key={'defaultFilter'}
                  icon={<FilterOutlined />}
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
                                    properties: fieldsToFilterColumns(fields),
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
                  {t('Set the data scope')}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  key={'delete'}
                  icon={<DeleteOutlined />}
                  onClick={async () => {
                    setVisible(false);
                    Modal.confirm({
                      title: t('Delete block'),
                      content: t('Are you sure you want to delete it?'),
                      onOk: async () => {
                        const removed = deepRemove();
                        // console.log({ removed })
                        const last = removed.pop();
                        await removeSchema(last);
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
