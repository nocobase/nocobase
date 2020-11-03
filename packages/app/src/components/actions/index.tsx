
import React from 'react';
import Create from './Create';
import Edit from './Edit';

const ACTIONS = new Map<string, any>();

export function registerAction(type: string, Action: any) {
  ACTIONS.set(type, Action);
}

registerAction('edit', Edit);
registerAction('create', Create);

export function getAction(type: string) {
  return ACTIONS.get(type);
}

export function Action(props) {
  const { schema = {} } = props;
  // cnsole.log(schema);
  const { type } = schema;
  const Action = getAction(type);
  return Action && <Action {...props}/>;
}

export function Actions(props) {
  const { schema, actions = [] } = props;
  return (
    <div>
      {actions.map(action => <Action {...props} view={schema} schema={action}/>)}
    </div>
  );
}

export default Actions;
