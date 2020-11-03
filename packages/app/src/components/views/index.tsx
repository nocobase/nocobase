
import React from 'react';
import { Form } from './Form';
import { Table } from './Table';
import { Details } from './Details';

const TEMPLATES = new Map<string, any>();

export function registerView(template: string, Template: any) {
  TEMPLATES.set(template, Template);
}

export function getViewTemplate(template: string) {
  return TEMPLATES.get(template);
}

registerView('Form', Form);
registerView('Table', Table);
registerView('Details', Details);

export default function ViewFactory(props) {
  const { schema = {} } = props;
  console.log(schema);
  const { template } = schema;
  const Template = getViewTemplate(template);
  return Template && <Template {...props}/>;
}
