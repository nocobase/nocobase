
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

export interface ViewProps {
  resourceName: string;
  resourceKey?: string | number;
  associatedName?: string;
  associatedKey?: string | number;
  viewName?: string;
  [key: string]: any;
}

export default function ViewFactory(props: ViewProps) {
  const { activeTab, associatedName, associatedKey, resourceName, viewCollectionName, viewName, reference } = props;
  const name = associatedName ? `collections.${resourceName}` : resourceName;
  console.log({name, associatedKey, viewName});
  const { data = {}, error, loading, run } = useRequest(() => api.resource(name).getView({
    associatedKey: associatedName,
    resourceKey: viewName,
  }), {
    refreshDeps: [associatedName, resourceName, associatedKey, viewName],
  });
  console.log(data);
  if (loading) {
    return <Spin/>;
  }
  const { template } = data.data;
  const Template = getViewTemplate(template);
  return Template && <Template {...props} ref={reference} schema={data.data}/>;
}
