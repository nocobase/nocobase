import React, { useState, useEffect, useRef, createRef } from 'react';
import './style.less';
import { Helmet } from 'umi';
import { Spin } from '@nocobase/client';
import { useRequest, useHistory } from 'umi';
import api from '@/api-client';
import { Actions } from '../Actions';
import { Modal, PageHeader, Table as AntdTable, Card, Pagination, Button, Tabs, Descriptions, Tooltip } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { components, fields2columns } from '@/components/views/SortableTable';
import ReactDragListView from 'react-drag-listview';
import arrayMove from 'array-move';
import get from 'lodash/get';
import find from 'lodash/find';
import Drawer from '@/components/pages/AdminLoader/Drawer';
import Field from '@/components/views/Field';
import { Form } from './Form';
import { View } from './';
import pathToRegexp from 'path-to-regexp'

export const icon = <LoadingOutlined style={{ fontSize: 36 }} spin />;

export function Details(props) {
  const { __parent, associatedKey, resourceName, onFinish, onReset, onDataChange, data, items = [], resolve, onValueChange } = props;
  if (!items || items.length === 0) {
    return null;
  }
  const [currentTabIndex, setCurrentTabIndex] = useState('0');
  return (
    <div className={'page-tabs'}>
      { items.length > 1 && (
        <div className={'tabs-wrap'}>
          <Tabs size={'small'} activeKey={`${currentTabIndex}`} onChange={(activeKey) => {
            setCurrentTabIndex(activeKey);
          }}>
            {items.map((page, index) => (
              <Tabs.TabPane tab={page.title} key={`${index}`}/>
            ))}
          </Tabs>
        </div>
      ) }
      {(get(items, [currentTabIndex, 'views'])||[]).map(view => {
        let viewName: string;
        if (typeof view === 'string') {
          viewName = `${resourceName}.${view}`;
        } if (typeof view === 'object') {
          viewName = `${resourceName}.${view.name}`;
        }
        return (
          <View 
            onValueChange={onValueChange} 
            __parent={__parent} 
            associatedKey={associatedKey} onReset={onReset} onFinish={onFinish} onDataChange={onDataChange} data={data} viewName={viewName}/>
        );
      })}
    </div>
  );
}

