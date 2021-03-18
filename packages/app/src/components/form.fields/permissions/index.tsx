import { connect } from '@formily/react-schema-renderer'
import React, { useEffect, useState } from 'react';
import { Input as AntdInput, Table, Checkbox, Select, Tag } from 'antd'
import { acceptEnum, mapStyledProps, mapTextComponent } from '../shared'
import api from '@/api-client';
import { useRequest } from 'umi';
import { useDynamicList } from 'ahooks';
import findIndex from 'lodash/findIndex';
import get from 'lodash/get';
import set from 'lodash/set';
import { DrawerSelectComponent } from '../drawer-select';

export const Permissions = {} as {Actions: any, Fields: any, Tabs: any};

Permissions.Actions = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent
})(({onChange, value = [], resourceKey, ...restProps}) => {
  const { data = [], loading = true } = useRequest(() => {
    return api.resource('collections.actions').list({
      associatedKey: resourceKey,
      perPage: -1,
    });
  }, {
    refreshDeps: [resourceKey]
  });

  return <Table size={'small'} pagination={false} dataSource={data} columns={[
    {
      title: '操作',
      dataIndex: ['title'],
    },
    {
      title: '类型',
      dataIndex: ['type'],
      render: (type) => {
        return type === 'create' ? <Tag color={'green'}>对新数据操作</Tag> : <Tag color={'blue'}>对已有数据操作</Tag>;
      }
    },
    {
      title: '允许操作',
      dataIndex: ['name'],
      render: (val, record) => {
        const values = [...value||[]];
        const index = findIndex(values, (item: any) => item && item.name === `${resourceKey}:${record.name}`);
        console.log(values);
        return (
          <Checkbox defaultChecked={index >= 0} onChange={(e) => {
            // const index = findIndex(values, (item: any) => item && item.name === `${resourceKey}:${record.name}`);
            if (index >= 0) {
              if (!e.target.checked) {
                values.splice(index, 1);
              }
            } else {
              values.push({
                name: `${resourceKey}:${record.name}`,
              });
            }
            onChange(values);
          }}/>
        )
      }
    },
    {
      title: '可操作的数据范围',
      dataIndex: ['scope'],
      render: (scope, record) => {
        if (['filter', 'create'].indexOf(record.type) !== -1) {
          return null;
        }
        const values = [...value||[]];
        const index = findIndex(values, (item: any) => item && item.name === `${resourceKey}:${record.name}`);
        console.log(values, index, `${resourceKey}:${record.name}`, get(values, [index, 'scope']));
        return (
          <DrawerSelectComponent
            schema={{
              title: '选择可操作的数据范围',
            }}
            size={'small'}
            associatedKey={resourceKey}
            viewName={'collections.scopes.table'}
            target={'scopes'}
            multiple={false}
            labelField={'title'}
            valueField={'id'}
            value={get(values, [index, 'scope'])}
            onChange={(data) => {
              const values = [...value||[]];
              const index = findIndex(values, (item: any) => item && item.name === `${resourceKey}:${record.name}`);
              if (index === -1) {
                values.push({
                  name: `${resourceKey}:${record.name}`,
                  scope_id: data.id,
                });
              } else {
                set(values, [index, 'scope_id'], data.id);
              }
              console.log('valvalvalvalval', {values})
              onChange(values);
              console.log('valvalvalvalval', data);
            }}
          />
          // <Scope
          //   resourceTarget={'scopes'}
          //   associatedName={'collections'}
          //   associatedKey={resourceKey}
          //   target={'scopes'}
          //   multiple={false}
          //   labelField={'title'}
          //   valueField={'id'}
          //   value={get(values, [index, 'scope'])}
          //   onChange={(data) => {
          //     const values = [...value||[]];
          //     const index = findIndex(values, (item: any) => item && item.name === `${resourceKey}:${record.name}`);
          //     if (index === -1) {
          //       values.push({
          //         name: `${resourceKey}:${record.name}`,
          //         scope_id: data,
          //       });
          //     } else {
          //       set(values, [index, 'scope_id'], data);
          //     }
          //     console.log('valvalvalvalval', {values})
          //     onChange(values);
          //     console.log('valvalvalvalval', data);
          //   }}
          // />
        )
      }
    },
  ]} loading={loading}/>
})

