import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  useFieldSchema,
  Schema,
  observer,
  RecursionField,
  useField,
  useForm,
  FormProvider,
  createSchemaField,
  SchemaOptionsContext,
} from '@formily/react';
import {
  Button,
  Pagination,
  PaginationProps,
  Space,
  Spin,
  Table as AntdTable,
  Dropdown,
  Menu,
  Select,
  Switch,
} from 'antd';
import { cloneDeep, findIndex, get, set } from 'lodash';
import constate from 'constate';
import useRequest from '@ahooksjs/use-request';
import { uid, clone } from '@formily/shared';
import {
  EllipsisOutlined,
  MenuOutlined,
  DragOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  SortableHandle,
  SortableContainer,
  SortableElement,
} from 'react-sortable-hoc';
import cls from 'classnames';
import {
  createSchema,
  getSchemaPath,
  removeSchema,
  ResourceContextProvider,
  updateSchema,
  useCollectionContext,
  useDesignable,
  useResourceContext,
  useSchemaPath,
  VisibleContext,
} from '../';
import './style.less';
import { DraggableBlockContext } from '../../components/drag-and-drop';
import AddNew from '../add-new';
import { isGridRowOrCol } from '../grid';
import { options } from '../database-field/interfaces';
import { Resource } from '../../resource';
import { DisplayFieldsContextProvider, useDisplayFieldsContext } from '../form';

interface TableRowProps {
  index: number;
  data: any;
}

const SortableRow = SortableElement((props: any) => <tr {...props} />);
const SortableBody = SortableContainer((props: any) => <tbody {...props} />);

const TableRowContext = createContext<TableRowProps>(null);

function usePaginationProps() {
  const schema = useFieldSchema();

  function findPagination(schema: Schema): Schema[] {
    return schema.reduceProperties((columns, current) => {
      if (current['x-component'] === 'Table.Pagination') {
        return [...columns, current];
      }
      return [...columns, ...findPagination(current)];
    }, []);
  }

  const pagination = findPagination(schema).shift();

  if (pagination) {
    // console.log({ pagination });
    const props = pagination['x-component-props'] || {};
    return { defaultCurrent: 1, defaultPageSize: 10, ...props };
  }

  return false;
}

function useDefaultAction() {
  const schema = useFieldSchema();

  function findDefaultAction(schema: Schema): Schema[] {
    return schema.reduceProperties((columns, current) => {
      if (current['x-default-action']) {
        return [...columns, current];
      }
      return [...columns, ...findDefaultAction(current)];
    }, []);
  }

  return findDefaultAction(schema).shift();
}

function useTableActionBars() {
  const schema = useFieldSchema();

  function findActionBars(schema: Schema) {
    const actionBars = {
      top: [],
      bottom: [],
    };
    return schema.reduceProperties((bars, current) => {
      if (current['x-component'] === 'Table.ActionBar') {
        const align = current['x-component-props']?.['align'] || 'top';
        bars[align].push(current);

        return bars;
      }

      const nested = findActionBars(current);

      Object.keys(nested).forEach((align) => {
        bars[align].push(...nested[align]);
      });

      return bars;
    }, actionBars);
  }

  return findActionBars(schema);
}

const ResourceFieldContext = createContext(null);

