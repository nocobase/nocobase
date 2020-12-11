
import React from 'react';
import Create from './Create';
import Update from './Update';
import Destroy from './Destroy';
import Filter from './Filter';
import { Space } from 'antd';

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

export function Actions(props) {
  const { onTrigger = {}, style, schema, actions = [], ...restProps } = props;
  console.log(onTrigger);
  return actions.length > 0 && (
    <Space style={style}>
      {actions.map(action => (
        <Action
          {...restProps}
          view={schema}
          schema={action}
          onTrigger={onTrigger[action.name]}
        />
      ))}
    </Space>
  );
}

export default Actions;
