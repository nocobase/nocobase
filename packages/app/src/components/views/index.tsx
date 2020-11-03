
import React from 'react';
import { Form } from './Form';
import { Table } from './Table';
import { Details } from './Details';
import { useRequest, request, Spin } from '@nocobase/client';

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
  const { id } = props;
  const { data = {}, error, loading, run } = useRequest(() => request(`/ui/views/${id}`), {
    refreshDeps: [id],
  });
  if (loading) {
    return <Spin/>;
  }
  const { template } = data.data;
  const Template = getViewTemplate(template);
  return Template && <Template {...props} schema={data.data}/>;
}