Permissions.Fields = connect<'TextArea'>({
  getProps: mapStyledProps,
  getComponent: mapTextComponent
})(({onChange, value = [], resourceKey, ...restProps}) => {

  const actions = {};
  value.forEach(item => {
    actions[item.field_id] = item.actions;
  });

  // console.log(actions);

  const [fields, setFields] = useState(value||[]);

  const { data = [], loading = true } = useRequest(() => {
    return api.resource('collections.fields').list({
      associatedKey: resourceKey,
      perPage: -1,
    });
  }, {
    refreshDeps: [resourceKey]
  });
  console.log({resourceKey, data});

  const columns = [
    {
      title: '字段名称',
      dataIndex: ['title'],
    }
  ].concat([
    {
      title: '查看',
      action: `${resourceKey}:list`,
    },
    {
      title: '编辑',
      action: `${resourceKey}:update`,
    },
    {
      title: '新增',
      action: `${resourceKey}:create`,
    },
  ].map(({title, action}) => {
    let checked = value.filter(({ actions = [] }) => actions.indexOf(action) !== -1).length === data.length;
    return {
      title: <><Checkbox checked={checked} onChange={(e) => {
        const values = data.map(field => {
          const items = actions[field.id] || [];
          const index = items.indexOf(action);
          if (index > -1) {
            if (!e.target.checked) {
              items.splice(index, 1);
            }
          } else {
            if (e.target.checked) {
              items.push(action);
            }
          }
          return {
            field_id: field.id,
            actions: items,
          }
        });
        // console.log(values);
        setFields([...values]);
        onChange([...values]);
      }}/> {title}</>,
      dataIndex: ['id'],
      render: (val, record) => {
        const items = actions[record.id]||[]
        // console.log({items}, items.indexOf(action));
        return (
          <Checkbox checked={items.indexOf(action) !== -1} onChange={e => {
            const values = [...value];
            const index = findIndex(values, ({field_id, actions = []}) => {
              return field_id === record.id;
            });
            if (e.target.checked && index === -1) {
              values.push({
                field_id: record.id,
                actions: [action],
              });
            } else {
              const items = values[index].actions || [];
              const actionIndex = items.indexOf(action);
              if (!e.target.checked && actionIndex > -1) {
                items.splice(actionIndex, 1);
                // values[index].actions = items;
              } else if (e.target.checked && actionIndex === -1) {
                items.push(action);
              }
            }
            onChange(values);
            setFields(values);
          }}/>
        )
      }
    }
  }) as any)

  return <Table size={'small'} loading={loading} pagination={false} dataSource={data} columns={columns}/>
})

Permissions.Tabs = connect<'TextArea'>({
  getProps: mapStyledProps,
  getComponent: mapTextComponent
})(({onChange, value = [], resourceKey, ...restProps}) => {

  const { data = [], loading = true, mutate } = useRequest(() => {
    return api.resource('collections.tabs').list({
      associatedKey: resourceKey,
      perPage: -1,
    });
  }, {
    refreshDeps: [resourceKey]
  });

  // const [checked, setChecked] = useState(false);

  // console.log(checked);

  // useEffect(() => {
  //   setChecked(data.length === value.length);
  //   console.log({resourceKey, data, value}, data.length === value.lengh);
  // }, [
  //   data,
  // ]);

  return <Table size={'small'} pagination={false} dataSource={data} columns={[
    {
      title: '标签页',
      dataIndex: ['title'],
    },
    {
      title: (
        <>
          <Checkbox checked={data.length === value.length} onChange={(e) => {
            onChange(e.target.checked ? data.map(record => record.id) : []);
          }}/> 查看
        </>
      ),
      dataIndex: ['id'],
      render: (val, record) => {
        const values = [...value];
        return (
          <Checkbox checked={values.indexOf(record.id) !== -1} onChange={(e) => {
            const index = values.indexOf(record.id);
            if (index !== -1) {
              if (!e.target.checked) {
                values.splice(index, 1);
              }
            } else {
              values.push(record.id);
            }
            onChange(values);
          }}/>
        )
      }
    },
  ]} loading={loading}/>
});