export function DetailsPage(props) {
  const { currentRowId, title, __parent, associatedKey, resourceName, onFinish, onReset, onDataChange, data, items = [], resolve } = props;
  if (!items || items.length === 0) {
    return null;
  }
  const history = useHistory();
  const paths = history.location.pathname.split('/');
  const index = parseInt(paths[4]);
  const [currentTabIndex, setCurrentTabIndex] = useState(items.length > index ? paths[4] : '0');
  return (
    <div>
      <PageHeader
        title={title}
        ghost={false}
        onBack={() => {
          history.push(`/admin/${paths[2]}`);
        }}
        footer={<Tabs size={'small'} activeKey={`${currentTabIndex}`} onChange={(activeKey) => {
          setCurrentTabIndex(activeKey);
          history.push(`/admin/${paths[2]}/${currentRowId}/${activeKey}`);
        }}>
          {items.map((page, index) => (
            <Tabs.TabPane tab={page.title} key={`${index}`}/>
          ))}
        </Tabs>}
      />
      <div className={'page-content'}>
        <Card bordered={false}>
          {(get(items, [currentTabIndex, 'views'])||[]).map(view => {
            let viewName: string;
            if (typeof view === 'string') {
              viewName = `${resourceName}.${view}`;
            } if (typeof view === 'object') {
              viewName = `${resourceName}.${view.name}`;
            }
            return (
              <View __parent={__parent} associatedKey={associatedKey} onReset={onReset} onFinish={onFinish} onDataChange={onDataChange} data={data} viewName={viewName}/>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

export function Table(props: any) {
  const {
    onSelected,
    multiple = true,
    isFieldComponent,
    schema = {},
    data: record = {},
    defaultFilter,
    defaultSelectedRowKeys,
    noRequest = false,
    __parent,
    currentRowId,
  } = props;

  const content = document.getElementById('content');

  const { 
    fields = [],
    actions = [],
    details = [],
    paginated = true,
    defaultPerPage = 10,
    rowKey = 'id',
    labelField = 'id',
    sort,
    resourceName,
    associationField = {},
    appends = [],
    expandable,
    detailsOpenMode = 'drawer',
    filter: schemaFilter = {},
  } = schema;

  const history = useHistory();

  const associatedKey = props.associatedKey || record[associationField.sourceKey||'id'];
  console.log({associatedKey, record, associationField, __parent})

  async function reloadMenu() {
    if (resourceName !== 'menus') {
      return;
    }
    (window as any).reloadMenu && await (window as any).reloadMenu();
  }

  const { data, loading, pagination, mutate, refresh, run, params } = useRequest((params = {}, ...args) => {
    const { current, pageSize, sorter, filter, ...restParams } = params;
    console.log('paramsparamsparamsparamsparams', params, args);
    return api.resource(resourceName).list({
      associatedKey,
      page: paginated ? current : 1,
      perPage: paginated ? pageSize : -1,
      sorter,
      sort,
      'fields[appends]': appends,
      // filter,
      // ...actionDefaultParams,
      filter: {
        and: [
          defaultFilter,
          schemaFilter,
          filter,
          // __parent ? {
          //   collection_name: __parent,
          // } : null,
        ].filter(obj => obj && Object.keys(obj).length)
      }
      // ...args2,
    })
    .then(({data = [], meta = {}}) => {
      return {
        data: {
          list: data,
          total: meta.count||data.length,
        },
      };
    });
  }, {
    paginated,
    defaultPageSize: defaultPerPage,
  });

  const currentRow = find(data && data.list, item => item[rowKey] == currentRowId)
  console.log({currentRow});
  function getExpandedRowKeys(items: Array<any>) {
    if (!Array.isArray(items))  {
      return [];
    }
    console.log({items})
    let rowKeys = [];
    items.forEach(item => {
      if (item.children && item.children.length) {
        rowKeys.push(item[rowKey]);
        rowKeys = rowKeys.concat(getExpandedRowKeys(item.children));
      }
    });
    return rowKeys;
  }

  const [expandedRowKeys, setExpandedRowKeys] = useState(() => {
    if (expandable) {
      return getExpandedRowKeys(data?.list);
    }
    return [];
  });

  useEffect(() => {
    setExpandedRowKeys(getExpandedRowKeys(data?.list));
  }, [data]);

  if (expandable) {
    // expandable.expandIconColumnIndex = 4;
    expandable.onExpand = (expanded, record)  => {
      if (!expanded) {
        const index = expandedRowKeys.indexOf(record[rowKey]);
        if (index >= 0) {
          expandedRowKeys.splice(index, 1);
        }
      } else {
        expandedRowKeys.push(record[rowKey]);
      }
      setExpandedRowKeys(expandedRowKeys);
    }
    expandable.expandedRowKeys = expandedRowKeys;
    console.log({expandable, data});
  }

  // const { data, loading, pagination, mutate, refresh, run, params } = useRequest((params = {}, ...args) => {
  //   const { current, pageSize, sorter, filter, ...restParams } = params;
  //   return api.resource(resourceName).list({
  //     associatedKey,
  //     sort,
  //   }).then(({data = [], meta = {}}) => {
  //     return {
  //       data: {
  //         list: data,
  //         total: meta.count||data.length,
  //       },
  //     };
  //   });
  // }, {
  //   paginated,
  //   defaultPageSize: defaultPerPage,
  // });

  const [selectedRowKeys, setSelectedRowKeys] = useState(defaultSelectedRowKeys||[]);
  const onChange = (selectedRowKeys: React.ReactText[], selectedRows: React.ReactText[]) => {
    setSelectedRowKeys(selectedRowKeys);
    onSelected && onSelected(selectedRows);
  }
  // useEffect(() => {
  //   setSelectedRowKeys(srk);
  // }, [srk]);
  // console.log(srk);
  const tableProps: any = {};

  if (actions.length || defaultSelectedRowKeys) {
    tableProps.rowSelection = {
      type: multiple ? 'checkbox' : 'radio',
      selectedRowKeys,
      onChange,
    }
  }

  const ref = createRef<HTMLDivElement>();

  const dragProps = {
    async onDragEnd(fromIndex, toIndex) {
      const list = data?.list||(data as any);
      const nodes = ref.current.querySelectorAll('.ant-table-row');
      const resourceKey = nodes[fromIndex].getAttribute('data-row-key');
      const targetIndex = nodes[toIndex].getAttribute('data-row-key');
      
      // const newList = arrayMove(list, fromIndex, toIndex);
      // const item = list.splice(fromIndex, 1)[0];
      // list.splice(toIndex, 0, item);
      // mutate({
      //   ...data,
      //   list: newList,
      // });
      await api.resource(resourceName).sort({
        associatedKey,
        resourceKey,
        values: {
          field: 'sort',
          target: {
            [rowKey]: targetIndex,
          },
        },
      });
      await refresh();
      await reloadMenu();

      // console.log(nodes[fromIndex].getAttribute('data-row-key'), nodes[toIndex])
      console.log({
        // ref: ref.current.querySelectorAll('.ant-table-row'),
        // fromIndex, toIndex, newList,
        values: {
              field: 'sort',
              target: {
                [rowKey]: targetIndex,
              },
            },
      });
    },
    handleSelector: ".drag-handle",
    ignoreSelector: "tr.ant-table-expanded-row",
    nodeSelector: "tr.ant-table-row"
  };

  return (
    <div>
      <div ref={ref}>
        <Actions __parent={__parent} associatedKey={associatedKey} onTrigger={{
          async create(values) {
            await refresh();
            await reloadMenu();
          },
          async add(values = []) {
            await api.resource(resourceName).add({
              associatedKey,
              values,
            });
          },
          async update(values) {
            await refresh();
            await reloadMenu();
          },
          async filter(values) {
            const items = values.filter.and || values.filter.or;
            // @ts-ignore
            run({...params[0], filter: values.filter});
            // refresh();
          },
          async destroy() {
            if (selectedRowKeys.length) {
              await api.resource(resourceName).destroy({
                associatedKey,
                filter: {
                  [`${rowKey}.in`]: selectedRowKeys,
                },
              });
            }
            refresh();
            await reloadMenu();
          },
        }} actions={actions} style={{ marginBottom: 14 }}/>
        <ReactDragListView {...dragProps}>
          <AntdTable
            rowKey={rowKey}
            loading={{
              spinning: loading,
              size: 'large',
              indicator: icon,
            }}
            components={{
              body: {
                row: ({className, ...others}) => {
                  if (!detailsOpenMode || !details.length) {
                    return <tr className={className} {...others}/>
                  }
                  return <tr className={className ? `${className} row-clickable` : 'row-clickable'} {...others}/>
                },
              }
            }}
            dataSource={data?.list||(data as any)}
            size={'middle'} 
            columns={fields2columns(fields, {associatedKey, refresh})}
            pagination={false}
            onChange={(pagination, filters, sorter, extra) => {
              run({...params[0], sorter});
            }}
            expandable={expandable}
            onRow={(data) => ({
              onClick: (e) => {
                const className = (e.target as HTMLElement).className;
                console.log({className});
                if (typeof className === 'string' && 
                    (className.includes('ant-table-selection-column') 
                      || className.includes('ant-checkbox') 
                      || className.includes('ant-radio')
                    )
                  ) {
                  return;
                }
                if (!detailsOpenMode || !details.length) {
                  return;
                }
                if (detailsOpenMode === 'window') {
                  const paths = history.location.pathname.split('/');
                  history.push(`/admin/${paths[2]}/${data[rowKey]}/0`);
                } else {
                  Drawer.open({
                    headerStyle: details.length > 1 ? {
                      paddingBottom: 0,
                      borderBottom: 0,
                      // paddingTop: 16,
                      // marginBottom: -4,
                    } : {},
                    // title: details.length > 1 ? undefined : data[labelField],
                    title: data[labelField],
                    bodyStyle: {
                      // padding: 0,
                    },
                    content: ({resolve, closeWithConfirm}) => (
                      <div>
                        <Details 
                          __parent={__parent}
                          associatedKey={associatedKey} 
                          resourceName={resourceName} 
                          onFinish={async () => {
                            await refresh();
                            resolve();
                            await reloadMenu();
                          }}
                          onValueChange={() => {
                            closeWithConfirm && closeWithConfirm(true);
                          }}
                          onDraft={async () => {
                            await refresh();
                            resolve();
                            await reloadMenu();
                          }}
                          onReset={resolve}
                          onDataChange={async () => {
                            await refresh();
                            await reloadMenu();
                          }}
                          data={data}
                          resolve={resolve}
                          items={details}
                        />
                      </div>
                    ),
                  });
                }
              },
            })}
            {...tableProps}
          />
        </ReactDragListView>
        {paginated && (
          <div className={'table-pagination'}>
            <Pagination {...pagination} showTotal={(total)=> `共 ${total} 条记录`} showQuickJumper showSizeChanger size={'small'}/>
          </div>
        )}
      </div>
      {currentRow && <div className={'details-page'}>
        <DetailsPage
          title={get(currentRow, labelField)}
          __parent={__parent}
          associatedKey={associatedKey} 
          resourceName={resourceName} 
          onFinish={async () => {
            await refresh();
            await reloadMenu();
          }}
          onReset={() => {

          }}
          onDataChange={async () => {
            await refresh();
            await reloadMenu();
          }}
          currentRowId={currentRowId}
          data={currentRow}
          items={details}
        />
      </div>}
    </div>
  );
}
