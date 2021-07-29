import {
  observer,
  RecursionField,
  Schema,
  useField,
  useForm,
} from '@formily/react';
import { Pagination, Table as AntdTable } from 'antd';
import { findIndex, forIn, range, set } from 'lodash';
import React, { Fragment, useEffect, useState } from 'react';
import { useContext } from 'react';
import { createContext } from 'react';
import { useDesignable, updateSchema, removeSchema, createSchema } from '..';
import { uid } from '@formily/shared';
import useRequest from '@ahooksjs/use-request';
import { BaseResult } from '@ahooksjs/use-request/lib/types';
import cls from 'classnames';
import { MenuOutlined, DragOutlined } from '@ant-design/icons';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Select, Dropdown, Menu, Switch, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import './style.less';
import { getSchemaPath } from '../../components/schema-renderer';
import { options } from '../database-field/interfaces';
import { DraggableBlockContext } from '../../components/drag-and-drop';
import AddNew from '../add-new';
import { isGridRowOrCol } from '../grid';
import { Resource } from '../../resource';
import {
  CollectionProvider,
  DisplayedMapProvider,
  useCollectionContext,
  useDisplayedMapContext,
} from '../../constate';

const SyntheticListenerMapContext = createContext(null);

function DragableBodyRow(props: any) {
  const {
    className,
    style: prevStyle,
    ['data-row-key']: dataRowKey,
    ...others
  } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    overIndex,
    transform,
    transition,
  } = useSortable({ id: dataRowKey });

  const style = {
    ...prevStyle,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <SyntheticListenerMapContext.Provider value={listeners}>
      <tr
        className={cls(className)}
        ref={setNodeRef}
        {...others}
        {...attributes}
        style={style}
      >
        {props.children}
      </tr>
    </SyntheticListenerMapContext.Provider>
  );
}

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

const TableConetxt = createContext<ITableContext>(null);
const TableRowContext = createContext<ITableRowContext>(null);
const CollectionFieldContext = createContext(null);

