import { useFieldSchema } from '@formily/react';
import { Spin } from 'antd';
import React, { createContext, useContext } from 'react';
import { Redirect } from 'react-router-dom';
import { useRequest } from '../api-client';
import { useCollection } from '../collection-manager';
import { SchemaComponentOptions, useDesignable } from '../schema-component';

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
  const { setDesignable } = useDesignable();
  const result = useRequest(
    {
      url: 'roles:check',
    },
    {
      onSuccess(data) {
        if (!data?.data?.allowConfigure && !data?.data?.allowAll) {
          setDesignable(false);
        }
      },
    },
  );
  if (result.loading) {
    return <Spin />;
  }
  if (result.error) {
    return <Redirect to={'/signin'} />;
  }
  return <ACLContext.Provider value={result}>{props.children}</ACLContext.Provider>;
};

export const useACLRoleContext = () => {
  const ctx = useContext(ACLContext);
  const data = ctx.data?.data;
  return {
    ...data,
    getActionParams(path) {
      return data?.actions?.[path];
    },
  };
};

export const ACLAllowConfigure = (props) => {
  const { allowAll, allowConfigure } = useACLRoleContext();
  if (allowAll || allowConfigure) {
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
  const { allowAll, getActionParams } = useACLRoleContext();
  if (!name || allowAll) {
    return <>{props.children}</>;
  }
  const actionName = fieldSchema['x-action'];
  const params = getActionParams([`${name}:${actionName}`]);
  if (!params) {
    return null;
  }
  return <>{props.children}</>;
};

export const ACLCollectionFieldProvider = (props) => {
  return <>{props.children}</>;
};

export const ACLMenuItemProvider = (props) => {
  const { allowAll, allowMenuItemIds = [] } = useACLRoleContext();
  const fieldSchema = useFieldSchema();
  if (allowAll) {
    return <>{props.children}</>;
  }
  if (!fieldSchema['x-uid']) {
    return <>{props.children}</>;
  }
  if (allowMenuItemIds.includes(fieldSchema['x-uid'])) {
    return <>{props.children}</>;
  }
  return null;
};

export default ACLProvider;
