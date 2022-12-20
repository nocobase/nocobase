import { useFieldSchema, useField } from '@formily/react';
import { Spin, Result } from 'antd';
import React, { createContext, useContext, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import { useAPIClient, useRequest } from '../api-client';
import { useCollection } from '../collection-manager';
import { useRecordIsOwn } from '../record-provider';
import { useRecord } from '../record-provider';
import { SchemaComponentOptions, useDesignable, FormItem } from '../schema-component';
import { useBlockRequestContext } from '../block-provider/BlockProvider';
import { useResourceActionContext } from '../collection-manager/ResourceActionProvider';

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
  return getRouteUrl(props.children.props);
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
  const routeAclCheck = !result.loading && getRouteAclCheck(route, result.data?.data.snippets);
  if (result.loading) {
    return <Spin />;
  }
  if (result.error) {
    return <Redirect to={'/signin'} />;
  }
  if (!routeAclCheck) {
    return (
      <ACLContext.Provider value={result}>
        <Result status="403" title="403" subTitle="Sorry, you are not authorized to access this page." />
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

export const useACLRoleContext = () => {
  const ctx = useContext(ACLContext);
  const data = ctx.data?.data;

  return {
    ...data,
    getActionParams(path: string, { skipOwnCheck, isOwn }) {
      const [resourceName, act] = path.split(':');
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

export const ACLCollectionProvider = (props) => {
  const { allowAll, getActionParams } = useACLRoleContext();
  const fieldSchema = useFieldSchema();
  const isOwn = useRecordIsOwn();
  if (allowAll) {
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

const isBlockRequest = (schema) => {
  if (schema['x-decorator'] === 'TableBlockProvider') {
    return true;
  } else {
    return schema.parent && isBlockRequest(schema.parent);
  }
};

export const ACLActionProvider = (props) => {
  const fieldSchema = useFieldSchema();
  const record = useRecord();
  const field = useField<any>();
  const { name, getPrimaryKeyField } = useCollection();
  const { service } = isBlockRequest(fieldSchema) ? useBlockRequestContext() : { service: useResourceActionContext() };
  const { meta } = service?.data || {};
  const { allowedActions } = meta || {};
  const isOwn = useRecordIsOwn();
  const { allowAll, getActionParams } = useACLRoleContext();
  const actionName = fieldSchema['x-action'];
  const path = fieldSchema['x-acl-action'] || `${name}:${actionName}`;
  const actionScope = allowedActions?.[path.split(':')[1]] || [];
  const actionScopeCheck =
    Object.keys(record).length && actionScope.length >= 0
      ? actionScope?.includes(record[getPrimaryKeyField(name).name])
      : true;
  const skipScopeCheck = fieldSchema['x-acl-action-props']?.skipScopeCheck;
  const params = getActionParams(path, { skipOwnCheck: skipScopeCheck, isOwn });
  useEffect(() => {
    if (allowAll) {
      field.disabled = false;
    } else {
      field.disabled = (!params && !actionScope.length) || !actionScopeCheck;
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
  const { allowAll, getActionParams } = useACLRoleContext();
  const actionName = fieldSchema['x-action'] || 'view';
  const findAclAction = (schema) => {
    if (schema['x-acl-action']) {
      return schema['x-acl-action'];
    } else {
      return schema.parent ? findAclAction(schema.parent) : `${name}:${actionName}`;
    }
  };
  const path = findAclAction(fieldSchema);
  const skipScopeCheck = fieldSchema['x-acl-action-props']?.skipScopeCheck;
  const isOwn = useRecordIsOwn();
  if (!name || allowAll) {
    return <FormItem>{props.children}</FormItem>;
  }
  const params = getActionParams(path, { skipOwnCheck: skipScopeCheck, isOwn });
  const aclFieldCheck = params ? (params.whitelist || params.fields)?.includes(fieldSchema.name) : false;
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
