import {
  FormProvider,
  observer,
  RecursionField,
  Schema,
  useField,
  useForm,
} from '@formily/react';
import { Modal, Pagination, Popover, Table as AntdTable } from 'antd';
import { cloneDeep, cloneDeepWith, findIndex, forIn, range, set } from 'lodash';
import React, { Fragment, useEffect, useState } from 'react';
import { useContext } from 'react';
import { createContext } from 'react';
import {
  useDesignable,
  updateSchema,
  removeSchema,
  createSchema,
  createCollectionField,
  ISchema,
} from '..';
import { uid } from '@formily/shared';
import useRequest from '@ahooksjs/use-request';
import { BaseResult } from '@ahooksjs/use-request/lib/types';
import cls from 'classnames';
import { MenuOutlined, DragOutlined, FilterOutlined } from '@ant-design/icons';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Select, Dropdown, Menu, Switch, Button, Space } from 'antd';
import { PlusOutlined, SettingOutlined } from '@ant-design/icons';
import './style.less';
import {
  findPropertyByPath,
  getSchemaPath,
  SchemaField,
  SchemaRenderer,
} from '../../components/schema-renderer';
import {
  interfaces,
  isAssociation,
  options,
} from '../database-field/interfaces';
import { DraggableBlockContext } from '../../components/drag-and-drop';
import AddNew from '../add-new';
import { isGridRowOrCol } from '../grid';
import { ListOptions, Resource } from '../../resource';
import {
  CollectionProvider,
  DisplayedMapProvider,
  useCollection,
  useCollectionContext,
  useDisplayedMapContext,
} from '../../constate';
import { useResource as useGeneralResource } from '../../hooks/useResource';
import SwitchMenuItem from '../../components/SwitchMenuItem';
import { useMemo } from 'react';
import { createForm } from '@formily/core';
import {
  ColDraggableContext,
  SortableBodyCell,
  SortableBodyRow,
  SortableColumn,
  SortableHeaderCell,
  SortableHeaderRow,
  SortableRowHandle,
} from './Sortable';
import { DragHandle, Droppable, SortableItem } from '../../components/Sortable';
import { isValid } from '@formily/shared';
import { FormButtonGroup, FormDialog, FormLayout, Submit } from '@formily/antd';
import flatten from 'flat';
import IconPicker from '../../components/icon-picker';
import { DescriptionsContext } from '../form';
import { VisibleContext } from '../../context';
import { SimpleDesignableBar } from './SimpleDesignableBar';

export interface ITableContext {
  props: any;
  field: Formily.Core.Models.ArrayField;
  schema: Schema;
  service: BaseResult<any, any>;
  selectedRowKeys?: any;
  setSelectedRowKeys?: any;
  pagination?: any;
  setPagination?: any;
  refresh?: any;
  resource?: Resource;
}

export interface ITableRowContext {
  index: number;
  record: any;
}

const TableContext = createContext<ITableContext>({} as any);
export const TableRowContext = createContext<ITableRowContext>(null);
export const CollectionFieldContext = createContext(null);

export const useTable = () => {
  return useContext(TableContext);
};

const useTableRow = () => {
  return useContext(TableRowContext);
};

function useTableFilterAction() {
  const {
    field,
    service,
    refresh,
    props: { refreshRequestOnChange },
  } = useTable();
  const form = useForm();
  return {
    async run() {
      console.log('useTableFilterAction', form.values);
      if (refreshRequestOnChange) {
        return service.run({
          ...service.params[0],
          // filter,
        });
      }
    },
  };
}

function useTableCreateAction() {
  const {
    field,
    service,
    resource,
    refresh,
    props: { refreshRequestOnChange },
  } = useTable();
  const form = useForm();
  return {
    async run() {
      console.log('useTableCreateAction', resource)
      if (refreshRequestOnChange) {
        await resource.create(form.values);
        await form.reset();
        return service.refresh();
      }
      field.unshift(form.values);
    },
  };
}

const useTableUpdateAction = () => {
  const {
    resource,
    field,
    service,
    refresh,
    props: { refreshRequestOnChange, rowKey },
  } = useTable();
  const ctx = useContext(TableRowContext);
  const form = useForm();
  const { service: formService } = useContext(DescriptionsContext);

  return {
    async run() {
      if (refreshRequestOnChange) {
        await resource.save(form.values, {
          resourceKey: ctx.record[rowKey],
        });
        if (formService) {
          await formService.refresh();
        }
        await service.refresh();
        return;
      }
      field.value[ctx.index] = form.values;
      // refresh();
    },
  };
};

const useTableDestroyAction = () => {
  const {
    resource,
    field,
    service,
    selectedRowKeys,
    setSelectedRowKeys,
    refresh,
    props: { refreshRequestOnChange, rowKey },
  } = useTable();
  const ctx = useContext(TableRowContext);
  const [, setVisible] = useContext(VisibleContext);
  return {
    async run() {
      if (refreshRequestOnChange) {
        const rowKeys = selectedRowKeys || [];
        if (ctx) {
          rowKeys.push(ctx.record[rowKey]);
        }
        await resource.destroy({
          [`${rowKey}.in`]: rowKeys,
        });
        setSelectedRowKeys([]);
        setVisible && setVisible(false);
        return service.refresh();
      }
      if (ctx) {
        console.log('ctx.index', ctx.index);
        field.remove(ctx.index);
        refresh();
      }
      const rowKeys = [...selectedRowKeys];
      while (rowKeys.length) {
        const key = rowKeys.shift();
        const index = findIndex(field.value, (item) => item[rowKey] === key);
        field.remove(index);
      }
      setSelectedRowKeys([]);
      refresh();
      return;
    },
  };
};

const useTableExportAction = () => {
  const {
    resource,
    field,
    service,
    selectedRowKeys,
    setSelectedRowKeys,
    refresh,
    schema,
    props: { refreshRequestOnChange, rowKey },
  } = useTable();
  const ctx = useContext(TableRowContext);

  const actionField = useField();
  const fieldNames = actionField.componentProps.fieldNames || [];
  const { getField } = useCollectionContext();

  const columns = fieldNames
    .map((name) => {
      const f = getField(name);
      return {
        title: f?.uiSchema.title,
        name,
        sort: f?.sort,
      };
    })
    .sort((a, b) => a.sort - b.sort);

  return {
    async run() {
      const rowKeys = selectedRowKeys || [];
      const { filter = {}, ...others } = service.params[0];
      if (rowKeys.length) {
        filter[`${rowKey}.in`] = rowKeys;
      }
      await resource.export({
        ...others,
        columns,
        perPage: -1,
        page: 1,
        filter,
      });
    },
  };
};

const useTableRowRecord = () => {
  const ctx = useContext(TableRowContext);
  return ctx.record;
};

const useTableIndex = () => {
  const { pagination, props } = useTable();
  const ctx = useContext(TableRowContext);
  if (pagination && !props.clientSidePagination) {
    const { pageSize, page = 1 } = pagination;
    return ctx.index + (page - 1) * pageSize;
  }
  return ctx.index;
};

const useTableActionBars = () => {
  const {
    field,
    schema,
    props: { rowKey },
  } = useTable();

  const bars = schema.reduceProperties((bars, current) => {
    if (current['x-component'] === 'Table.ActionBar') {
      return [...bars, current];
    }
    return [...bars];
  }, []);

  return bars;
};

