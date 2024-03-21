import { Field } from '@formily/core';
import { Schema, useField, useFieldSchema } from '@formily/react';
import React, { createContext, useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { omit } from 'lodash';
import { useAPIClient, useRequest } from '../api-client';
import { useAppSpin } from '../application/hooks/useAppSpin';
import { useBlockRequestContext } from '../block-provider/BlockProvider';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../collection-manager';
import { useResourceActionContext } from '../collection-manager/ResourceActionProvider';
import { useRecord } from '../record-provider';
import { SchemaComponentOptions, useDesignable } from '../schema-component';
import { useApp } from '../application';
import { useDataSourceKey } from '../data-source/data-source/DataSourceProvider';

export const ACLContext = createContext<any>({});
ACLContext.displayName = 'ACLContext';

// TODO: delete this，replace by `ACLPlugin`
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

export const ACLRolesCheckProvider = (props) => {
  const route = getRouteUrl(props.children.props);
  const { setDesignable } = useDesignable();
  const { render } = useAppSpin();
  const api = useAPIClient();
  const app = useApp();
  const result = useRequest<{
    data: {
      snippets: string[];
      role: string;
      resources: string[];
      actions: any;
      actionAlias: any;
      strategy: any;
      allowAll: boolean;
    };
  }>(
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
        app.pluginSettingsManager.setAclSnippets(data?.data?.snippets || []);
      },
    },
  );
  if (result.loading) {
    return render();
  }
  if (result.error) {
    return <Navigate replace to={'/signin'} />;
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
ACLActionParamsContext.displayName = 'ACLActionParamsContext';

export const useACLRolesCheck = () => {
  const ctx = useContext(ACLContext);
  const dataSourceName = useDataSourceKey();
  const { dataSources: dataSourcesAcl } = ctx?.data?.meta || {};
  const data = { ...ctx?.data?.data, ...omit(dataSourcesAcl?.[dataSourceName], 'snippets') };
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
      const strategyAction = data?.strategy?.actions?.find((action) => {
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
  if (schema?.['x-acl-ignore-scope']) {
    ignoreScope = true;
  }
  if (schema?.['x-acl-action-props']?.['skipScopeCheck']) {
    ignoreScope = true;
  }
  if (!recordPkValue) {
    ignoreScope = true;
  }
  return ignoreScope;
};

const useAllowedActions = () => {
  const service = useResourceActionContext();
  const result = useBlockRequestContext();
  return result?.allowedActions ?? service?.data?.meta?.allowedActions;
};

const useResourceName = () => {
  const service = useResourceActionContext();
  const result = useBlockRequestContext() || { service };
  return result?.props?.resource || result?.props?.collection || result?.service?.defaultRequest?.resource;
};

export function useACLRoleContext() {
  const { data, getActionAlias, inResources, getResourceActionParams, getStrategyActionParams } = useACLRolesCheck();
  const allowedActions = useAllowedActions();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
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
      const targetResource = resourceName?.includes('.') && getCollectionJoinField(resourceName)?.target;
      if (!getIgnoreScope(options)) {
        const r = verifyScope(actionName, options.recordPkValue);
        if (r !== null) {
          return r ? {} : null;
        }
      }
      if (data?.allowAll) {
        return {};
      }
      if (inResources(targetResource)) {
        return getResourceActionParams(`${targetResource}:${actionName}`);
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
    return props.children;
  }
  const actionPath = schema?.['x-acl-action'] || props.actionPath;
  if (!actionPath) {
    return props.children;
  }
  const params = parseAction(actionPath, { schema });
  if (!params) {
    return null;
  }
  const [_, actionName] = actionPath.split(':');
  params.actionName = actionName;
  return <ACLActionParamsContext.Provider value={params}>{props.children}</ACLActionParamsContext.Provider>;
};

export const useACLActionParamsContext = () => {
  return useContext(ACLActionParamsContext);
};

export const useRecordPkValue = () => {
  const { getPrimaryKey } = useCollection_deprecated();
  const record = useRecord();
  const primaryKey = getPrimaryKey();
  return record?.[primaryKey];
};

export const ACLActionProvider = (props) => {
  const { template, writableView } = useCollection_deprecated();
  const recordPkValue = useRecordPkValue();
  const resource = useResourceName();
  const { parseAction } = useACLRoleContext();
  const schema = useFieldSchema();
  let actionPath = schema['x-acl-action'];
  const editablePath = ['create', 'update', 'destroy', 'importXlsx'];
  if (!actionPath && resource && schema['x-action']) {
    actionPath = `${resource}:${schema['x-action']}`;
  }
  if (!actionPath?.includes(':')) {
    actionPath = `${resource}:${actionPath}`;
  }
  if (!actionPath) {
    return <>{props.children}</>;
  }
  const params = parseAction(actionPath, { schema, recordPkValue });
  if (!params) {
    return <ACLActionParamsContext.Provider value={params}>{props.children}</ACLActionParamsContext.Provider>;
  }
  //视图表无编辑权限时不显示
  if (editablePath.includes(actionPath) || editablePath.includes(actionPath?.split(':')[1])) {
    if (template !== 'view' || writableView) {
      return <ACLActionParamsContext.Provider value={params}>{props.children}</ACLActionParamsContext.Provider>;
    }
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
    schemaInWhitelist(fieldSchema: Schema, isSkip?) {
      if (isSkip) {
        return true;
      }
      if (whitelist.length === 0) {
        return true;
      }
      if (!fieldSchema) {
        return true;
      }
      if (!fieldSchema['x-collection-field']) {
        return true;
      }
      const [key1, key2] = fieldSchema['x-collection-field'].split('.');
      return whitelist?.includes(key2 || key1);
    },
  };
};

export const ACLCollectionFieldProvider = (props) => {
  const fieldSchema = useFieldSchema();
  const field = useField<Field>();
  const { allowAll } = useACLRoleContext();
  const { whitelist } = useACLFieldWhitelist();
  const [name] = (fieldSchema.name as string).split('.');
  const allowed = !fieldSchema['x-acl-ignore'] && whitelist.length > 0 ? whitelist.includes(name) : true;
  useEffect(() => {
    if (!allowed) {
      field.required = false;
      field.display = 'hidden';
    }
  }, [allowed]);

  if (allowAll) {
    return <>{props.children}</>;
  }

  if (!fieldSchema['x-collection-field']) {
    return <>{props.children}</>;
  }

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
