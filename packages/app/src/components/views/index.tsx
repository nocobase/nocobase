
import React from 'react';
import { Form, DrawerForm } from './Form/index';
import { Table } from './Table';
import { Details } from './Details';
import { useRequest, request, Spin } from '@nocobase/client';
import { SimpleTable } from './SimpleTable';

const TEMPLATES = new Map<string, any>();

export function registerView(template: string, Template: any) {
  TEMPLATES.set(template, Template);
}

export function getViewTemplate(template: string) {
  return TEMPLATES.get(template);
}

registerView('DrawerForm', DrawerForm);
registerView('PermissionForm', DrawerForm);
registerView('Form', Form);
registerView('Table', Table);
registerView('SimpleTable', SimpleTable);
registerView('Details', Details);

export default function ViewFactory(props) {
  const { viewCollectionName, viewName, reference } = props;
  const { data = {}, error, loading, run } = useRequest(() => request(`/${viewCollectionName}:getView/${viewName}`), {
    refreshDeps: [viewCollectionName, viewName],
  });
  if (loading) {
    return <Spin/>;
  }
  const { template } = data.data;
  const Template = getViewTemplate(template);
  return Template && <Template {...props} ref={reference} schema={data.data}/>;
}