export function isOperationColumn(schema: Schema) {
  return ['Table.Operation'].includes(schema['x-component']);
}

export function isColumn(schema: Schema) {
  return ['Table.Column'].includes(schema['x-component']);
}

export function isColumnComponent(component: string) {
  return ['Table.Operation', 'Table.Column'].includes(component);
}

const useCollectionFields = (schema: Schema) => {
  const columns = schema.reduceProperties((columns, current) => {
    if (isColumn(current)) {
      if (current['x-hidden']) {
        return columns;
      }
      if (current['x-display'] && current['x-display'] !== 'visible') {
        return columns;
      }
      return [...columns, current];
    }
    return [...columns];
  }, []);

  return columns
    .map((column) => {
      const columnProps = column['x-component-props'] || {};
      return columnProps.fieldName;
    })
    .filter(Boolean);
};

const useTableColumns = () => {
  const {
    field,
    schema,
    props: { rowKey },
  } = useTable();
  const { designable } = useDesignable();

  const { getField } = useCollectionContext();

  const columnSchemas = schema.reduceProperties((columns, current) => {
    if (isColumn(current)) {
      if (current['x-hidden']) {
        return columns;
      }
      if (current['x-display'] && current['x-display'] !== 'visible') {
        return columns;
      }
      return [...columns, current];
    }
    return [...columns];
  }, []);

  const columns: any[] = [].concat(
    columnSchemas.map((column: Schema) => {
      const columnProps = column['x-component-props'] || {};
      const collectionField = getField(columnProps.fieldName);
      return {
        title: (
          <CollectionFieldContext.Provider value={collectionField}>
            <RecursionField name={column.name} schema={column} onlyRenderSelf />
          </CollectionFieldContext.Provider>
        ),
        dataIndex: column.name,
        ...columnProps,
        render: (_: any, record: any) => {
          const index = findIndex(
            field.value,
            (item) => item[rowKey] === record[rowKey],
          );
          return (
            <CollectionFieldContext.Provider value={collectionField}>
              <TableRowContext.Provider value={{ index, record }}>
                <Table.Cell schema={column} />
              </TableRowContext.Provider>
            </CollectionFieldContext.Provider>
          );
        },
      };
    }),
  );

  if (
    designable &&
    schema['x-designable-bar'] &&
    schema['x-designable-bar'] !== 'Table.SimpleDesignableBar'
  ) {
    columns.push({
      title: <AddColumn />,
      dataIndex: 'addnew',
    });
  }
  return columns;
};

