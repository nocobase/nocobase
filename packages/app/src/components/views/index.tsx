
import React, { useEffect, useState } from 'react';
import api from '@/api-client';
import { useRequest } from 'umi';
import { Spin } from '@nocobase/client';
import { SimpleTable } from './SimpleTable';
import { Table } from './Table';
import { Form, DrawerForm } from './Form/index';
import { Details } from './Details';

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
  const {
    associatedName,
    associatedKey,
    resourceName,
    viewName,
    reference,
  } = props;
  const { data = {}, loading } = useRequest(() => {
    const params = {
      resourceKey: viewName,
      associatedName: associatedName,
    };
    return api.resource(resourceName).getView(params);
  }, {
    refreshDeps: [associatedName, resourceName, viewName],
  });
  if (loading) {
    return <Spin/>;
  }
  const { template } = data;
  const Template = getViewTemplate(template);
  return Template && <Template {...props} ref={reference} schema={data}/>;
}
