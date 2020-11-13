
import React from 'react';
import { Form, DrawerForm } from './Form/index';
import { Table } from './Table';
import { Details } from './Details';
import { useRequest, request, Spin } from '@nocobase/client';
import { SimpleTable } from './SimpleTable';
import api from '@/api-client';

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
  const { activeTab, viewCollectionName, viewName, reference } = props;
  console.log({viewCollectionName, viewName});
  const { data = {}, error, loading, run } = useRequest(() => api.resource(viewCollectionName).getView({
    resourceKey: viewName,
  }), {
    refreshDeps: [viewCollectionName, viewName],
  });
  console.log(activeTab);
  if (loading) {
    return <Spin/>;
  }
  const { template } = data.data;
  const Template = getViewTemplate(template);
  return Template && <Template {...props} ref={reference} schema={data.data}/>;
}