function AddColumn() {
  const [visible, setVisible] = useState(false);
  const { appendChild, remove } = useDesignable();
  const { collection, fields, refresh } = useCollectionContext();
  const displayed = useDisplayedMapContext();
  const { service } = useTable();
  return (
    <Dropdown
      trigger={['hover']}
      visible={visible}
      onVisibleChange={setVisible}
      overlay={
        <Menu>
          <Menu.ItemGroup className={'display-fields'} title={'显示字段'}>
            {fields.map((field) => (
              <SwitchMenuItem
                title={field?.uiSchema?.title}
                checked={displayed.has(field.name)}
                onChange={async (checked) => {
                  if (checked) {
                    console.log(
                      'SwitchMenuItem.field.name',
                      field.dataType,
                      service.params[0],
                    );
                    const columnSchema: ISchema = {
                      type: 'void',
                      'x-component': 'Table.Column',
                      'x-component-props': {
                        fieldName: field.name,
                      },
                      'x-designable-bar': 'Table.Column.DesignableBar',
                    };
                    if (field.interface === 'linkTo') {
                      columnSchema.properties = {
                        options: {
                          type: 'void',
                          'x-decorator': 'Form',
                          'x-component': 'Select.Options.Drawer',
                          'x-component-props': {
                            useOkAction: '{{ Select.useOkAction }}',
                          },
                          title: '关联数据',
                          properties: {
                            table: {
                              type: 'array',
                              'x-designable-bar': 'Table.DesignableBar',
                              'x-decorator': 'BlockItem',
                              'x-decorator-props': {
                                draggable: false,
                              },
                              'x-component': 'Table',
                              default: [],
                              'x-component-props': {
                                rowKey: 'id',
                                defaultSelectedRowKeys: '{{ Select.useSelectedRowKeys() }}',
                                onSelect: '{{ Select.useSelect() }}',
                                collectionName: field.target,
                                // dragSort: true,
                                showIndex: true,
                                refreshRequestOnChange: true,
                                pagination: {
                                  pageSize: 10,
                                },
                              },
                              properties: {
                                [uid()]: {
                                  type: 'void',
                                  'x-component': 'Table.ActionBar',
                                  'x-designable-bar':
                                    'Table.ActionBar.DesignableBar',
                                  properties: {
                                    [uid()]: {
                                      type: 'void',
                                      title: '筛选',
                                      'x-decorator': 'AddNew.Displayed',
                                      'x-decorator-props': {
                                        displayName: 'filter',
                                      },
                                      'x-align': 'left',
                                      'x-component': 'Table.Filter',
                                      'x-designable-bar':
                                        'Table.Filter.DesignableBar',
                                      'x-component-props': {
                                        fieldNames: [],
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                        option: {
                          type: 'void',
                          'x-component': 'Select.OptionTag',
                          properties: {
                            [uid()]: {
                              type: 'void',
                              title: '查看数据',
                              'x-component': 'Action.Drawer',
                              'x-component-props': {
                                bodyStyle: {
                                  background: '#f0f2f5',
                                },
                              },
                              properties: {
                                [uid()]: {
                                  type: 'void',
                                  'x-component': 'Tabs',
                                  'x-designable-bar': 'Tabs.DesignableBar',
                                  properties: {
                                    [uid()]: {
                                      type: 'void',
                                      title: '详情',
                                      'x-designable-bar':
                                        'Tabs.TabPane.DesignableBar',
                                      'x-component': 'Tabs.TabPane',
                                      'x-component-props': {},
                                      properties: {
                                        [uid()]: {
                                          type: 'void',
                                          'x-component': 'Grid',
                                          'x-component-props': {
                                            addNewComponent: 'AddNew.PaneItem',
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      };
                    }
                    const data = appendChild(columnSchema);
                    await createSchema(data);
                    if (isAssociation(field)) {
                      const defaultAppends =
                        service.params[0]?.defaultAppends || [];
                      defaultAppends.push(field.name);
                      await service.run({
                        ...service.params[0],
                        defaultAppends,
                      });
                    }
                  } else {
                    const s: any = displayed.get(field.name);
                    const p = getSchemaPath(s);
                    const removed = remove(p);
                    await removeSchema(removed);
                    displayed.remove(field.name);
                    if (isAssociation(field)) {
                      const defaultAppends =
                        service.params[0]?.defaultAppends || [];
                      const index = defaultAppends.indexOf(field.name);
                      if (index > -1) {
                        defaultAppends.splice(index, 1);
                      }
                      await service.run({
                        ...service.params[0],
                        defaultAppends,
                      });
                    }
                  }
                  // service.refresh();
                }}
              />
            ))}
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.SubMenu
            popupClassName={'add-new-fields-popup'}
            title={'添加字段'}
          >
            {options.map((option) => (
              <Menu.ItemGroup title={option.label}>
                {option.children.map((item) => (
                  <Menu.Item
                    style={{ minWidth: 150 }}
                    key={item.name}
                    onClick={async () => {
                      setVisible(false);
                      const values = await FormDialog(`添加字段`, () => {
                        return (
                          <FormLayout layout={'vertical'}>
                            <SchemaField schema={item} />
                          </FormLayout>
                        );
                      }).open({
                        initialValues: {
                          interface: item.name,
                          ...item.default,
                          key: uid(),
                          name: `f_${uid()}`,
                        },
                      });
                      await createCollectionField(collection?.name, values);
                      const data = appendChild({
                        type: 'void',
                        'x-component': 'Table.Column',
                        'x-component-props': {
                          fieldName: values.name,
                        },
                        'x-designable-bar': 'Table.Column.DesignableBar',
                      });
                      await createSchema(data);
                      await refresh();
                    }}
                  >
                    {item.title}
                  </Menu.Item>
                ))}
              </Menu.ItemGroup>
            ))}
          </Menu.SubMenu>
        </Menu>
      }
    >
      <Button
        type={'dashed'}
        className={'designable-btn designable-btn-dash'}
        icon={<SettingOutlined />}
      >
        配置字段
      </Button>
    </Dropdown>
  );
}

const useDataSource = () => {
  const {
    pagination,
    field,
    props: { clientSidePagination, dataRequest },
  } = useTable();
  let dataSource = field.value;
  if (pagination && (clientSidePagination || !dataRequest)) {
    const { page = 1, pageSize } = pagination;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize - 1;
    dataSource = field.value?.slice(startIndex, endIndex + 1);
  }
  return dataSource;
};

const TableMain = () => {
  const {
    resource,
    selectedRowKeys,
    setSelectedRowKeys,
    service,
    field,
    props: { rowKey, dragSort, showIndex, onSelect },
    refresh,
  } = useTable();
  const columns = useTableColumns();
  const dataSource = useDataSource();
  const actionBars = useTableActionBars();
  const [html, setHtml] = useState('');
  return (
    <div className={'nb-table'}>
      <DndContext
        onDragEnd={async (event) => {
          const fromId = event.active?.id as any;
          const toId = event.over?.id as any;
          if (isValid(fromId) && isValid(toId)) {
            const fromIndex = findIndex(
              field.value,
              (item) => item[rowKey] === fromId,
            );
            const toIndex = findIndex(
              field.value,
              (item) => item[rowKey] === toId,
            );
            console.log({ fromId, toId, fromIndex, toIndex });
            field.move(fromIndex, toIndex);
            refresh();
            await resource.sort({
              resourceKey: fromId,
              target: {
                [rowKey]: toId,
              },
            });
            await service.refresh();
          }
        }}
      >
        {actionBars.map((actionBar) => (
          <RecursionField
            schema={
              new Schema({
                type: 'void',
                properties: {
                  [actionBar.name]: actionBar,
                },
              })
            }
          />
        ))}
        <SortableContext
          items={dataSource || []}
          strategy={verticalListSortingStrategy}
        >
          <AntdTable
            pagination={false}
            onChange={(pagination) => {}}
            loading={service?.loading}
            rowKey={rowKey}
            dataSource={dataSource}
            columns={columns}
            // components={{
            //   body: {
            //     row: DragableBodyRow,
            //   },
            // }}
            components={{
              header: {
                row: SortableHeaderRow,
                cell: SortableHeaderCell,
              },
              body: {
                // wrapper: (props) => {
                //   return (
                //     <tbody {...props}>
                //       <DragOverlay
                //         className={'ant-table-row'}
                //         wrapperElement={'tr'}
                //       >
                //         <div />
                //       </DragOverlay>
                //       {props.children}
                //     </tbody>
                //   );
                // },
                row: SortableBodyRow,
                // cell: SortableBodyCell,
              },
            }}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys,
              onChange: (rowKeys, rows) => {
                setSelectedRowKeys(rowKeys);
                onSelect && onSelect(rowKeys, rows);
              },
              renderCell: (checked, record, _, originNode) => {
                const index = findIndex(
                  field.value,
                  (item) => item[rowKey] === record[rowKey],
                );
                return (
                  <TableRowContext.Provider
                    value={{
                      index,
                      record,
                    }}
                  >
                    <div
                      className={cls('nb-table-selection', {
                        dragSort,
                        showIndex,
                      })}
                    >
                      {dragSort && <Table.SortHandle />}
                      {showIndex && <Table.Index />}
                      {originNode}
                    </div>
                  </TableRowContext.Provider>
                );
              },
            }}
          />
        </SortableContext>
      </DndContext>
      <Table.Pagination />
    </div>
  );
};

const usePagination = () => {
  const field = useField<Formily.Core.Models.ArrayField>();
  const paginationProps = field.componentProps.pagination;

  let pagination = paginationProps;

  // const [pagination, setPagination] = useState(() => {
  //   if (!paginationProps) {
  //     return false;
  //   }
  //   const { defaultPageSize = 10, ...others } = paginationProps;
  //   return { page: 1, pageSize: defaultPageSize, ...others };
  // });

  // useEffect(() => {
  //   if (!paginationProps) {
  //     return setPagination(false);
  //   }
  //   const { defaultPageSize = 10, ...others } = paginationProps;
  //   setPagination({ page: 1, pageSize: defaultPageSize, ...others });
  // }, [paginationProps]);

  return [
    pagination,
    (params) => {
      const defaults = field.componentProps.pagination;
      field.componentProps.pagination = { ...defaults, ...params };
    },
  ];
};

const TableProvider = (props: any) => {
  const {
    rowKey = 'id',
    dataRequest,
    useResource = useGeneralResource,
    defaultSelectedRowKeys,
    ...others
  } = props;
  const { schema } = useDesignable();
  const field = useField<Formily.Core.Models.ArrayField>();
  const [pagination, setPagination] = usePagination();
  const [selectedRowKeys, setSelectedRowKeys] = useState<any>(
    defaultSelectedRowKeys || [],
  );
  const [, refresh] = useState(uid());
  const { resource } = useResource();
  const { sortableField } = useCollectionContext();
  const dragSort = props.dragSort;
  const collectionFields = useCollectionFields(schema);
  console.log({ collectionFields });
  const getDefaultParams = () => {
    const defaultParams = { ...pagination };
    if (dragSort) {
      defaultParams['sort'] = [sortableField || 'sort'];
    } else {
      defaultParams['sort'] = (props.defaultSort || []).join(',');
    }
    defaultParams['defaultAppends'] = [
      ...(props.defaultAppends || []),
      ...collectionFields,
    ];
    if (props.defaultFilter) {
      defaultParams['defaultFilter'] = props.defaultFilter;
    }
    console.log({ defaultParams });
    return defaultParams;
  };
  const service = useRequest(
    (params?: any) => {
      if (!resource) {
        return Promise.resolve({
          list: field.value,
          total: field?.value?.length,
        });
      }
      return resource.list(params).then((res) => {
        return {
          list: res?.data || [],
          total: res?.meta?.count || res?.data?.length,
        };
      });
    },
    {
      onSuccess(data: any) {
        field.setValue(data?.list || []);
      },
      manual: true,
      // defaultParams: [getDefaultParams()],
    },
  );
  useEffect(() => {
    service.run(getDefaultParams());
  }, [
    pagination.pageSize,
    props.dragSort,
    props.defaultSort,
    props.defaultFilter,
  ]);
  return (
    <TableContext.Provider
      value={{
        resource,
        refresh: () => {
          const { page = 1, pageSize } = pagination;
          const total = props.clientSidePagination
            ? field?.value?.length
            : service?.data?.total;
          const maxPage = Math.ceil(total / pageSize);
          if (page > maxPage) {
            setPagination({ page: maxPage });
          } else {
            refresh(uid());
          }
        },
        selectedRowKeys,
        setSelectedRowKeys,
        pagination,
        setPagination,
        service,
        field,
        schema,
        props: { ...others, rowKey, dataRequest },
      }}
    >
      <TableMain />
    </TableContext.Provider>
  );
};

export const Table: any = observer((props: any) => {
  const [visible, setVisible] = useState(false);
  return (
    <CollectionProvider collectionName={props.collectionName}>
      <DisplayedMapProvider>
        <TableProvider {...props} />
      </DisplayedMapProvider>
    </CollectionProvider>
  );
});

const useTotal = () => {
  const {
    field,
    service,
    props: { clientSidePagination },
  } = useTable();
  return clientSidePagination ? field?.value?.length : service?.data?.total;
};

Table.Pagination = observer(() => {
  const { service, pagination, setPagination, props } = useTable();
  if (!pagination || Object.keys(pagination).length === 0) {
    return null;
  }
  const { clientSidePagination } = props;
  const total = useTotal();
  const { page = 1 } = pagination;
  return (
    <div style={{ marginTop: 16 }}>
      <Pagination
        {...pagination}
        showSizeChanger
        current={page}
        total={total}
        onChange={(current, pageSize) => {
          const page = pagination.pageSize !== pageSize ? 1 : current;
          setPagination({
            page,
            pageSize,
          });
          // if (clientSidePagination) {
          //   return;
          // }
          // service.run({
          //   ...service.params[0],
          //   page,
          //   pageSize,
          // });
        }}
      />
    </div>
  );
});

function generateActionSchema(type) {
  const actions: { [key: string]: ISchema } = {
    filter: {
      key: uid(),
      name: uid(),
      type: 'void',
      title: '筛选',
      'x-align': 'left',
      'x-decorator': 'AddNew.Displayed',
      'x-decorator-props': {
        displayName: 'filter',
      },
      'x-component': 'Table.Filter',
      'x-designable-bar': 'Table.Filter.DesignableBar',
      'x-component-props': {
        fieldNames: [],
      },
    },
    export: {
      key: uid(),
      type: 'void',
      name: uid(),
      title: '导出',
      'x-align': 'right',
      'x-decorator': 'AddNew.Displayed',
      'x-decorator-props': {
        displayName: 'export',
      },
      'x-action-type': 'export',
      'x-component': 'Action',
      'x-designable-bar': 'Table.ExportActionDesignableBar',
      'x-component-props': {
        fieldNames: [],
        useAction: '{{ Table.useTableExportAction }}',
      },
    },
    create: {
      key: uid(),
      type: 'void',
      name: uid(),
      title: '添加',
      'x-align': 'right',
      'x-decorator': 'AddNew.Displayed',
      'x-decorator-props': {
        displayName: 'create',
      },
      'x-component': 'Action',
      'x-component-props': {
        type: 'primary',
        icon: 'PlusOutlined',
      },
      'x-designable-bar': 'Table.Action.DesignableBar',
      properties: {
        modal: {
          type: 'void',
          title: '添加数据',
          'x-decorator': 'Form',
          'x-component': 'Action.Drawer',
          'x-component-props': {
            useOkAction: '{{ Table.useTableCreateAction }}',
          },
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Grid',
              'x-component-props': {
                addNewComponent: 'AddNew.FormItem',
              },
            },
          },
        },
      },
    },
    destroy: {
      key: uid(),
      type: 'void',
      name: uid(),
      title: '删除',
      'x-align': 'right',
      'x-decorator': 'AddNew.Displayed',
      'x-decorator-props': {
        displayName: 'destroy',
      },
      'x-action-type': 'destroy',
      'x-component': 'Action',
      'x-designable-bar': 'Table.Action.DesignableBar',
      'x-component-props': {
        confirm: {
          title: '删除数据',
          content: '删除后无法恢复，确定要删除吗？',
        },
        useAction: '{{ Table.useTableDestroyAction }}',
      },
    },
    view: {},
    update: {},
  };
  return actions[type];
}

function generateMenuActionSchema(type) {
  const actions: { [key: string]: ISchema } = {
    view: {
      key: uid(),
      name: uid(),
      type: 'void',
      title: '查看',
      'x-component': 'Action',
      'x-component-props': {
        type: 'link',
      },
      'x-designable-bar': 'Table.Action.DesignableBar',
      'x-action-type': 'view',
      properties: {
        [uid()]: {
          type: 'void',
          title: '查看数据',
          'x-component': 'Action.Drawer',
          'x-component-props': {
            bodyStyle: {
              background: '#f0f2f5',
              // paddingTop: 0,
            },
          },
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Tabs',
              'x-designable-bar': 'Tabs.DesignableBar',
              properties: {
                [uid()]: {
                  type: 'void',
                  title: '详情',
                  'x-designable-bar': 'Tabs.TabPane.DesignableBar',
                  'x-component': 'Tabs.TabPane',
                  'x-component-props': {},
                  properties: {
                    [uid()]: {
                      type: 'void',
                      'x-component': 'Grid',
                      'x-component-props': {
                        addNewComponent: 'AddNew.PaneItem',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    update: {
      key: uid(),
      name: uid(),
      type: 'void',
      title: '编辑',
      'x-component': 'Action',
      'x-component-props': {
        type: 'link',
      },
      'x-designable-bar': 'Table.Action.DesignableBar',
      'x-action-type': 'update',
      properties: {
        [uid()]: {
          type: 'void',
          title: '编辑数据',
          'x-decorator': 'Form',
          'x-decorator-props': {
            useResource: '{{ Table.useResource }}',
            useValues: '{{ Table.useTableRowRecord }}',
          },
          'x-component': 'Action.Drawer',
          'x-component-props': {
            useOkAction: '{{ Table.useTableUpdateAction }}',
          },
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Grid',
              'x-component-props': {
                addNewComponent: 'AddNew.FormItem',
              },
            },
          },
        },
      },
    },
    destroy: {
      key: uid(),
      name: uid(),
      type: 'void',
      title: '删除',
      'x-component': 'Action',
      'x-designable-bar': 'Table.Action.DesignableBar',
      'x-action-type': 'destroy',
      'x-component-props': {
        useAction: '{{ Table.useTableDestroyAction }}',
        type: 'link',
        confirm: {
          title: '删除数据',
          content: '删除后无法恢复，确定要删除吗？',
        },
      },
    },
  };
  return actions[type];
}

function AddActionButton() {
  const [visible, setVisible] = useState(false);
  const displayed = useDisplayedMapContext();
  const { appendChild, remove } = useDesignable();
  const { schema, designable } = useDesignable();
  if (!designable || !schema['x-designable-bar']) {
    return null;
  }
  return (
    <Dropdown
      trigger={['hover']}
      visible={visible}
      onVisibleChange={setVisible}
      overlay={
        <Menu>
          <Menu.ItemGroup title={'启用操作'}>
            {[
              { title: '筛选', name: 'filter' },
              { title: '导出', name: 'export' },
              { title: '添加', name: 'create' },
              { title: '删除', name: 'destroy' },
            ].map((item) => (
              <SwitchMenuItem
                key={item.name}
                checked={displayed.has(item.name)}
                title={item.title}
                onChange={async (checked) => {
                  if (!checked) {
                    const s = displayed.get(item.name) as Schema;
                    const path = getSchemaPath(s);
                    displayed.remove(item.name);
                    const removed = remove(path);
                    await removeSchema(removed);
                  } else {
                    const s = generateActionSchema(item.name);
                    const data = appendChild(s);
                    await createSchema(data);
                  }
                }}
              />
            ))}
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.SubMenu title={'自定义'}>
            <Menu.Item style={{ minWidth: 120 }}>函数操作</Menu.Item>
            <Menu.Item>弹窗表单</Menu.Item>
            <Menu.Item>复杂弹窗</Menu.Item>
          </Menu.SubMenu>
        </Menu>
      }
    >
      <Button
        className={'designable-btn designable-btn-dash'}
        style={{ marginLeft: 8 }}
        type={'dashed'}
        icon={<SettingOutlined />}
      >
        配置操作
      </Button>
    </Dropdown>
  );
}

function Actions(props: any) {
  const { align = 'left' } = props;
  const { schema, designable } = useDesignable();
  return (
    <Droppable
      id={`${schema.name}-${align}`}
      className={`action-bar-align-${align}`}
      data={{ align, path: getSchemaPath(schema) }}
    >
      <Space>
        {schema.mapProperties((s) => {
          const currentAlign = s['x-align'] || 'left';
          if (currentAlign !== align) {
            return null;
          }
          return (
            <SortableItem
              id={s.name}
              data={{
                align,
                draggable: true,
                title: s.title,
                path: getSchemaPath(s),
              }}
            >
              <RecursionField name={s.name} schema={s} />
            </SortableItem>
          );
        })}
      </Space>
    </Droppable>
  );
}

Table.ActionBar = observer((props: any) => {
  const { align = 'top' } = props;
  // const { schema, designable } = useDesignable();
  const { root, schema, insertAfter, remove, appendChild } = useDesignable();
  const moveToAfter = (path1, path2, extra = {}) => {
    if (!path1 || !path2) {
      return;
    }
    if (path1.join('.') === path2.join('.')) {
      return;
    }
    const data = findPropertyByPath(root, path1);
    if (!data) {
      return;
    }
    remove(path1);
    return insertAfter(
      {
        ...data.toJSON(),
        ...extra,
      },
      path2,
    );
  };

  const [dragOverlayContent, setDragOverlayContent] = useState('');
  return (
    <DndContext
      onDragStart={(event) => {
        setDragOverlayContent(event.active.data?.current?.title || '');
        // const previewRef = event.active.data?.current?.previewRef;
        // if (previewRef) {
        //   setDragOverlayContent(previewRef?.current?.innerHTML);
        // } else {
        //   setDragOverlayContent('');
        // }
      }}
      onDragEnd={async (event) => {
        const path1 = event.active?.data?.current?.path;
        const path2 = event.over?.data?.current?.path;
        const align = event.over?.data?.current?.align;
        const draggable = event.over?.data?.current?.draggable;
        if (!path1 || !path2) {
          return;
        }
        if (path1.join('.') === path2.join('.')) {
          return;
        }
        if (!draggable) {
          console.log('alignalignalignalign', align);
          const p = findPropertyByPath(root, path1);
          if (!p) {
            return;
          }
          remove(path1);
          const data = appendChild(
            {
              ...p.toJSON(),
              'x-align': align,
            },
            path2,
          );
          await updateSchema(data);
        } else {
          const data = moveToAfter(path1, path2, {
            'x-align': align,
          });
          await updateSchema(data);
        }
      }}
    >
      <DragOverlay style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
        {dragOverlayContent}
        {/* <div style={{ transform: 'translateX(-100%)' }} dangerouslySetInnerHTML={{__html: dragOverlayContent}}></div> */}
      </DragOverlay>
      <DisplayedMapProvider>
        <div className={cls('nb-action-bar', `align-${align}`)}>
          <div style={{ width: '50%' }}>
            <Actions align={'left'} />
          </div>
          <div style={{ marginLeft: 'auto', width: '50%', textAlign: 'right' }}>
            <Actions align={'right'} />
          </div>
          <AddActionButton />
        </div>
      </DisplayedMapProvider>
    </DndContext>
  );
});

const fieldsToFilterColumns = (fields: any[], options: any = {}) => {
  const { fieldNames = [] } = options;
  const properties = {};
  fields.forEach((field, index) => {
    if (fieldNames?.length && !fieldNames.includes(field.name)) {
      return;
    }
    const fieldOption = interfaces.get(field.interface);
    if (!fieldOption.operations) {
      return;
    }
    properties[`column${index}`] = {
      type: 'void',
      title: field?.uiSchema?.title,
      'x-component': 'Filter.Column',
      'x-component-props': {
        operations: fieldOption.operations,
      },
      properties: {
        [field.name]: {
          ...field.uiSchema,
          'x-decorator': 'FormilyFormItem',
          title: null,
        },
      },
    };
  });
  return properties;
};

const fieldsToSortColumns = (fields: any[]) => {
  const dataSource = [];

  fields.forEach((field) => {
    const fieldOption = interfaces.get(field.interface);
    if (!fieldOption.sortable) {
      return;
    }
    dataSource.push({
      value: field.name,
      label: field?.uiSchema?.title,
    });
  });

  return dataSource;
};

Table.Filter = observer((props: any) => {
  const { service } = useTable();
  const { fieldNames = [] } = props;
  const { schema, DesignableBar } = useDesignable();
  const form = useMemo(() => createForm(), []);
  const { fields = [] } = useCollectionContext();
  const [visible, setVisible] = useState(false);
  const obj = flatten(form.values.filter || {});
  console.log('flatten', obj, Object.values(obj));
  const count = Object.values(obj).filter((i) =>
    Array.isArray(i) ? i.length : i,
  ).length;
  const icon = props.icon || 'FilterOutlined';
  const properties = fieldsToFilterColumns(fields, { fieldNames });
  schema.mapProperties((p) => {
    properties[p.name] = p;
  });
  return (
    <Popover
      trigger={['click']}
      placement={'bottomLeft'}
      visible={visible}
      onVisibleChange={setVisible}
      content={
        <div>
          <FormProvider form={form}>
            <SchemaField
              schema={{
                type: 'object',
                properties: {
                  filter: {
                    type: 'object',
                    'x-component': 'Filter',
                    properties,
                  },
                },
              }}
            />
            <FormButtonGroup align={'right'}>
              <Submit
                onSubmit={() => {
                  const { filter } = form.values;
                  console.log('Table.Filter', form.values);
                  setVisible(false);
                  return service.run({
                    ...service.params[0],
                    filter,
                  });
                }}
              >
                提交
              </Submit>
            </FormButtonGroup>
          </FormProvider>
        </div>
      }
    >
      <Button icon={<IconPicker type={icon} />}>
        {count > 0 ? `${count} 个筛选项` : schema.title}
        <DesignableBar />
      </Button>
    </Popover>
  );
});

Table.Filter.DesignableBar = () => {
  const { schema, remove, refresh, insertAfter } = useDesignable();
  const [visible, setVisible] = useState(false);
  const displayed = useDisplayedMapContext();
  const { fields } = useCollectionContext();
  const field = useField();
  let fieldNames = field.componentProps.fieldNames || [];
  if (fieldNames.length === 0) {
    fieldNames = fields.map((field) => field.name);
  }
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
      >
        <Space>
          <DragHandle />
          <Dropdown
            trigger={['hover']}
            visible={visible}
            onVisibleChange={(visible) => {
              setVisible(visible);
            }}
            overlay={
              <Menu>
                <Menu.ItemGroup title={'可筛选字段'}>
                  {fields
                    .filter((collectionField) => {
                      const option = interfaces.get(collectionField.interface);
                      return option.operations?.length;
                    })
                    .map((collectionField) => (
                      <SwitchMenuItem
                        title={collectionField?.uiSchema?.title}
                        checked={fieldNames.includes(collectionField.name)}
                        onChange={async (checked) => {
                          if (checked) {
                            fieldNames.push(collectionField.name);
                          } else {
                            const index = fieldNames.indexOf(
                              collectionField.name,
                            );
                            if (index > -1) {
                              fieldNames.splice(index, 1);
                            }
                          }
                          console.log({ fieldNames, field });
                          schema['x-component-props']['fieldNames'] =
                            fieldNames;
                          field.componentProps.fieldNames = fieldNames;
                          updateSchema(schema);
                        }}
                      />
                    ))}
                </Menu.ItemGroup>
                <Menu.Divider />
                <Menu.Item
                  onClick={async (e) => {
                    setVisible(false);
                    const values = await FormDialog('编辑按钮', () => {
                      return (
                        <FormLayout layout={'vertical'}>
                          <SchemaField
                            schema={{
                              type: 'object',
                              properties: {
                                title: {
                                  type: 'string',
                                  title: '按钮名称',
                                  required: true,
                                  'x-decorator': 'FormItem',
                                  'x-component': 'Input',
                                },
                                icon: {
                                  type: 'string',
                                  title: '按钮图标',
                                  'x-decorator': 'FormItem',
                                  'x-component': 'IconPicker',
                                },
                              },
                            }}
                          />
                        </FormLayout>
                      );
                    }).open({
                      initialValues: {
                        title: schema['title'],
                        icon: schema['x-component-props']?.['icon'],
                      },
                    });
                    schema['title'] = values.title;
                    schema['x-component-props']['icon'] = values.icon;
                    field.componentProps.icon = values.icon;
                    field.title = values.title;
                    updateSchema(schema);
                    refresh();
                  }}
                >
                  编辑按钮
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  onClick={async () => {
                    const displayName =
                      schema?.['x-decorator-props']?.['displayName'];
                    const data = remove();
                    await removeSchema(data);
                    if (displayName) {
                      displayed.remove(displayName);
                    }
                    setVisible(false);
                  }}
                >
                  隐藏
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
};

Table.ExportActionDesignableBar = () => {
  const { schema, remove, refresh, insertAfter } = useDesignable();
  const [visible, setVisible] = useState(false);
  const displayed = useDisplayedMapContext();
  const { fields } = useCollectionContext();
  const field = useField();
  let fieldNames = field.componentProps.fieldNames || [];
  if (fieldNames.length === 0) {
    fieldNames = fields.map((field) => field.name);
  }
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
      >
        <Space>
          <DragHandle />
          <Dropdown
            trigger={['hover']}
            visible={visible}
            onVisibleChange={(visible) => {
              setVisible(visible);
            }}
            overlay={
              <Menu>
                <Menu.ItemGroup title={'导出字段'}>
                  {fields.map((collectionField) => (
                    <SwitchMenuItem
                      title={collectionField?.uiSchema?.title}
                      checked={fieldNames.includes(collectionField.name)}
                      onChange={async (checked) => {
                        if (checked) {
                          fieldNames.push(collectionField.name);
                        } else {
                          const index = fieldNames.indexOf(
                            collectionField.name,
                          );
                          if (index > -1) {
                            fieldNames.splice(index, 1);
                          }
                        }
                        console.log({ fieldNames, field });
                        schema['x-component-props']['fieldNames'] = fieldNames;
                        field.componentProps.fieldNames = fieldNames;
                        updateSchema(schema);
                      }}
                    />
                  ))}
                </Menu.ItemGroup>
                <Menu.Divider />
                <Menu.Item
                  onClick={async (e) => {
                    setVisible(false);
                    const values = await FormDialog('编辑按钮', () => {
                      return (
                        <FormLayout layout={'vertical'}>
                          <SchemaField
                            schema={{
                              type: 'object',
                              properties: {
                                title: {
                                  type: 'string',
                                  title: '按钮名称',
                                  required: true,
                                  'x-decorator': 'FormItem',
                                  'x-component': 'Input',
                                },
                                icon: {
                                  type: 'string',
                                  title: '按钮图标',
                                  'x-decorator': 'FormItem',
                                  'x-component': 'IconPicker',
                                },
                              },
                            }}
                          />
                        </FormLayout>
                      );
                    }).open({
                      initialValues: {
                        title: schema['title'],
                        icon: schema['x-component-props']?.['icon'],
                      },
                    });
                    schema['title'] = values.title;
                    schema['x-component-props']['icon'] = values.icon;
                    field.componentProps.icon = values.icon;
                    field.title = values.title;
                    updateSchema(schema);
                    refresh();
                  }}
                >
                  编辑按钮
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  onClick={async () => {
                    const displayName =
                      schema?.['x-decorator-props']?.['displayName'];
                    const data = remove();
                    await removeSchema(data);
                    if (displayName) {
                      displayed.remove(displayName);
                    }
                    setVisible(false);
                  }}
                >
                  隐藏
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
};

Table.Operation = observer((props: any) => {
  const { designable, schema } = useDesignable();
  return (
    <div className={'nb-table-column'}>
      操作
      <Table.Operation.DesignableBar path={props.path} />
    </div>
  );
});

Table.Operation.Cell = observer((props: any) => {
  const ctx = useContext(TableRowContext);
  const schema = props.schema;
  return (
    <div className={'nb-table-column'}>
      <RecursionField schema={schema} name={ctx.index} onlyRenderProperties />
    </div>
  );
});

Table.Operation.DesignableBar = () => {
  const { schema: columnSchema } = useDesignable();
  const groupSchema = Object.values(columnSchema.properties || {}).shift();
  const groupPath = getSchemaPath(groupSchema);
  const { schema, remove, refresh, appendChild } = useDesignable(groupPath);
  const [visible, setVisible] = useState(false);
  const map = new Map();
  schema.mapProperties((s) => {
    if (!s['x-action-type']) {
      return;
    }
    map.set(s['x-action-type'], s.name);
  });
  const path = getSchemaPath(schema);
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
      >
        <Space>
          <DragHandle />
          <Dropdown
            trigger={['hover']}
            visible={visible}
            onVisibleChange={(visible) => {
              setVisible(visible);
            }}
            overlay={
              <Menu>
                <Menu.ItemGroup title={'启用操作'}>
                  {[
                    { title: '查看', name: 'view' },
                    { title: '编辑', name: 'update' },
                    { title: '删除', name: 'destroy' },
                  ].map((item) => (
                    <SwitchMenuItem
                      key={item.name}
                      title={item.title}
                      checked={map.has(item.name)}
                      onChange={async (checked) => {
                        if (checked) {
                          const s = generateMenuActionSchema(item.name);
                          const data = appendChild(s);
                          await createSchema(data);
                        } else if (map.get(item.name)) {
                          const removed = remove([...path, map.get(item.name)]);
                          await removeSchema(removed);
                        }
                      }}
                    />
                  ))}
                </Menu.ItemGroup>
                <Menu.Divider />
                <Menu.SubMenu disabled title={'自定义'}>
                  <Menu.Item style={{ minWidth: 120 }}>函数操作</Menu.Item>
                  <Menu.Item>弹窗表单</Menu.Item>
                  <Menu.Item>复杂弹窗</Menu.Item>
                </Menu.SubMenu>
              </Menu>
            }
          >
            <MenuOutlined />
          </Dropdown>
        </Space>
      </span>
    </div>
  );
};

Table.Action = () => null;

Table.Action.DesignableBar = () => {
  const { schema, remove, refresh, insertAfter } = useDesignable();
  const [visible, setVisible] = useState(false);
  const isPopup = Object.keys(schema.properties || {}).length > 0;
  const popupSchema = Object.values(schema.properties || {}).shift();
  const inActionBar = schema.parent['x-component'] === 'Table.ActionBar';
  const displayed = useDisplayedMapContext();
  const field = useField();
  const popupComponent = popupSchema?.['x-component'] || 'Action.Drawer';
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
      >
        <Space>
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
                  onClick={async (e) => {
                    setVisible(false);
                    const values = await FormDialog('编辑按钮', () => {
                      return (
                        <FormLayout layout={'vertical'}>
                          <SchemaField
                            schema={{
                              type: 'object',
                              properties: {
                                title: {
                                  type: 'string',
                                  title: '按钮名称',
                                  required: true,
                                  'x-decorator': 'FormItem',
                                  'x-component': 'Input',
                                },
                                icon: {
                                  type: 'string',
                                  title: '按钮图标',
                                  'x-decorator': 'FormItem',
                                  'x-component': 'IconPicker',
                                },
                              },
                            }}
                          />
                        </FormLayout>
                      );
                    }).open({
                      initialValues: {
                        title: schema['title'],
                        icon: schema['x-component-props']?.['icon'],
                      },
                    });
                    schema['title'] = values.title;
                    schema['x-component-props']['icon'] = values.icon;
                    field.componentProps.icon = values.icon;
                    field.title = values.title;
                    updateSchema(schema);
                    refresh();
                  }}
                >
                  编辑按钮
                </Menu.Item>
                {isPopup && (
                  <Menu.Item>
                    在{' '}
                    <Select
                      bordered={false}
                      size={'small'}
                      defaultValue={popupComponent}
                      style={{ width: 100 }}
                      onChange={(value) => {
                        const s = Object.values(schema.properties).shift();
                        s['x-component'] = value;
                        refresh();
                        updateSchema(s);
                        // const f = field.query(getSchemaPath(s)).take()
                        // console.log('fffffff', { schema, f });
                      }}
                    >
                      <Select.Option value={'Action.Modal'}>
                        对话框
                      </Select.Option>
                      <Select.Option value={'Action.Drawer'}>
                        抽屉
                      </Select.Option>
                      <Select.Option value={'Action.Window'}>
                        窗口
                      </Select.Option>
                    </Select>{' '}
                    内打开
                  </Menu.Item>
                )}
                {!inActionBar && (
                  <Menu.Item>
                    点击表格行时触发 &nbsp;&nbsp;
                    <Switch size={'small'} defaultChecked />
                  </Menu.Item>
                )}
                <Menu.Divider />
                <Menu.Item
                  onClick={async () => {
                    const displayName =
                      schema?.['x-decorator-props']?.['displayName'];
                    const data = remove();
                    await removeSchema(data);
                    if (displayName) {
                      displayed.remove(displayName);
                    }
                    setVisible(false);
                  }}
                >
                  隐藏
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
};

Table.Cell = observer((props: any) => {
  const ctx = useContext(TableRowContext);
  const schema = props.schema;
  const collectionField = useContext(CollectionFieldContext);
  if (schema['x-component'] === 'Table.Operation') {
    return <Table.Operation.Cell {...props} />;
  }
  let uiSchema = collectionField?.uiSchema as Schema;
  if (uiSchema?.['x-component'] === 'Upload.Attachment') {
    uiSchema = cloneDeepWith(uiSchema);
    set(uiSchema, 'x-component-props.size', 'small');
  }
  return (
    <div className={`field-interface-${collectionField?.interface}`}>
      <RecursionField
        schema={
          !collectionField
            ? schema
            : new Schema({
                type: 'void',
                properties: {
                  [collectionField.name]: {
                    ...uiSchema,
                    title: undefined,
                    'x-read-pretty': true,
                    'x-decorator-props': {
                      feedbackLayout: 'popover',
                    },
                    'x-decorator': 'FormilyFormItem',
                    properties: {
                      ...schema?.properties,
                    },
                  },
                },
              })
        }
        name={ctx.index}
        onlyRenderProperties
      />
    </div>
  );
});

Table.Column = observer((props: any) => {
  const collectionField = useContext(CollectionFieldContext);
  const { schema, DesignableBar } = useDesignable();
  const displayed = useDisplayedMapContext();
  useEffect(() => {
    if (collectionField?.name) {
      displayed.set(collectionField.name, schema);
    }
  }, [collectionField, schema]);
  return (
    <div className={'nb-table-column'}>
      {schema.title || collectionField?.uiSchema?.title}
      <DesignableBar />
    </div>
  );
});

Table.Column.DesignableBar = () => {
  const field = useField();
  // const fieldSchema = useFieldSchema();
  const { schema, remove, refresh, insertAfter } = useDesignable();
  const [visible, setVisible] = useState(false);
  const displayed = useDisplayedMapContext();
  const collectionField = useContext(CollectionFieldContext);
  console.log('displayed.map', displayed.map);
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
      >
        <Space>
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
                  onClick={async (e) => {
                    setVisible(false);
                    const values = await FormDialog('自定义列名称', () => {
                      return (
                        <FormLayout layout={'vertical'}>
                          <SchemaField
                            schema={{
                              type: 'object',
                              properties: {
                                fieldName: {
                                  type: 'string',
                                  title: '原字段名称',
                                  'x-read-pretty': true,
                                  'x-decorator': 'FormItem',
                                  'x-component': 'Input',
                                },
                                title: {
                                  type: 'string',
                                  title: '自定义列名称',
                                  'x-decorator': 'FormItem',
                                  'x-component': 'Input',
                                },
                              },
                            }}
                          />
                        </FormLayout>
                      );
                    }).open({
                      initialValues: {
                        fieldName: collectionField?.uiSchema?.title,
                        title: schema['title'],
                      },
                    });
                    const title = values.title || null;
                    field.title = title;
                    schema.title = title;
                    refresh();
                    await updateSchema({
                      key: schema['key'],
                      title: title,
                    });
                  }}
                >
                  自定义列名称
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  onClick={async () => {
                    const fieldName =
                      schema['x-component-props']?.['fieldName'];
                    displayed.remove(fieldName);
                    schema['x-hidden'] = true;
                    refresh();
                    await updateSchema({
                      key: schema['key'],
                      ['x-hidden']: true,
                    });
                    // const s = remove();
                    // await removeSchema(s);
                  }}
                >
                  隐藏
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
};

Table.Index = observer(() => {
  const index = useTableIndex();
  return <span className={'nb-table-index'}>{index + 1}</span>;
});

Table.SortHandle = observer((props: any) => {
  return <SortableRowHandle {...props} />;
});

Table.DesignableBar = observer((props) => {
  const field = useField();
  const { schema, refresh, deepRemove } = useDesignable();
  const [visible, setVisible] = useState(false);
  const { dragRef } = useContext(DraggableBlockContext);
  const defaultPageSize =
    field?.componentProps?.pagination?.defaultPageSize || 10;
  const collectionName = field?.componentProps?.collectionName;
  const { collection, fields } = useCollection({ collectionName });
  console.log({ collectionName });
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <div className={'designable-info'}>
        {collection?.title || collection?.name}
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
            // visible={visible}
            // onVisibleChange={(visible) => {
            //   setVisible(visible);
            // }}
            overlay={
              <Menu>
                <Menu.Item
                  key={'showIndex'}
                  onClick={() => {
                    const bool = !field.componentProps.showIndex;
                    schema['x-component-props']['showIndex'] = bool;
                    field.componentProps.showIndex = bool;
                    updateSchema(schema);
                  }}
                >
                  <div className={'nb-space-between'}>
                    显示序号{' '}
                    <Switch
                      size={'small'}
                      checked={field.componentProps.showIndex}
                    />
                  </div>
                </Menu.Item>
                <Menu.Item
                  key={'dragSort'}
                  onClick={() => {
                    const dragSort = field.componentProps.dragSort
                      ? false
                      : 'sort';
                    schema['x-component-props']['dragSort'] = dragSort;
                    field.componentProps.dragSort = dragSort;
                    updateSchema(schema);
                  }}
                >
                  <div className={'nb-space-between'}>
                    启用拖拽排序{' '}
                    <Switch
                      size={'small'}
                      checked={field.componentProps.dragSort}
                    />
                  </div>
                </Menu.Item>
                {!field.componentProps.dragSort && (
                  <Menu.Item
                    key={'defaultSort'}
                    onClick={async () => {
                      const defaultSort =
                        field.componentProps?.defaultSort?.map(
                          (item: string) => {
                            return item.startsWith('-')
                              ? {
                                  field: item.substring(1),
                                  direction: 'desc',
                                }
                              : {
                                  field: item,
                                  direction: 'asc',
                                };
                          },
                        );
                      const values = await FormDialog('设置默认排序', () => {
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
                                              'x-component':
                                                'ArrayItems.SortHandle',
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
                                                { label: '正序', value: 'asc' },
                                                {
                                                  label: '倒序',
                                                  value: 'desc',
                                                },
                                              ],
                                            },
                                            remove: {
                                              type: 'void',
                                              'x-decorator': 'FormItem',
                                              'x-component':
                                                'ArrayItems.Remove',
                                            },
                                          },
                                        },
                                      },
                                    },
                                    properties: {
                                      add: {
                                        type: 'void',
                                        title: '添加排序字段',
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
                        return item.direction === 'desc'
                          ? `-${item.field}`
                          : item.field;
                      });
                      schema['x-component-props']['defaultSort'] = sort;
                      field.componentProps.defaultSort = sort;
                      await updateSchema(schema);
                      console.log('defaultSort', sort);
                    }}
                  >
                    设置默认排序
                  </Menu.Item>
                )}
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
                    Modal.confirm({
                      title: '删除区块',
                      content: '删除后无法恢复，确定要删除吗？',
                      onOk: async () => {
                        const removed = deepRemove();
                        // console.log({ removed })
                        const last = removed.pop();
                        await removeSchema(last);
                      },
                    });
                  }}
                >
                  删除
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

Table.useResource = ({ onSuccess, manual = true }) => {
  const { props } = useTable();
  const { collection } = useCollectionContext();
  const ctx = useContext(TableRowContext);
  const resource = Resource.make({
    resourceName: collection?.name || props.collectionName,
    resourceKey: ctx.record[props.rowKey],
  });
  const { schema } = useDesignable();
  const fieldFields = (schema: Schema) => {
    const names = [];
    schema.reduceProperties((buf, current) => {
      if (current['x-component'] === 'Form.Field') {
        const fieldName = current['x-component-props']?.['fieldName'];
        if (fieldName) {
          buf.push(fieldName);
        }
      } else {
        const fieldNames = fieldFields(current);
        buf.push(...fieldNames);
      }
      return buf;
    }, names);
    return names;
  };
  console.log(
    'collection?.name || props.collectionName',
    collection?.name || props.collectionName,
    // fieldFields(schema),
  );
  const service = useRequest(
    (params?: any) => {
      console.log('Table.useResource', params);
      return resource.get({ ...params, appends: fieldFields(schema) });
    },
    {
      formatResult: (result) => result?.data,
      onSuccess,
      manual,
    },
  );
  return { resource, service, initialValues: service.data, ...service };
};

Table.useActionLogDetailsResource = ({ onSuccess }) => {
  const { props } = useTable();
  const { collection } = useCollectionContext();
  const ctx = useContext(TableRowContext);
  const resource = Resource.make({
    resourceName: 'action_logs',
    resourceKey: ctx.record[props.rowKey],
  });
  const service = useRequest(
    (params?: any) => {
      return resource.get({
        ...params,
        appends: ['changes', 'user', 'collection'],
      });
    },
    {
      formatResult: (result) => result?.data,
      onSuccess,
      manual: true,
    },
  );
  const [visible] = useContext(VisibleContext);

  useEffect(() => {
    if (visible) {
      service.run({});
    }
  }, [visible]);

  return { resource, service, initialValues: service.data, ...service };
};

const useActionLogsResource = (options: any = {}) => {
  const { props } = useTable();
  const ctx = useContext(TableRowContext);

  class ActionLogoResource extends Resource {
    list(options?: ListOptions) {
      console.log({ options });
      let defaultFilter = options?.defaultFilter;
      if (ctx?.record) {
        const extra = {
          index: ctx?.record?.id,
          collection_name: props.collectionName,
        };
        if (defaultFilter) {
          defaultFilter = { and: [defaultFilter, extra] };
        } else {
          defaultFilter = extra;
        }
      }
      return super.list({ ...options, defaultFilter });
    }
  }

  const resource = ActionLogoResource.make('action_logs');

  return {
    resource,
  };
};

Table.useActionLogsResource = useActionLogsResource;
Table.useTableFilterAction = useTableFilterAction;
Table.useTableCreateAction = useTableCreateAction;
Table.useTableUpdateAction = useTableUpdateAction;
Table.useTableDestroyAction = useTableDestroyAction;
Table.useTableExportAction = useTableExportAction;
Table.useTableIndex = useTableIndex;
Table.useTableRowRecord = useTableRowRecord;
Table.SimpleDesignableBar = SimpleDesignableBar;