function useTableColumns(props?: any) {
  const { schema, designable } = useDesignable();
  // const schema = useFieldSchema();
  const { dataSource, rowKey = 'id' } = props || {};
  const { resource = {} } = useResourceContext();

  function findColumns(schema: Schema): Schema[] {
    return schema.reduceProperties((columns, current) => {
      if (current['x-component'] === 'Table.Column') {
        return [...columns, current];
      }
      return [...columns, ...findColumns(current)];
    }, []);
  }

  const columns = findColumns(schema).map((item) => {
    const columnProps = item['x-component-props'] || {};
    console.log(item);
    const resourceField = columnProps.fieldName
      ? resource?.fields?.find((item) => item.name === columnProps.fieldName)
      : null;

    return {
      title: (
        <ResourceFieldContext.Provider value={resourceField}>
          <RecursionField name={item.name} schema={item} onlyRenderSelf />
        </ResourceFieldContext.Provider>
      ),
      dataIndex: item.name,
      ...columnProps,
      render(value, record, recordIndex) {
        const index = findIndex(
          dataSource,
          (item) => item[rowKey] === record[rowKey],
        );
        console.log({ dataSource, record, index });
        return (
          <ResourceFieldContext.Provider value={resourceField}>
            <TableRowContext.Provider
              value={{
                index: index,
                data: record,
              }}
            >
              <Table.Cell schema={item} />
            </TableRowContext.Provider>
          </ResourceFieldContext.Provider>
        );
      },
    };
  });

  // columns.unshift({
  //   title: '',
  //   className: 'nb-table-operation',
  //   dataIndex: 'operation',
  //   render(value, record, recordIndex) {
  //     const index = dataSource.indexOf(record);
  //     return (
  //       <TableRowContext.Provider
  //         value={{
  //           index: index,
  //           data: record,
  //         }}
  //       >
  //         <Table.Operation />
  //       </TableRowContext.Provider>
  //     );
  //   },
  // });

  designable &&
    columns.push({
      title: <AddColumn />,
      dataIndex: 'addnew',
    });

  return columns;
}

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
  const { resource = {}, refresh } = useResourceContext();
  const { hasDisplayField, removeDisplayField, getDisplayField } =
    useDisplayFieldsContext();

  return (
    <Dropdown
      trigger={['click']}
      visible={visible}
      onVisibleChange={setVisible}
      overlay={
        <Menu>
          <Menu.ItemGroup className={'display-fields'} title={'要展示的字段'}>
            {resource?.fields?.map((field) => (
              <Menu.Item style={{ minWidth: 150 }}>
                <SwitchField
                  checked={hasDisplayField(field.name)}
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
                      const s: any = getDisplayField(field.name);
                      const p = getSchemaPath(s);
                      const removed = remove(p);
                      await removeSchema(removed);
                      removeDisplayField(field.name);
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

export function useTableRow() {
  const ctx = useContext(TableRowContext);
  console.log('useTableRow', ctx.data);
  return ctx.data;
}

export function useTableIndex() {
  const {
    params: { page, pageSize },
  } = useTableContext();
  const ctx = useContext(TableRowContext);
  const field = useField();
  if (!field.componentProps.isRemoteDataSource) {
    return ctx.index;
  }
  return pageSize ? ctx.index + (page - 1) * pageSize : ctx.index;
}

export function useTableDestroyAction() {
  const ctx = useContext(TableRowContext);
  const { resource, field, selectedRowKeys, setSelectedRowKeys, refresh } =
    useTableContext();
  const rowKey = field.componentProps.rowKey || 'id';

  return {
    async run() {
      if (ctx && typeof ctx.index !== 'undefined') {
        // field.remove(ctx.index);
        await resource.destroy({
          [rowKey]: ctx.data[rowKey],
        });
        await refresh();
        return;
      }
      if (!selectedRowKeys.length) {
        return;
      }
      await resource.destroy({
        [`${rowKey}.in`]: selectedRowKeys,
      });
      // while (selectedRowKeys.length) {
      //   const key = selectedRowKeys.shift();
      //   const index = findIndex(field.value, (item) => item[rowKey] === key);
      //   field.remove(index);
      // }
      refresh();
      setSelectedRowKeys([]);
    },
  };
}

export function useTableFilterAction() {
  const { field, refresh, params } = useTableContext();
  const [, setVisible] = useContext(VisibleContext);
  const form = useForm();
  return {
    async run() {
      setVisible && setVisible(false);
      refresh();
    },
  };
}

export function useTableCreateAction() {
  const { resource, field, run: exec, params, refresh } = useTableContext();
  const [, setVisible] = useContext(VisibleContext);
  const form = useForm();
  return {
    async run() {
      setVisible && setVisible(false);
      await resource.save(form.values);
      // await refresh();
      // field.push({
      //   key: uid(),
      //   ...clone(form.values),
      // });
      form.reset();
      exec({ ...params, page: 1 });
    },
  };
}

export function useTableUpdateAction() {
  const { resource, field, refresh, params } = useTableContext();
  const [, setVisible] = useContext(VisibleContext);
  const ctx = useContext(TableRowContext);
  const form = useForm();
  return {
    async run() {
      setVisible && setVisible(false);
      await resource.save(form.values, {
        resourceKey: form.values[field.componentProps.rowKey || 'id'],
      });
      refresh();
    },
  };
}

const [TableContextProvider, useTableContext] = constate(() => {
  const field = useField<Formily.Core.Models.ArrayField>();
  const schema = useFieldSchema();
  const defaultSelectedRowKeys = useContext(SelectedRowKeysContext);
  const [selectedRowKeys, setSelectedRowKeys] = useState(
    defaultSelectedRowKeys || [],
  );
  const resource = Resource.make(field.componentProps.resourceName);
  console.log({ defaultSelectedRowKeys });
  const pagination = usePaginationProps();
  const response = useRequest<{
    list: any[];
    total: number;
  }>((params = {}) => {
    return new Promise((resolve) => {
      resource.list({}).then((res) => {
        field.setValue(res?.data || []);
        resolve({
          list: res?.data || [],
          total: res?.meta?.count || res?.data?.length,
        });
        console.log(
          'field.componentProps.resourceName',
          field.componentProps.resourceName,
          res,
        );
      });

      return;

      const dataSource = Array.isArray(field.value) ? field.value.slice() : [];
      if (pagination) {
        const {
          page = pagination.defaultCurrent,
          pageSize = pagination.defaultPageSize,
        } = params;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize - 1;
        resolve({
          list: dataSource.slice(startIndex, endIndex + 1),
          total: dataSource.length,
        });
      } else {
        resolve({
          list: dataSource,
          total: dataSource.length,
        });
      }
    });
  });
  const params = {
    page: pagination.defaultCurrent,
    pageSize: pagination.defaultPageSize,
    ...(response.params[0] || {}),
  };
  return {
    resource,
    ...response,
    params,
    field,
    schema,
    selectedRowKeys,
    setSelectedRowKeys,
  };
});

export { TableContextProvider, useTableContext };

export const SelectedRowKeysContext = createContext([]);

const TableContainer = observer((props) => {
  const { schema } = useDesignable();
  const field = useField<Formily.Core.Models.ArrayField>();
  // const schema = useFieldSchema();
  const actionBars = useTableActionBars();
  const { loading, data, refresh, selectedRowKeys, setSelectedRowKeys } =
    useTableContext();
  const rowKey = field.componentProps.rowKey || 'id';
  const defaultAction = useDefaultAction();
  const dataSource = Array.isArray(field.value) ? field.value.slice() : [];
  const columns = useTableColumns({ dataSource });
  const ref = useRef<HTMLDivElement>();
  const addTdStyles = (node: HTMLElement) => {
    const helper = document.body.querySelector(`.nb-table-sort-helper`);
    if (helper) {
      const tds = node.querySelectorAll('td');
      requestAnimationFrame(() => {
        helper.querySelectorAll('td').forEach((td, index) => {
          if (tds[index]) {
            td.style.width = getComputedStyle(tds[index]).width;
          }
        });
      });
    }
  };
  const dragSort = schema?.['x-component-props']?.['dragSort'];
  const showIndex = schema?.['x-component-props']?.['showIndex'];
  return (
    <div ref={ref} className={'nb-table'}>
      {actionBars.top.map((actionBarSchema) => {
        return (
          <RecursionField
            // onlyRenderProperties
            schema={
              new Schema({
                type: 'object',
                properties: {
                  [actionBarSchema.name]: actionBarSchema,
                },
              })
            }
          />
        );
      })}
      <AntdTable
        pagination={false}
        rowKey={rowKey}
        loading={loading}
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys,
          renderCell: (checked, record, _, originNode) => {
            const index = findIndex(
              dataSource,
              (item) => item[rowKey] === record[rowKey],
            );
            return (
              <TableRowContext.Provider
                value={{
                  index: index,
                  data: record,
                }}
              >
                <div
                  className={cls('nb-table-selection', { dragSort, showIndex })}
                >
                  {dragSort && <Table.SortHandle />}
                  {showIndex && <Table.Index />}
                  {originNode}
                  {/* <Table.Operation /> */}
                </div>
              </TableRowContext.Provider>
            );
          },
          onChange: (keys) => {
            console.log(keys);
            setSelectedRowKeys(keys);
          },
        }}
        dataSource={data?.list}
        columns={columns}
        components={{
          body: {
            wrapper: (props: any) => (
              <SortableBody
                useDragHandle
                lockAxis="y"
                // disableAutoscroll
                helperClass={`nb-table-sort-helper`}
                helperContainer={() => {
                  return ref.current?.querySelector('tbody');
                }}
                onSortStart={({ node }) => {
                  addTdStyles(node);
                }}
                onSortEnd={({ oldIndex, newIndex }) => {
                  field.move(oldIndex, newIndex);
                  refresh();
                }}
                {...props}
              />
            ),
            row: (props: any) => {
              const index = findIndex(
                field.value,
                (item) => item[rowKey] === props['data-row-key'],
              );
              return <SortableRow index={index} {...props} />;
            },
          },
        }}
        onRow={(data) => {
          const index = dataSource.indexOf(data);
          return {
            onClick(e) {
              if (!defaultAction) {
                return;
              }
              const el = e.target as HTMLElement;
              if (!el.classList.contains('ant-table-cell')) {
                return;
              }
              const btn = el.parentElement.querySelector<HTMLElement>(
                `.name-${defaultAction.name}`,
              );
              btn && btn.click();
            },
          };
        }}
      />
      {actionBars.bottom.map((actionBarSchema) => {
        return (
          <RecursionField
            onlyRenderProperties
            schema={
              new Schema({
                type: 'object',
                properties: {
                  [actionBarSchema.name]: actionBarSchema,
                },
              })
            }
          />
        );
      })}
    </div>
  );
});

export const Table: any = observer((props: any) => {
  const { resourceName } = props;
  return resourceName ? (
    // @ts-ignore
    <ResourceContextProvider resourceName={resourceName}>
      <TableContextProvider>
        <DisplayFieldsContextProvider>
          <TableContainer />
        </DisplayFieldsContextProvider>
      </TableContextProvider>
    </ResourceContextProvider>
  ) : (
    <TableContextProvider>
      <DisplayFieldsContextProvider>
        <TableContainer />
      </DisplayFieldsContextProvider>
    </TableContextProvider>
  );
});

Table.useTableRow = useTableRow;
Table.useTableIndex = useTableIndex;
Table.useTableDestroyAction = useTableDestroyAction;
Table.useTableFilterAction = useTableFilterAction;
Table.useTableCreateAction = useTableCreateAction;
Table.useTableUpdateAction = useTableUpdateAction;

function Blank() {
  return null;
}

function useDesignableBar() {
  const schema = useFieldSchema();
  const options = useContext(SchemaOptionsContext);
  const DesignableBar = get(options.components, schema['x-designable-bar']);

  return {
    DesignableBar: DesignableBar || Blank,
  };
}

Table.Cell = observer((props: any) => {
  const ctx = useContext(TableRowContext);
  const schema = props.schema;
  const resourceField = useContext(ResourceFieldContext);
  return (
    <RecursionField
      schema={
        !resourceField
          ? schema
          : new Schema({
              type: 'void',
              properties: {
                [resourceField.name]: {
                  ...resourceField.uiSchema,
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
  // const { fieldName } = props;
  // const { schema } = useDesignable();
  // const path = getSchemaPath(schema);
  // const { addDisplayField } = useDisplayFieldsContext();
  // const { resource = {} } = useResourceContext();
  // useEffect(() => {
  //   if (fieldName) {
  //     addDisplayField && addDisplayField(fieldName);
  //   }
  // }, [fieldName]);
  // if (!fieldName) {
  //   return null;
  // }
  // const field = resource?.fields?.find((item) => item.name === fieldName);
  // if (!field) {
  //   return null;
  // }
  // const name = useContext(FormFieldUIDContext);
  // const title = schema['title'] || field.uiSchema['title'];
  // return (
  //   <RecursionField
  //     name={name}
  //     schema={
  //       new Schema({
  //         'x-path': path,
  //         type: 'void',
  //         properties: {
  //           [field.name]: {
  //             ...field.uiSchema,
  //             title,
  //             'x-decorator': 'FormilyFormItem',
  //           },
  //         },
  //       })
  //     }
  //   />
  // );
});

Table.Column = observer((props: any) => {
  const resourceField = useContext(ResourceFieldContext);
  const { schema, DesignableBar } = useDesignable();
  const { addDisplayField } = useDisplayFieldsContext();
  useEffect(() => {
    if (resourceField?.name) {
      addDisplayField(resourceField.name, schema);
    }
  }, [resourceField, schema]);
  return (
    <div className={'nb-table-column'}>
      {schema.title || resourceField?.uiSchema?.title}
      <DesignableBar />
    </div>
  );
});

Table.Column.DesignableBar = () => {
  const field = useField();
  // const fieldSchema = useFieldSchema();
  const { schema, remove, refresh, insertAfter } = useDesignable();
  const [visible, setVisible] = useState(false);
  const { removeDisplayField } = useDisplayFieldsContext();
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
                  removeDisplayField(fieldName);
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
      <Button type={'dashed'} icon={<PlusOutlined />}></Button>
    </Dropdown>
  );
}

Table.ActionBar = observer((props: any) => {
  const { align = 'top' } = props;
  const { schema, designable } = useDesignable();
  const designableBar = schema['x-designable-bar'];
  console.log('designableBar', designableBar);
  return (
    <div className={cls('nb-action-bar', `align-${align}`)}>
      <Space>
        {props.children}
        {designable && designableBar && <AddActionButton />}
      </Space>
    </div>
  );
});

Table.Pagination = observer((props) => {
  const { data, params, run } = useTableContext();
  return (
    <Pagination
      {...props}
      defaultCurrent={1}
      defaultPageSize={5}
      current={params?.page}
      pageSize={params?.pageSize}
      total={data?.total}
      onChange={(page, pageSize) => {
        run({ page, pageSize });
      }}
    />
  );
});

const SortHandle = SortableHandle((props: any) => {
  return (
    <MenuOutlined
      {...props}
      className={cls(`nb-table-sort-handle`, props.className)}
      style={{ ...props.style }}
    />
  );
}) as any;

Table.SortHandle = observer((props) => {
  return <SortHandle {...props} />;
});

Table.Operation = observer((props) => {
  return <EllipsisOutlined />;
});

Table.Index = observer((props) => {
  const index = useTableIndex();
  return <span className={'nb-table-index'}>{index + 1}</span>;
});

Table.Addition = observer((props: any) => {
  const { field, refresh } = useTableContext();
  const current = useField();
  return (
    <Button
      block
      onClick={() => {
        if (props.method === 'unshift') {
          field.unshift({
            key: uid(),
          });
        } else {
          field.push({
            key: uid(),
          });
        }
        refresh();
      }}
    >
      {current.title}
    </Button>
  );
});

Table.Action = () => null;

Table.Action.SimpleDesignableBar = () => {
  const field = useField();
  const path = useSchemaPath();
  const { schema, remove, refresh, insertAfter } = useDesignable();
  const [visible, setVisible] = useState(false);
  // console.log('Table.Action.DesignableBar', path, field.address.entire, { schema, field });
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
              <Menu.Item>放置在右侧</Menu.Item>
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

Table.Filter = observer((props) => {
  return null;
});

Table.Filter.DesignableBar = () => {
  const field = useField();
  const path = useSchemaPath();
  const { schema, remove, refresh, insertAfter } = useDesignable();
  const [visible, setVisible] = useState(false);
  // console.log('Table.Action.DesignableBar', path, field.address.entire, { schema, field });
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
              <Menu.Item>自定义筛选字段</Menu.Item>
              <Menu.Item>放置在右侧</Menu.Item>
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

Table.Action.DesignableBar = () => {
  const field = useField();
  const path = useSchemaPath();
  const { schema, remove, refresh, insertAfter } = useDesignable();
  const [visible, setVisible] = useState(false);
  const isPopup = Object.keys(schema.properties || {}).length > 0;
  const inActionBar = schema.parent['x-component'] === 'Table.ActionBar';
  // console.log('Table.Action.DesignableBar', path, field.address.entire, { schema, field });
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
