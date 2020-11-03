
import React from 'react';
import { Form } from './Form';
import { Table } from './Table';
import { Details } from './Details';

const VIEWMAP = new Map();

export function registerView(type, View) {
  VIEWMAP.set(type, View);
}

export function getView(type) {
  return VIEWMAP.get(type);
}

registerView('Form', Form);
registerView('Table', Table);
registerView('Details', Details);

export default function ViewFactory(props) {
  const { schema = {} } = props;
  console.log(schema);
  const { type } = schema;
  const View = getView(type);
  if (!View) {
    return null;
  }
  return <View {...props}/>;
}
