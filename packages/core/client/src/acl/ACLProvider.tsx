import { Schema, useFieldSchema } from '@formily/react';
import { Spin } from 'antd';
import React, { createContext, useContext } from 'react';
import { Redirect } from 'react-router-dom';
import { useAPIClient, useRequest } from '../api-client';
import { useBlockRequestContext } from '../block-provider/BlockProvider';
import { useCollection } from '../collection-manager';
import { useResourceActionContext } from '../collection-manager/ResourceActionProvider';
import { useRecord } from '../record-provider';
import { SchemaComponentOptions, useDesignable } from '../schema-component';

export const ACLContext = createContext<any>({});

export const ACLProvider = (props) => {
  return (
    <SchemaComponentOptions
      components={{ ACLCollectionFieldProvider, ACLActionProvider, ACLMenuItemProvider, ACLCollectionProvider }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};

const getRouteUrl = (props) => {
  if (props?.match) {
    return props.match;
  }
  return props && getRouteUrl(props?.children?.props);
};

const getRouteAclCheck = (match, snippets) => {
  const { url, params } = match;
  if (url === '/admin/pm/list' || params?.pluginName || params?.name?.includes('settings')) {
    const pmAclCheck = url === '/admin/pm/list' && snippets.includes('pm');
    const pluginTabByName = params?.name.split('/');
    pluginTabByName.shift();
    const pluginName = params.pluginName || pluginTabByName[0];
    const tabName = params.tabName || pluginTabByName[1];
    const pluginTabSnippet = pluginName && tabName && `!pm.${pluginName}.${tabName}`;
    const pluginTabAclCheck = pluginTabSnippet && !snippets.includes(pluginTabSnippet);
    return pmAclCheck || pluginTabAclCheck;
  }
  return true;
};
export const ACLRolesCheckProvider = (props) => {
  const route = getRouteUrl(props.children.props);
  const { setDesignable } = useDesignable();
  const api = useAPIClient();
  const result = useRequest(
    {
      url: 'roles:check',
    },
    {
      onSuccess(data) {
        if (!data?.data?.snippets.includes('ui.*')) {
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
  const { allowAll } = useACLRoleContext();
  return () => {
    if (allowAll) {
      return;
    }
    ctx.refresh();
  };
};

export const useACLContext = () => {
  return useContext(ACLContext);
};

export const ACLActionParamsContext = createContext<any>({});

export const useACLRolesCheck = () => {
  const ctx = useContext(ACLContext);
  const data = ctx?.data?.data;
  const getActionAlias = (actionPath: string) => {
    const actionName = actionPath.split(':').pop();
    return data?.actionAlias?.[actionName] || actionName;
  };
  return {
    data,
    getActionAlias,
    inResources: (resourceName: string) => {
      return data?.resources?.includes?.(resourceName);
    },
    getResourceActionParams: (actionPath: string) => {
      const [resourceName] = actionPath.split(':');
      const actionAlias = getActionAlias(actionPath);
      return data?.actions?.[`${resourceName}:${actionAlias}`] || data?.actions?.[actionPath];
    },
    getStrategyActionParams: (actionPath: string) => {
      const actionAlias = getActionAlias(actionPath);
      const strategyAction = data?.strategy?.actions.find((action) => {
        const [value] = action.split(':');
        return value === actionAlias;
      });
      return strategyAction ? {} : null;
    },
  };
};

const getIgnoreScope = (options: any = {}) => {
  const { schema, recordPkValue } = options;
  let ignoreScope = false;
  if (options.ignoreScope) {
    ignoreScope = true;
  }
  if (schema['x-acl-ignore-scope']) {
    ignoreScope = true;
  }
  if (schema['x-acl-action-props']?.['skipScopeCheck']) {
    ignoreScope = true;
  }
  if (!recordPkValue) {
    ignoreScope = true;
  }
  return ignoreScope;
};

const useAllowedActions = () => {
  const result = useBlockRequestContext() || { service: useResourceActionContext() };
  return result?.service?.data?.meta?.allowedActions;
};

const useResourceName = () => {
  const result = useBlockRequestContext() || { service: useResourceActionContext() };
  return result?.props?.resource || result?.service?.defaultRequest?.resource;
};

export function useACLRoleContext() {
  const { data, getActionAlias, inResources, getResourceActionParams, getStrategyActionParams } = useACLRolesCheck();
  const allowedActions = useAllowedActions();
  const verifyScope = (actionName: string, recordPkValue: any) => {
    const actionAlias = getActionAlias(actionName);
    if (!Array.isArray(allowedActions?.[actionAlias])) {
      return null;
    }
    return allowedActions[actionAlias].includes(recordPkValue);
  };
  return {
    ...data,
    parseAction: (actionPath: string, options: any = {}) => {
      const [resourceName, actionName] = actionPath.split(':');
      if (!getIgnoreScope(options)) {
        const r = verifyScope(actionName, options.recordPkValue);
        if (r !== null) {
          return r ? {} : null;
        }
      }
      if (data?.allowAll) {
        return {};
      }
      if (inResources(resourceName)) {
        return getResourceActionParams(actionPath);
      }
      return getStrategyActionParams(actionPath);
    },
  };
}

export const ACLCollectionProvider = (props) => {
  const { allowAll, parseAction } = useACLRoleContext();
  const schema = useFieldSchema();
  if (allowAll) {
    return <>{props.children}</>;
  }
  const actionPath = schema['x-acl-action'];
  if (!actionPath) {
    return <>{props.children}</>;
  }
  const params = parseAction(actionPath, { schema });
  if (!params) {
    return null;
  }
  return <ACLActionParamsContext.Provider value={params}>{props.children}</ACLActionParamsContext.Provider>;
};

export const useACLActionParamsContext = () => {
  return useContext(ACLActionParamsContext);
};

export const useRecordPkValue = () => {
  const { getPrimaryKey } = useCollection();
  const record = useRecord();
  const primaryKey = getPrimaryKey();
  return record?.[primaryKey];
};

export const ACLActionProvider = (props) => {
  const recordPkValue = useRecordPkValue();
  const resource = useResourceName();
  const { parseAction } = useACLRoleContext();
  const schema = useFieldSchema();
  let actionPath = schema['x-acl-action'];
  if (!actionPath && resource && schema['x-action']) {
    actionPath = `${resource}:${schema['x-action']}`;
  }
  if (!actionPath.includes(':')) {
    actionPath = `${resource}:${actionPath}`;
  }
  if (!actionPath) {
    return <>{props.children}</>;
  }
  const params = parseAction(actionPath, { schema, recordPkValue });
  if (!params) {
    return null;
  }
  return <ACLActionParamsContext.Provider value={params}>{props.children}</ACLActionParamsContext.Provider>;
};

export const useACLFieldWhitelist = () => {
  const params = useContext(ACLActionParamsContext);
  const whitelist = []
    .concat(params?.whitelist || [])
    .concat(params?.fields || [])
    .concat(params?.appends || []);
  return {
    whitelist,
    schemaInWhitelist(fieldSchema: Schema) {
      if (whitelist.length === 0) {
        return true;
      }
      if (!fieldSchema) {
        return true;
      }
      if (!fieldSchema['x-collection-field']) {
        return true;
      }
      const [, ...keys] = fieldSchema['x-collection-field'].split('.');
      return whitelist?.includes(keys.join('.'));
    },
  };
};

export const ACLCollectionFieldProvider = (props) => {
  const fieldSchema = useFieldSchema();
  const { allowAll } = useACLRoleContext();
  if (allowAll) {
    return <>{props.children}</>;
  }
  if (!fieldSchema['x-collection-field']) {
    return <>{props.children}</>;
  }
  const { whitelist } = useACLFieldWhitelist();
  const allowed = whitelist.length > 0 ? whitelist.includes(fieldSchema.name) : true;
  if (!allowed) {
    return null;
  }
  return <>{props.children}</>;
};

export const ACLMenuItemProvider = (props) => {
  const { allowAll, allowMenuItemIds = [], snippets } = useACLRoleContext();
  const fieldSchema = useFieldSchema();
  if (allowAll || snippets.includes('ui.*')) {
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
