import { useFieldSchema, useField } from '@formily/react';
import { Spin, Result } from 'antd';
import React, { createContext, useContext, useEffect } from 'react';
import { last } from 'lodash';
import { Redirect } from 'react-router-dom';
import { useAPIClient, useRequest } from '../api-client';
import { useCollection } from '../collection-manager';
import { useRecordIsOwn } from '../record-provider';
import { useRecord } from '../record-provider';
import { SchemaComponentOptions, useDesignable, FormItem } from '../schema-component';
import { useBlockRequestContext } from '../block-provider/BlockProvider';
import { useResourceActionContext } from '../collection-manager/ResourceActionProvider';
import { InternalAdminLayout } from '../route-switch/antd/admin-layout';
import pathToRegexp from 'path-to-regexp';

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

const getRouteUrl = (props) => {
  if (props?.match) {
    return props.match;
  }
  return props && getRouteUrl(props?.children?.props);
};

const getRouteAclCheck = (match, snippets) => {
  const { url, params } = match;
  if (url === '/admin/pm/list' || params?.pluginName || params?.name?.includes('settings')) {
    const pmAclCheck = url === '/admin/pm/list' && snippets.includes('plugin-manager');
    const pluginTabByName = params?.name.split('/');
    pluginTabByName.shift();
    const pluginName = params.pluginName || pluginTabByName[0];
    const tabName = params.tabName || pluginTabByName[1];
    const pluginTabSnippet = pluginName && tabName && `!settings-center.${pluginName}.${tabName}`;
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
        if (!data?.data?.snippets.includes('ui-editor')) {
          setDesignable(false);
        }
        if (data?.data?.role !== api.auth.role) {
          api.auth.setRole(data?.data?.role);
        }
      },
    },
  );
  const routeAclCheck = route ? !result.loading && getRouteAclCheck(route, result.data?.data.snippets) : true;
  if (result.loading) {
    return <Spin />;
  }
  if (result.error) {
    return <Redirect to={'/signin'} />;
  }
  if (pathToRegexp('/admin/settings/:pluginName?/:tabName?').test(route.url)) {
    return <ACLContext.Provider value={result}>{props.children}</ACLContext.Provider>;
  }
  if (!routeAclCheck) {
    return (
      <ACLContext.Provider value={result}>
        <InternalAdminLayout {...props}>
          <Result status="403" title="403" subTitle="Sorry, you are not authorized to access this page." />
        </InternalAdminLayout>
      </ACLContext.Provider>
    );
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

function transOptionsMap(options) {
  let newOptions = new Map();
  for (const [action, conditions] of [...options.entries()]) {
    conditions.forEach((condition) => newOptions.set(condition, action));
  }
  return newOptions;
}

function getActionName(name) {
  const options = new Map([
    ['destroy', ['delete', 'destroy', 'deleteEvent']],
    ['update', ['update', 'edit', 'bulkUpdate', 'bulkEdit']],
    ['view', ['view', 'get', 'list', '', null, undefined]],
  ]);

  let newOptions = transOptionsMap(options);
  return newOptions.get(name) ? newOptions.get(name) : name;
}
export const useACLRoleContext = () => {
  const ctx = useContext(ACLContext);
  const record = useRecord();
  const fieldSchema = useFieldSchema();
  const data = ctx.data?.data;
  const { name, getPrimaryKeyField } = useCollection();
  const result = useBlockRequestContext() || { service: useResourceActionContext() };
  return {
    ...data,
    getActionParams(actionPath: string, { skipOwnCheck, isOwn }) {
      const path = actionPath;
      const isAclScope = fieldSchema['x-acl-scope'];
      const aclData = path.split(':');
      const resourceName = aclData[0];
      const actionName = last(aclData);
      const act = getActionName(actionName);
      if (isAclScope) {
        const { meta } = result?.service?.data || {};
        const { allowedActions } = meta || {};
        const aclActionScope = allowedActions?.[act] || [];
        return Object.keys(record).length && aclActionScope.length >= 0
          ? aclActionScope?.includes(record[getPrimaryKeyField(name).name])
          : true;
      }
      const currentAction = data?.actionAlias?.[act] || act;
      const hasResource = data?.resources?.includes(resourceName);
      const params = data?.actions?.[`${resourceName}:${currentAction}`] || data?.actions?.[`${resourceName}:${act}`];
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

const ACLActionParamsContext = createContext<any>({});

export const ACLcollectionParamsContext = createContext<any>({});

export const ACLCollectionProvider = (props) => {
  const { allowAll, getActionParams, resources } = useACLRoleContext();
  const fieldSchema = useFieldSchema();
  const isOwn = useRecordIsOwn();
  if (allowAll) {
    return <>{props.children}</>;
  }
  const aclAction = fieldSchema['x-acl-action'];
  const aclResource = fieldSchema['x-acl-resource'];
  const resourceName = aclResource?.find((v) => resources.includes(v));
  const path = resourceName ? `${resourceName}:${last(aclAction.split(':'))}` : aclAction;
  const skipScopeCheck = fieldSchema['x-acl-action-props']?.skipScopeCheck;
  if (!path) {
    return <>{props.children}</>;
  }
  const params = getActionParams(path, { isOwn, skipOwnCheck: skipScopeCheck === false ? false : true });
  if (!params) {
    return null;
  }
  return <ACLcollectionParamsContext.Provider value={params}>{props.children}</ACLcollectionParamsContext.Provider>;
};


export const ACLActionProvider = (props) => {
  const fieldSchema = useFieldSchema();
  const field = useField<any>();
  const { name } = useCollection();
  const isOwn = useRecordIsOwn();
  const record = useRecord();
  const { allowAll, getActionParams, resources } = useACLRoleContext();
  const actionName = fieldSchema['x-action'];
  const aclResource = fieldSchema.parent['x-acl-resource'] || [];
  const resourceName = aclResource.find((v) => resources.includes(v));
  fieldSchema['x-acl-scope'] = Object.keys(record).length > 0;
  const path = fieldSchema['x-acl-action']?.includes(':')
    ? fieldSchema['x-acl-action']
    : `${resourceName || name}:${fieldSchema['x-acl-action'] || actionName}`;
  const skipScopeCheck = fieldSchema['x-acl-action-props']?.skipScopeCheck;
  const params = getActionParams(path, { skipOwnCheck: skipScopeCheck, isOwn });
  useEffect(() => {
    if (allowAll) {
      field.disabled = false;
    } else {
      field.disabled = !params;
    }
  });
  if (!name || allowAll) {
    return <>{props.children}</>;
  }
  return <ACLActionParamsContext.Provider value={params}>{props.children}</ACLActionParamsContext.Provider>;
};

export const ACLCollectionFieldProvider = (props) => {
  const { name } = useCollection();
  const fieldSchema = useFieldSchema();
  const { allowAll } = useACLRoleContext();
  const params = useContext(ACLcollectionParamsContext);
  if (!name || allowAll) {
    return <FormItem>{props.children}</FormItem>;
  }
  const fieldWhiteList = params?.whitelist || params?.fields?.concat(params?.appends);
  const aclFieldCheck = fieldWhiteList ? fieldWhiteList?.includes(fieldSchema.name) : true;
  if (!aclFieldCheck) {
    return null;
  }
  return (
    <ACLActionParamsContext.Provider value={params}>
      <FormItem>{props.children}</FormItem>
    </ACLActionParamsContext.Provider>
  );
};

export const ACLMenuItemProvider = (props) => {
  const { allowAll, allowMenuItemIds = [], snippets } = useACLRoleContext();
  const fieldSchema = useFieldSchema();
  if (allowAll || snippets.includes('ui-editor')) {
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
