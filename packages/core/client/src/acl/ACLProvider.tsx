import { useFieldSchema } from '@formily/react';
import { Spin } from 'antd';
import React, { createContext, useContext } from 'react';
import { Redirect } from 'react-router-dom';
import { useAPIClient, useRequest } from '../api-client';
import { useCollection } from '../collection-manager';
import { useRecordIsOwn } from '../record-provider';
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
  const api = useAPIClient();
  const result = useRequest(
    {
      url: 'roles:check',
    },
    {
      onSuccess(data) {
        if (!data?.data?.allowConfigure && !data?.data?.allowAll) {
          setDesignable(false);
        }
        if (data?.data?.role !== api.auth.role) {
          api.auth.setRole(data?.data?.role);
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

export const useRoleRecheck = () => {
  const ctx = useContext(ACLContext);
  const { allowAll, allowConfigure } = useACLRoleContext();
  return () => {
    if (allowAll || allowConfigure) {
      return;
    }
    ctx.refresh();
  };
};

export const useACLContext = () => {
  return useContext(ACLContext);
};

export const useACLRoleContext = () => {
  const ctx = useContext(ACLContext);
  const data = ctx.data?.data;

  return {
    ...data,
    getActionParams(path: string, { skipOwnCheck, isOwn }) {
      const [resourceName, act] = path.split(':');
      const currentAction = data?.actionAlias?.[act] || act;
      const hasResource = data?.resources?.includes(resourceName);
      const params = data?.actions?.[`${resourceName}:${currentAction}`];
      if (hasResource) {
        if (!skipOwnCheck && params?.own) {
          return isOwn ? params : null;
        }
        return params;
      }
      const strategyActions = data?.strategy?.actions || [];
      const strategyAction = strategyActions?.find((action) => {
        const [value] = action.split(':');
        return value === currentAction;
      });
      if (!strategyAction) {
        return;
      }
      if (skipOwnCheck) {
        return {};
      }
      const [, actionScope] = strategyAction.split(':');
      if (actionScope === 'own') {
        return isOwn;
      }
      return {};
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

const ACLActionParamsContext = createContext<any>({});

export const ACLCollectionProvider = (props) => {
  const { allowAll, allowConfigure, getActionParams } = useACLRoleContext();
  const fieldSchema = useFieldSchema();
  const isOwn = useRecordIsOwn();
  if (allowAll || allowConfigure) {
    return <>{props.children}</>;
  }
  const path = fieldSchema['x-acl-action'];
  const skipScopeCheck = fieldSchema['x-acl-action-props']?.skipScopeCheck;
  if (!path) {
    return <>{props.children}</>;
  }
  const params = getActionParams(path, { isOwn, skipOwnCheck: skipScopeCheck === false ? false : true });
  if (!params) {
    return null;
  }
  return <ACLActionParamsContext.Provider value={params}>{props.children}</ACLActionParamsContext.Provider>;
};

export const ACLActionProvider = (props) => {
  const { name } = useCollection();
  const fieldSchema = useFieldSchema();
  const isOwn = useRecordIsOwn();
  const { allowAll, allowConfigure, getActionParams } = useACLRoleContext();
  if (!name || allowAll || allowConfigure) {
    return <>{props.children}</>;
  }
  const actionName = fieldSchema['x-action'];
  const path = fieldSchema['x-acl-action'] || `${name}:${actionName}`;
  const skipScopeCheck = fieldSchema['x-acl-action-props']?.skipScopeCheck;
  const params = getActionParams(path, { skipOwnCheck: skipScopeCheck, isOwn });
  if (!params) {
    return null;
  }
  return <ACLActionParamsContext.Provider value={params}>{props.children}</ACLActionParamsContext.Provider>;
};

export const ACLCollectionFieldProvider = (props) => {
  return <>{props.children}</>;
};

export const ACLMenuItemProvider = (props) => {
  const { allowAll, allowConfigure, allowMenuItemIds = [] } = useACLRoleContext();
  const fieldSchema = useFieldSchema();
  if (allowAll || allowConfigure) {
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
