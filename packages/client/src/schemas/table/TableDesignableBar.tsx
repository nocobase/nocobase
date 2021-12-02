import React, { useContext, useState } from 'react';
import { Modal, Select, Dropdown, Menu, Switch, Space } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { set } from 'lodash';
import { observer, useField } from '@formily/react';
import { FormDialog, FormLayout } from '@formily/antd';
import cls from 'classnames';
import { Trans, useTranslation } from 'react-i18next';
import { useCompile } from '../../hooks/useCompile';
import { useDesignable } from '..';
import { DraggableBlockContext } from '../../components/drag-and-drop';
import { useCollection, useClient } from '../../constate';
import AddNew from '../add-new';
import { SchemaField } from '../../components/schema-renderer';
import { DragHandle } from '../../components/Sortable';
import { fieldsToSortColumns, fieldsToFilterColumns } from './utils';

export const TableDesignableBar = observer((props) => {
  const { t } = useTranslation();
  const compile = useCompile();
  const field = useField();
  const { schema, refresh, deepRemove } = useDesignable();
  const [visible, setVisible] = useState(false);
  const { dragRef } = useContext(DraggableBlockContext);
  const defaultPageSize = field?.componentProps?.pagination?.defaultPageSize || 10;
  const collectionName = field?.componentProps?.collectionName;
  const { collection, fields } = useCollection({ collectionName });
  const { createSchema, removeSchema, updateSchema } = useClient();
  console.log({ collectionName });
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <div className={'designable-info'}>{compile(collection?.title || collection?.name)}</div>
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
                <Menu.Item
                  key={'showIndex'}
                  onClick={() => {
                    const bool = !field.componentProps.showIndex;
                    schema['x-component-props']['showIndex'] = bool;
                    field.componentProps.showIndex = bool;
                    updateSchema(schema);
                    setVisible(false);
                  }}
                >
                  <div className={'nb-space-between'}>
                    {t('Display order number')} <Switch size={'small'} checked={field.componentProps.showIndex} />
                  </div>
                </Menu.Item>
                <Menu.Item
                  key={'dragSort'}
                  onClick={() => {
                    const dragSort = field.componentProps.dragSort ? false : 'sort';
                    schema['x-component-props']['dragSort'] = dragSort;
                    field.componentProps.dragSort = dragSort;
                    updateSchema(schema);
                    setVisible(false);
                  }}
                >
                  <div className={'nb-space-between'}>
                    {t('Enable drag and drop sorting')}
                    &nbsp;&nbsp;
                    <Switch size={'small'} checked={field.componentProps.dragSort} />
                  </div>
                </Menu.Item>
                {!field.componentProps.dragSort && (
                  <Menu.Item
                    key={'defaultSort'}
                    onClick={async () => {
                      const defaultSort = field.componentProps?.defaultSort?.map((item: string) => {
                        return item.startsWith('-')
                          ? {
                              field: item.substring(1),
                              direction: 'desc',
                            }
                          : {
                              field: item,
                              direction: 'asc',
                            };
                      });
                      const values = await FormDialog(t('Set default sorting rules'), () => {
                        return (
                          <FormLayout layout={'vertical'}>
                            <SchemaField
                              schema={{
                                type: 'object',
                                properties: {
                                  defaultSort: {
                                    type: 'array',
                                    'x-component': 'ArrayItems',
                                    'x-decorator': 'FormItem',
                                    items: {
                                      type: 'object',
                                      properties: {
                                        space: {
                                          type: 'void',
                                          'x-component': 'Space',
                                          properties: {
                                            sort: {
                                              type: 'void',
                                              'x-decorator': 'FormItem',
                                              'x-component': 'ArrayItems.SortHandle',
                                            },
                                            field: {
                                              type: 'string',
                                              'x-decorator': 'FormItem',
                                              'x-component': 'Select',
                                              enum: fieldsToSortColumns(fields),
                                              'x-component-props': {
                                                style: {
                                                  width: 260,
                                                },
                                              },
                                            },
                                            direction: {
                                              type: 'string',
                                              'x-decorator': 'FormItem',
                                              'x-component': 'Radio.Group',
                                              'x-component-props': {
                                                optionType: 'button',
                                              },
                                              enum: [
                                                {
                                                  label: t('ASC'),
                                                  value: 'asc',
                                                },
                                                {
                                                  label: t('DESC'),
                                                  value: 'desc',
                                                },
                                              ],
                                            },
                                            remove: {
                                              type: 'void',
                                              'x-decorator': 'FormItem',
                                              'x-component': 'ArrayItems.Remove',
                                            },
                                          },
                                        },
                                      },
                                    },
                                    properties: {
                                      add: {
                                        type: 'void',
                                        title: t('Add sort field'),
                                        'x-component': 'ArrayItems.Addition',
                                      },
                                    },
                                  },
                                },
                              }}
                            />
                          </FormLayout>
                        );
                      }).open({
                        initialValues: {
                          defaultSort,
                        },
                      });
                      const sort = values.defaultSort.map((item) => {
                        return item.direction === 'desc' ? `-${item.field}` : item.field;
                      });
                      schema['x-component-props']['defaultSort'] = sort;
                      field.componentProps.defaultSort = sort;
                      await updateSchema(schema);
                      setVisible(false);
                      console.log('defaultSort', sort);
                    }}
                  >
                    {t('Set default sorting rules')}
                  </Menu.Item>
                )}
                <Menu.Item
                  key={'defaultFilter'}
                  onClick={async () => {
                    const { defaultFilter } = await FormDialog(t('Set the data scope'), () => {
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
                    }).open({
                      initialValues: {
                        defaultFilter: field?.componentProps?.defaultFilter || {},
                      },
                    });
                    schema['x-component-props']['defaultFilter'] = defaultFilter;
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
