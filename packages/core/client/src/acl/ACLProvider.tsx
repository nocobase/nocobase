/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// 注意: 这行必须放到顶部，否则会导致 Data sources 页面报错，原因未知
import { useBlockRequestContext } from '../block-provider/BlockProvider';

import { Field } from '@formily/core';
import { Schema, useField, useFieldSchema } from '@formily/react';
import { omit } from 'lodash';
import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useAPIClient, useRequest } from '../api-client';
import { useAppSpin } from '../application/hooks/useAppSpin';
import { useResourceActionContext } from '../collection-manager/ResourceActionProvider';
import {
  CollectionNotAllowViewPlaceholder,
  useCollection,
  useCollectionManager,
  useCollectionRecordData,
  useDataBlockProps,
  useDataBlockRequest,
} from '../data-source';
import { useDataSourceKey } from '../data-source/data-source/DataSourceProvider';
import { SchemaComponentOptions, useDesignable } from '../schema-component';

import { useApp } from '../application';

// 注意: 必须要对 useBlockRequestContext 进行引用，否则会导致 Data sources 页面报错，原因未知
useBlockRequestContext;

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
      manual: !api.auth.token,
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

export const useCurrentRoleMode = () => {
  const ctx = useContext(ACLContext);
  return ctx?.data?.data?.roleMode;
};

export const useACLContext = () => {
  return useContext(ACLContext);
};

export const ACLActionParamsContext = createContext<any>({});
ACLActionParamsContext.displayName = 'ACLActionParamsContext';

export const ACLCustomContext = createContext<any>({});
ACLCustomContext.displayName = 'ACLCustomContext';

const useACLCustomContext = () => {
  return useContext(ACLCustomContext);
};

