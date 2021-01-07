
import React, { useEffect, useState } from 'react';
import api from '@/api-client';
import { useRequest } from 'umi';
import { Spin } from '@nocobase/client';
import { SimpleTable } from './SimpleTable';
import { Table } from './Table';
import { Form, DrawerForm, FilterForm } from './Form/index';
import { Details } from './Details';
import './style.less';
import { Login } from './Form/Login';
import { Register } from './Form/Register';
import { Calendar } from './Calendar/index';

const TEMPLATES = new Map<string, any>();

export function registerView(template: string, Template: any) {
  TEMPLATES.set(template, Template);
}

export function getViewTemplate(template: string) {
  return TEMPLATES.get(template);
}

registerView('Calendar', Calendar);
registerView('FilterForm', FilterForm)
registerView('DrawerForm', DrawerForm);
registerView('PermissionForm', DrawerForm);
registerView('Form', Form);
registerView('Table', Table);
registerView('SimpleTable', Table);
registerView('Details', Details);
registerView('Login', Login);
registerView('Register', Register);

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
    resourceTarget,
    resourceFieldName,
    viewName,
    mode,
    reference,
    isAssociationView = false,
  } = props;
  console.log('propspropspropspropspropspropsprops', props);
  const { data = {}, loading } = useRequest(() => {
    const params = {
      resourceKey: viewName,
      values: {
        associatedKey: associatedKey,
        associatedName: associatedName,
        resourceFieldName: resourceName,
        mode
      },
    };
    return api.resource(resourceTarget||resourceName).getView(params);
  }, {
    refreshDeps: [associatedName, resourceTarget, resourceName, viewName],
  });
  if (loading) {
    return <Spin/>;
  }
  let { template } = data;
  if (isAssociationView && template === 'Table') {
    template = 'SimpleTable';
  }
  const Template = getViewTemplate(template);
  return Template && <Template {...props} ref={reference} schema={data}/>;
}
