import React from 'react';
import { Button } from 'antd';
import { FilterOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import Drawer from '@/components/pages/AdminLoader/Drawer';
import View from '@/components/pages/AdminLoader/View';

export function Create(props) {
  const { onFinish, schema = {} } = props;
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
  const { onFinish, data, schema = {} } = props;
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
  const { schema = {} } = props;
  const { title } = schema;
  return (
    <>
      <Button 
        icon={<DeleteOutlined />} 
        type={'ghost'}
        danger
      >{ title }</Button>
    </>
  )
}

export function Filter(props) {
  const { schema = {} } = props;
  const { title } = schema;
  return (
    <>
      <Button icon={<FilterOutlined />}>{ title }</Button>
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

registerAction('update', Update);
registerAction('create', Create);
registerAction('destroy', Destroy);
registerAction('filter', Filter);

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