const useTable = () => {
  return useContext(TableConetxt);
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
  return {
    async run() {
      if (refreshRequestOnChange) {
        return service.refresh();
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

  return {
    async run() {
      if (refreshRequestOnChange) {
        await resource.save(form.values, {
          resourceKey: ctx.record[rowKey],
        });
        return service.refresh();
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

const useTableRowRecord = () => {
  const ctx = useContext(TableRowContext);
  return ctx.record;
};

const useTableIndex = () => {
  const { pagination, props } = useTable();
  const ctx = useContext(TableRowContext);
  if (pagination && !props.clientSidePagination) {
    const { pageSize, page } = pagination;
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

const useTableColumns = () => {
  const {
    field,
    schema,
    props: { rowKey },
  } = useTable();

  const { getField } = useCollectionContext();

  const columns = schema.reduceProperties((columns, current) => {
    if (current['x-component'] === 'Table.Column') {
      return [...columns, current];
    }
    return [...columns];
  }, []);

  return columns
    .map((column: Schema) => {
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
    })
    .concat([
      {
        title: <AddColumn />,
        dataIndex: 'addnew',
      },
    ]);
};

function SwitchField(props) {
  const { field, onChange } = props;
  const [checked, setChecked] = useState(props.checked);
  useEffect(() => {
    setChecked(props.checked);
  }, [props.checked]);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      onClick={async () => {
        setChecked((checked) => {
          onChange(!checked);
          return !checked;
        });
      }}
    >
      <span>{field.uiSchema.title}</span>
      <Switch checked={checked} size={'small'} />
    </div>
  );
}

function AddColumn() {
  const [visible, setVisible] = useState(false);
  const { appendChild, remove } = useDesignable();
  const { fields } = useCollectionContext();
  const displayed = useDisplayedMapContext();

  return (
    <Dropdown
      trigger={['click']}
      visible={visible}
      onVisibleChange={setVisible}
      overlay={
        <Menu>
          <Menu.ItemGroup className={'display-fields'} title={'要展示的字段'}>
            {fields.map((field) => (
              <Menu.Item style={{ minWidth: 150 }}>
                <SwitchField
                  checked={displayed.has(field.name)}
                  field={field}
                  onChange={async (checked) => {
                    if (checked) {
                      const data = appendChild({
                        type: 'void',
                        'x-component': 'Table.Column',
                        'x-component-props': {
                          fieldName: field.name,
                        },
                        'x-designable-bar': 'Table.Column.DesignableBar',
                      });
                      await createSchema(data);
                    } else {
                      const s: any = displayed.get(field.name);
                      const p = getSchemaPath(s);
                      const removed = remove(p);
                      await removeSchema(removed);
                      displayed.remove(field.name);
                    }
                  }}
                />
              </Menu.Item>
            ))}
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.SubMenu
            popupClassName={'add-new-fields-popup'}
            title={'新增字段'}
          >
            {options.map((option) => (
              <Menu.ItemGroup title={option.label}>
                {option.children.map((item) => (
                  <Menu.Item
                    style={{ minWidth: 150 }}
                    key={item.name}
                    onClick={async () => {}}
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
      <Button size={'small'} type={'dashed'} icon={<PlusOutlined />}></Button>
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
    selectedRowKeys,
    setSelectedRowKeys,
    service,
    field,
    props: { rowKey, dragSort, showIndex },
  } = useTable();
  const columns = useTableColumns();
  const dataSource = useDataSource();
  const actionBars = useTableActionBars();
  return (
    <div className={'nb-table'}>
      <DndContext
        onDragEnd={(event) => {
          console.log({ event });
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
        <SortableContext items={dataSource}>
          <AntdTable
            pagination={false}
            onChange={(pagination) => {}}
            loading={service?.loading}
            rowKey={rowKey}
            dataSource={dataSource}
            columns={columns}
            components={{
              body: {
                row: DragableBodyRow,
              },
            }}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys,
              onChange: (rowKeys) => {
                setSelectedRowKeys(rowKeys);
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

const usePagination = (paginationProps?: any) => {
  return useState(() => {
    if (!paginationProps) {
      return false;
    }
    return { page: 1, pageSize: 10, ...paginationProps };
  });
};

export const Table: any = observer((props: any) => {
  const { rowKey = 'id', dataRequest, ...others } = props;
  const { schema } = useDesignable();
  const field = useField<Formily.Core.Models.ArrayField>();
  const [pagination, setPagination] = usePagination(props.pagination);
  const [selectedRowKeys, setSelectedRowKeys] = useState<any>([]);
  const [, refresh] = useState(uid());
  const resource = Resource.make(props.resource);
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
      defaultParams: [{ ...pagination }],
    },
  );
  console.log('refresh', { pagination });
  return (
    <TableConetxt.Provider
      value={{
        resource,
        refresh: () => {
          const { page = 1, pageSize } = pagination;
          const total = props.clientSidePagination
            ? field?.value?.length
            : service?.data?.total;
          const maxPage = Math.ceil(total / pageSize);
          if (page > maxPage) {
            setPagination((prev) => ({ ...prev, page: maxPage }));
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
      <CollectionProvider collectionName={props.collectionName}>
        <DisplayedMapProvider>
          <TableMain />
        </DisplayedMapProvider>
      </CollectionProvider>
    </TableConetxt.Provider>
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
  const { field, service, pagination, setPagination, props } = useTable();
  if (!pagination || Object.keys(pagination).length === 0) {
    return null;
  }
  const { clientSidePagination } = props;
  const total = useTotal();
  const { page = 1 } = pagination;
  return (
    <div>
      <Pagination
        {...pagination}
        showSizeChanger
        current={page}
        total={total}
        onChange={(current, pageSize) => {
          const page = pagination.pageSize !== pageSize ? 1 : current;
          setPagination((prev) => ({
            ...prev,
            page,
            pageSize,
          }));
          if (clientSidePagination) {
            return;
          }
          service.run({
            ...service.params,
            page,
            pageSize,
          });
        }}
      />
    </div>
  );
});

function AddActionButton() {
  const [visible, setVisible] = useState(false);
  return (
    <Dropdown
      trigger={['click']}
      visible={visible}
      onVisibleChange={setVisible}
      overlay={
        <Menu>
          <Menu.ItemGroup title={'要展示的操作'}>
            {[
              { title: '筛选', key: 'filter' },
              { title: '导出', key: 'export' },
              { title: '新增', key: 'create' },
              { title: '删除', key: 'destroy' },
            ].map((item) => (
              <Menu.Item style={{ minWidth: 150 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{item.title}</span>
                  <Switch size={'small'} defaultChecked />
                </div>
              </Menu.Item>
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
      <Button type={'dashed'} icon={<PlusOutlined />}>
        配置操作
      </Button>
    </Dropdown>
  );
}

Table.ActionBar = observer((props: any) => {
  const { align = 'top' } = props;
  const { schema, designable } = useDesignable();
  const designableBar = schema['x-designable-bar'];
  console.log('Table.ActionBar', schema);
  return (
    <div className={cls('nb-action-bar', `align-${align}`)}>
      <Space>
        {props.children}
        {designable && designableBar && <AddActionButton />}
      </Space>
    </div>
  );
});

Table.Action = () => null;

Table.Action.DesignableBar = () => {
  const { schema, remove, refresh, insertAfter } = useDesignable();
  const [visible, setVisible] = useState(false);
  const isPopup = Object.keys(schema.properties || {}).length > 0;
  const inActionBar = schema.parent['x-component'] === 'Table.ActionBar';

  return (
    <div className={cls('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
      >
        <Dropdown
          trigger={['click']}
          visible={visible}
          onVisibleChange={(visible) => {
            setVisible(visible);
          }}
          overlay={
            <Menu>
              <Menu.Item
                onClick={(e) => {
                  schema.title = uid();
                  refresh();
                }}
              >
                修改名称和图标
              </Menu.Item>
              {isPopup && (
                <Menu.Item>
                  在{' '}
                  <Select
                    bordered={false}
                    size={'small'}
                    defaultValue={'modal'}
                  >
                    <Select.Option value={'modal'}>对话框</Select.Option>
                    <Select.Option value={'drawer'}>抽屉</Select.Option>
                    <Select.Option value={'window'}>浏览器窗口</Select.Option>
                  </Select>{' '}
                  内打开
                </Menu.Item>
              )}
              {inActionBar ? (
                <Menu.Item>放置在右侧</Menu.Item>
              ) : (
                <Menu.Item>
                  点击表格行时触发 &nbsp;&nbsp;
                  <Switch size={'small'} defaultChecked />
                </Menu.Item>
              )}

              <Menu.Divider />
              <Menu.Item>删除</Menu.Item>
            </Menu>
          }
        >
          <MenuOutlined />
        </Dropdown>
      </span>
    </div>
  );
};

Table.Cell = observer((props: any) => {
  const ctx = useContext(TableRowContext);
  const schema = props.schema;
  const collectionField = useContext(CollectionFieldContext);
  return (
    <RecursionField
      schema={
        !collectionField
          ? schema
          : new Schema({
              type: 'void',
              properties: {
                [collectionField.name]: {
                  ...collectionField.uiSchema,
                  title: undefined,
                  'x-read-pretty': true,
                  'x-decorator-props': {
                    feedbackLayout: 'popover',
                  },
                  'x-decorator': 'FormilyFormItem',
                },
              },
            })
      }
      name={ctx.index}
      onlyRenderProperties
    />
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
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
      >
        <Dropdown
          trigger={['click']}
          visible={visible}
          onVisibleChange={(visible) => {
            setVisible(visible);
          }}
          overlay={
            <Menu>
              <Menu.Item
                onClick={async (e) => {
                  const title = uid();
                  field.title = title;
                  schema.title = title;
                  refresh();
                  await updateSchema({
                    key: schema['key'],
                    title: title,
                  });
                  setVisible(false);
                }}
              >
                编辑列
              </Menu.Item>
              <Menu.Item
                onClick={async () => {
                  const s = remove();
                  const fieldName = schema['x-component-props']?.['fieldName'];
                  displayed.remove(fieldName);
                  await removeSchema(s);
                }}
              >
                删除列
              </Menu.Item>
            </Menu>
          }
        >
          <MenuOutlined />
        </Dropdown>
      </span>
    </div>
  );
};

Table.Index = observer(() => {
  const index = useTableIndex();
  return <span className={'nb-table-index'}>{index + 1}</span>;
});

Table.SortHandle = observer((props: any) => {
  const listeners = useContext(SyntheticListenerMapContext);
  const { className, ...others } = props;

  return (
    <MenuOutlined
      {...listeners}
      className={cls(`nb-table-sort-handle`, className)}
      {...others}
    />
  );
});

Table.DesignableBar = observer((props) => {
  const field = useField();
  const { designable, schema, refresh, deepRemove } = useDesignable();
  const [visible, setVisible] = useState(false);
  const { dragRef } = useContext(DraggableBlockContext);
  if (!designable) {
    return null;
  }
  const defaultPageSize =
    schema['x-component-props']?.['pagination']?.['defaultPageSize'] || 20;
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
          {dragRef && <DragOutlined ref={dragRef} />}
          <Dropdown
            trigger={['click']}
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
                  }}
                >
                  {field.componentProps.showIndex ? '隐藏序号' : '显示序号'}
                </Menu.Item>
                <Menu.Item
                  key={'dragSort'}
                  onClick={() => {
                    const dragSort = field.componentProps.dragSort
                      ? false
                      : 'sort';
                    schema['x-component-props']['dragSort'] = dragSort;
                    field.componentProps.dragSort = dragSort;
                  }}
                >
                  {field.componentProps.dragSort
                    ? '禁用拖拽排序'
                    : '启用拖拽排序'}
                </Menu.Item>
                {!field.componentProps.dragSort && (
                  <Menu.Item key={'defaultSort'}>默认排序</Menu.Item>
                )}
                <Menu.Item key={'defaultFilter'}>筛选范围</Menu.Item>
                <Menu.Item key={'defaultPageSize'}>
                  每页默认显示{' '}
                  <Select
                    bordered={false}
                    size={'small'}
                    onChange={(value) => {
                      const componentProps = schema['x-component-props'] || {};
                      set(componentProps, 'pagination.defaultPageSize', value);
                      schema['x-component-props'] = componentProps;
                      refresh();
                    }}
                    defaultValue={defaultPageSize}
                  >
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
                  删除当前区块
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

Table.useTableFilterAction = useTableFilterAction;
Table.useTableCreateAction = useTableCreateAction;
Table.useTableUpdateAction = useTableUpdateAction;
Table.useTableDestroyAction = useTableDestroyAction;
Table.useTableIndex = useTableIndex;
Table.useTableRowRecord = useTableRowRecord;
