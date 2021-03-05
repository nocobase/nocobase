import React, { useState } from 'react';
import { Button, Popconfirm, Popover } from 'antd';
import { FilterOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Drawer from '@/components/pages/AdminLoader/Drawer';
import View from '@/components/pages/AdminLoader/View';

export function Create(props) {
  const { onFinish, schema = {}, associatedKey } = props;
  const { title, viewName } = schema;
  return (
    <>
      <Button 
        onClick={() => {
          Drawer.open({
            title: title,
            content: ({resolve}) => (
              <div>
                <View
                  associatedKey={associatedKey}
                  viewName={viewName}
                  onFinish={async (values) => {
                    await resolve();
                    onFinish && await onFinish(values);
                  }}
                />
              </div>
            ),
          });
        }} 
        icon={<PlusOutlined />} 
        type={'primary'}
      >{ title }</Button>
    </>
  )
}

export function Update(props) {
  const { onFinish, data, schema = {}, associatedKey } = props;
  const { title, viewName } = schema;
  return (
    <>
      <Button 
        onClick={() => {
          Drawer.open({
            title: title,
            content: ({resolve}) => (
              <div>
                <View
                  associatedKey={associatedKey}
                  data={data}
                  viewName={viewName}
                  onFinish={async (values) => {
                    await resolve();
                    onFinish && await onFinish(values);
                  }}
                />
              </div>
            ),
          });
        }} 
        icon={<PlusOutlined />} 
        type={'primary'}
      >{ title }</Button>
    </>
  )
}

export function Destroy(props) {
  const { schema = {}, onFinish } = props;
  const { title } = schema;
  return (
    <Popconfirm title="确认删除吗？" onConfirm={async () => {
      onFinish && await onFinish();
    }}>
      <Button
        danger
        type={'ghost'}
        icon={<DeleteOutlined />}
      >{ title }</Button>
    </Popconfirm>
  )
}

export function Filter(props) {
  const { schema = {}, onFinish } = props;
  const { title, fields = [] } = schema;
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState({});
  const [filterCount, setFilterCount] = useState(0);
  console.log('Filter', { visible, data });

  return (
    <>
      {visible && (
        <div 
          style={{
            height: '100vh',
            width: '100vw',
            zIndex: 1000,
            position: 'fixed',
            background: 'rgba(0, 0, 0, 0)',
            top: 0,
            left: 0,
          }}
          onClick={() => setVisible(false)}
        ></div>
      )}
      <Popover
        // title="设置筛选"
        trigger="click"
        visible={visible}
        defaultVisible={visible}
        placement={'bottomLeft'}
        destroyTooltipOnHide
        onVisibleChange={(visible) => {
          setVisible(visible);
        }}
        className={'filters-popover'}
        style={{
        }}
        overlayStyle={{
          minWidth: 500
        }}
        content={(
          <>
            <View data={data} onFinish={async (values) => {
              if (values) {
                const items = values.filter.and || values.filter.or;
                setFilterCount(Object.keys(items).length);
                setData(values);
                onFinish && await onFinish(values);
              }
              setVisible(false);
            }} schema={{
              "type": "filterForm",
              "fields": [{
                "dataIndex": ["filter"],
                "name": "filter",
                "interface": "json",
                "type": "json",
                "component": {
                  "type": "filter",
                  'x-component-props': {
                    fields,
                  }
                },
              }],
            }}/>
          </>
        )}
      >
        <Button icon={<FilterOutlined />} >{filterCount ? `${filterCount} 个${title}项` : title}</Button>
      </Popover>
    </>
  )
}

export function Actions(props) {
  const { onTrigger = {}, actions = [], style, ...restProps } = props;
  return actions.length > 0 && (
    <div className={'action-buttons'} style={style}>
      {actions.map(action => (
        <div className={`${action.name}-action-button action-button`}>
          <Action
            {...restProps}
            onFinish={onTrigger[action.name]}
            schema={action}
          />
        </div>
      ))}
    </div>
  );
}

export default Actions;

const ACTIONS = new Map<string, any>();

export function registerAction(type: string, Action: any) {
  ACTIONS.set(type, Action);
}

export function getAction(type: string) {
  return ACTIONS.get(type);
}

export function Action(props) {
  const { schema = {} } = props;
  // cnsole.log(schema);
  const { type } = schema;
  const Component = getAction(type);
  return Component && <Component {...props}/>;
}

registerAction('update', Update);
registerAction('create', Create);
registerAction('destroy', Destroy);
registerAction('filter', Filter);