export const useACLRolesCheck = () => {
  const ctx = useContext(ACLContext);
  const dataSourceName = useDataSourceKey();
  const { dataSources: dataSourcesAcl } = ctx?.data?.meta || {};
  const data = { ...ctx?.data?.data, ...omit(dataSourcesAcl?.[dataSourceName], 'snippets') };
  const getActionAlias = useCallback(
    (actionPath: string) => {
      const actionName = actionPath.split(':').pop();
      return data?.actionAlias?.[actionName] || actionName;
    },
    [data?.actionAlias],
  );
  return {
    data,
    getActionAlias,
    inResources: useCallback(
      (resourceName: string) => {
        return data?.resources?.includes?.(resourceName);
      },
      [data?.resources],
    ),
    getResourceActionParams: useCallback(
      (actionPath: string) => {
        const [resourceName] = actionPath.split(':');
        const actionAlias = getActionAlias(actionPath);
        return data?.actions?.[`${resourceName}:${actionAlias}`] || data?.actions?.[actionPath];
      },
      [data?.actions, getActionAlias],
    ),
    getStrategyActionParams: useCallback(
      (actionPath: string) => {
        const actionAlias = getActionAlias(actionPath);
        const strategyAction = data?.strategy?.actions?.find((action) => {
          const [value] = action.split(':');
          return value === actionAlias;
        });
        return strategyAction ? {} : null;
      },
      [data?.strategy?.actions, getActionAlias],
    ),
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
  const dataBlockRequest: any = useDataBlockRequest();
  return service?.data?.meta?.allowedActions || dataBlockRequest?.data?.meta?.allowedActions;
};

const useResourceName = () => {
  const service = useResourceActionContext();
  const dataBlockProps = useDataBlockProps();
  return (
    dataBlockProps?.resource ||
    dataBlockProps?.association ||
    dataBlockProps?.collection ||
    service?.defaultRequest?.resource
  );
};

export function useACLRoleContext() {
  const { data, getActionAlias, inResources, getResourceActionParams, getStrategyActionParams } = useACLRolesCheck();
  const allowedActions = useAllowedActions();
  const cm = useCollectionManager();
  const verifyScope = useCallback(
    (actionName: string, recordPkValue: any) => {
      const actionAlias = getActionAlias(actionName);
      if (!Array.isArray(allowedActions?.[actionAlias])) {
        return null;
      }
      return allowedActions[actionAlias].includes(recordPkValue);
    },
    [allowedActions, getActionAlias],
  );
  return {
    ...data,
    snippets: data?.snippets || [],
    parseAction: useCallback(
      (actionPath: string, options: any = {}) => {
        const [resourceName, actionName] = actionPath?.split(':') || [];
        const targetResource = resourceName?.includes('.') && cm.getCollectionField(resourceName)?.target;
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
      [cm, data?.allowAll, getResourceActionParams, getStrategyActionParams, inResources, verifyScope],
    ),
  };
}

/**
 * Used to get whether the current user has permission to configure UI
 * @returns {allowConfigUI: boolean}
 */
export function useUIConfigurationPermissions(): { allowConfigUI: boolean } {
  const { allowAll, snippets } = useACLRoleContext();
  return {
    allowConfigUI: allowAll || snippets.includes('ui.*'),
  };
}

export const ACLCollectionProvider = (props) => {
  const { allowAll, parseAction } = useACLRoleContext();
  const { allowAll: customAllowAll } = useACLCustomContext();
  const app = useApp();
  const schema = useFieldSchema();

  let actionPath = schema?.['x-acl-action'] || props.actionPath;
  const resoureName = schema?.['x-decorator-props']?.['association'] || schema?.['x-decorator-props']?.['collection'];

  // 兼容 undefined 的情况
  if (actionPath === 'undefined:list' && resoureName && resoureName !== 'undefined') {
    actionPath = `${resoureName}:list`;
  }

  const params = useMemo(() => {
    if (!actionPath) {
      return null;
    }
    return parseAction(actionPath, { schema });
  }, [parseAction, actionPath, schema]);

  if (allowAll || app.disableAcl || customAllowAll) {
    return props.children;
  }
  if (!actionPath) {
    return <ACLActionParamsContext.Provider value={{}}>{props.children}</ACLActionParamsContext.Provider>;
  }

  if (!params) {
    return <CollectionNotAllowViewPlaceholder />;
  }
  const [_, actionName] = actionPath.split(':');
  params.actionName = actionName;
  return <ACLActionParamsContext.Provider value={params}>{props.children}</ACLActionParamsContext.Provider>;
};

export const useACLActionParamsContext = () => {
  return useContext(ACLActionParamsContext);
};

export const useRecordPkValue = () => {
  const collection = useCollection();
  const recordData = useCollectionRecordData();

  if (!collection) {
    return;
  }

  const primaryKey = collection.getPrimaryKey();
  return recordData?.[primaryKey];
};

export const ACLActionProvider = (props) => {
  const collection = useCollection();
  const recordPkValue = useRecordPkValue();
  const resource = useResourceName();
  const { parseAction, uiButtonSchemasBlacklist } = useACLRoleContext();
  const schema = useFieldSchema();
  const currentUid = schema['x-uid'];
  let actionPath = schema['x-acl-action'];
  // 只兼容这些数据表资源按钮
  const resourceActionPath = ['create', 'update', 'destroy', 'importXlsx', 'export'];
  // 视图表无编辑权限时不支持的操作
  const writableViewCollectionAction = ['create', 'update', 'destroy', 'importXlsx', 'bulkDestroy', 'bulkUpdate'];

  if (!actionPath && resource && schema['x-action'] && resourceActionPath.includes(schema['x-action'])) {
    actionPath = `${resource}:${schema['x-action']}`;
  }
  if (actionPath && !actionPath?.includes(':')) {
    actionPath = `${resource}:${actionPath}`;
  }
  const params = useMemo(
    () => actionPath && parseAction(actionPath, { schema, recordPkValue }),
    [parseAction, actionPath, schema, recordPkValue],
  );
  if (uiButtonSchemasBlacklist?.includes(currentUid)) {
    return <ACLActionParamsContext.Provider value={false}>{props.children}</ACLActionParamsContext.Provider>;
  }
  if (!actionPath) {
    return <>{props.children}</>;
  }
  if (!resource) {
    return <>{props.children}</>;
  }
  if (!params) {
    return <ACLActionParamsContext.Provider value={params}>{props.children}</ACLActionParamsContext.Provider>;
  }
  //视图表无编辑权限时不支持 writableViewCollectionAction 的按钮
  if (
    writableViewCollectionAction.includes(actionPath) ||
    writableViewCollectionAction.includes(actionPath?.split(':')[1])
  ) {
    if ((collection && collection.template !== 'view') || collection?.writableView) {
      return <ACLActionParamsContext.Provider value={params}>{props.children}</ACLActionParamsContext.Provider>;
    }
    return <ACLActionParamsContext.Provider value={false}>{props.children}</ACLActionParamsContext.Provider>;
  }
  return <ACLActionParamsContext.Provider value={params}>{props.children}</ACLActionParamsContext.Provider>;
};
export const useACLFieldWhitelist = () => {
  const params = useContext(ACLActionParamsContext);
  const whitelist = useMemo(() => {
    return []
      .concat(params?.whitelist || [])
      .concat(params?.fields || [])
      .concat(params?.appends || []);
  }, [params?.whitelist, params?.fields, params?.appends]);
  return {
    whitelist,
    schemaInWhitelist: useCallback(
      (fieldSchema: Schema | any, isSkip?) => {
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
        const [associationField] = fieldSchema['name'].split('.');
        return whitelist?.includes(associationField || key2 || key1);
      },
      [whitelist],
    ),
  };
};

export const ACLCollectionFieldProvider = (props) => {
  const fieldSchema = useFieldSchema();
  const field = useField<Field>();
  const { allowAll } = useACLRoleContext();
  const { whitelist } = useACLFieldWhitelist();
  const [name] = (fieldSchema.name as string).split('.');
  const allowed =
    !fieldSchema['x-acl-ignore'] && whitelist.length > 0 && fieldSchema?.['x-collection-field']
      ? whitelist.includes(name)
      : true;
  useEffect(() => {
    if (!allowed) {
      field.required = false;
      field.display = 'hidden';
    }
  }, [allowed, field]);

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
  // 这里的权限控制已经在后端处理了
  return <>{props.children}</>;
};
