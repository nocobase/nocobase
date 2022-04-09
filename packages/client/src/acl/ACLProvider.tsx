import { useFieldSchema } from '@formily/react';
import { Spin } from 'antd';
import React, { createContext, useContext } from 'react';
import { Redirect } from 'react-router-dom';
import { useRequest } from '../api-client';
import { useCollection } from '../collection-manager';
import { SchemaComponentOptions } from '../schema-component';

export const ACLContext = createContext(null);

export const ACLProvider = (props) => {
  return (
    <SchemaComponentOptions
      components={{ ACLCollectionFieldProvider, ACLActionProvider, ACLMenuItemProvider, ACLCollectionProvider }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};

export const ACLRolesCheckProvider = (props) => {
  const result = useRequest({
    url: 'roles:check',
  });
  if (result.loading) {
    return <Spin />;
  }
  if (result.error) {
    return <Redirect to={'/signin'} />;
  }
  return <ACLContext.Provider value={result}>{props.children}</ACLContext.Provider>;
};

export const useAclRoleContext = () => {
  return useContext(ACLContext);
};

export const ACLAllowConfigure = (props) => {
  const ctx = useContext(ACLContext);
  if (ctx.data?.data?.allowConfigure) {
    return <>{props.children}</>;
  }
  return null;
};

export const ACLCollectionProvider = (props) => {
  const { name } = useCollection();

  return <>{props.children}</>;
};

export const ACLActionProvider = (props) => {
  const { name } = useCollection();
  const fieldSchema = useFieldSchema();
  const ctx = useContext(ACLContext);
  if (!name) {
    return <>{props.children}</>;
  }
  const actionName = fieldSchema['x-action'];
  const params = ctx.data?.data?.actions?.[`${name}:${actionName}`];
  if (!params) {
    return null;
  }
  return <>{props.children}</>;
};

export const ACLCollectionFieldProvider = (props) => {
  return <>{props.children}</>;
};

export const ACLMenuItemProvider = (props) => {
  const ctx = useContext(ACLContext);
  const allowMenuItemIds: Array<string> = ctx.data?.data?.allowMenuItemIds || [];
  const fieldSchema = useFieldSchema();
  if (!fieldSchema['x-uid']) {
    return <>{props.children}</>;
  }
  if (allowMenuItemIds.includes(fieldSchema['x-uid'])) {
    return <>{props.children}</>;
  }
  return null;
};

export default ACLProvider;
