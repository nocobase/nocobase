/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { IResource } from '@nocobase/sdk';
import { merge } from '@formily/shared';
import { getDateVars, getValuesByPath, isNumeric, parseFilter, type ParseFilterOptions } from '@nocobase/utils/client';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';
import { assign } from '../../api-client/hooks/assign';

type LocalVariable = {
  name: string;
  ctx: any;
};

export async function parseFilterParam(filter: any, scope: ParseFilterOptions = {}) {
  if (!filter) {
    return filter;
  }
  let parsedInput = filter;
  const isStringFilter = typeof filter === 'string';
  if (isStringFilter) {
    try {
      parsedInput = JSON.parse(filter);
    } catch (error) {
      return filter;
    }
  }

  if (parsedInput == null || typeof parsedInput !== 'object') {
    return filter;
  }

  const parsedFilter = await parseFilter(parsedInput, scope);
  return isStringFilter ? JSON.stringify(parsedFilter) : parsedFilter;
}

export function collectRuntimeVariables(globalVars: Record<string, any> = {}, localVariables: LocalVariable[] = []) {
  const vars = {
    ...globalVars,
  };
  for (const variable of localVariables) {
    vars[variable.name] = variable.ctx;
  }
  return vars;
}

export function createParseFilterScope(options: {
  vars: Record<string, any>;
  currentRole?: string;
  timezone?: string;
  now?: string;
  getField: (path: string) => any;
}): ParseFilterOptions {
  const { vars, currentRole, timezone, getField } = options;
  const now = options.now || new Date().toISOString();
  const currentUser = vars.$user;
  const currentRoles = Array.isArray(currentUser?.roles)
    ? currentUser.roles.map((role) => role?.name).filter(Boolean)
    : [];

  return {
    timezone,
    now,
    getField: (path) => {
      const fieldPath = path
        .split('.')
        .filter((p) => p && !p.startsWith('$') && !isNumeric(p))
        .join('.');
      if (!fieldPath) {
        return;
      }
      return getField(fieldPath);
    },
    vars: {
      ...vars,
      ctx: {
        state: {
          ...(vars?.ctx?.state || {}),
          currentUser,
          currentRole,
          currentRoles,
        },
      },
      // @deprecated
      $system: {
        now,
      },
      // @deprecated
      $date: getDateVars(),
      $nDate: getDateVars(),
      $user: async ({ fields = [] }: { fields: string[] }) => {
        if (!currentUser) {
          return;
        }
        if (!fields.length) {
          return currentUser;
        }
        const result = {};
        for (const field of fields) {
          if (!field) {
            continue;
          }
          const value = getValuesByPath(currentUser, field);
          if (value !== undefined) {
            set(result, field, value);
          }
        }
        return result;
      },
      $nRole: currentRole === '__union__' ? currentRoles : currentRole,
    },
  };
}

export function createParsedResource(
  resource: IResource,
  options: {
    resourceName?: string;
    getScope: () => ParseFilterOptions | Promise<ParseFilterOptions>;
  },
): IResource {
  const { resourceName, getScope } = options;
  return new Proxy(resource, {
    get(target: IResource, actionName: string) {
      const action = target?.[actionName];
      if (typeof action !== 'function') {
        return action;
      }

      return async (params?: any, opts?: any) => {
        if (!params?.filter || !resourceName) {
          return action(params, opts);
        }

        const scope = await getScope();
        const filter = await parseFilterParam(params.filter, scope);
        if (filter === params.filter) {
          return action(params, opts);
        }

        return action(
          {
            ...params,
            filter,
          },
          opts,
        );
      };
    },
  });
}

export function createParsedRequestService(options: {
  request?: any;
  resourceName?: string;
  getScope: () => ParseFilterOptions | Promise<ParseFilterOptions>;
  execute: (request: any) => Promise<any>;
}) {
  const { request, resourceName, getScope, execute } = options;
  if (!request) {
    return async () => undefined;
  }

  return async (params: Record<string, any> = {}) => {
    const { resource, url } = request;
    let args = cloneDeep(request);

    if (resource || url) {
      args.params = args.params || {};
      assign(args.params, params);
    } else {
      args = merge(args, params);
    }

    if (args?.params?.filter && resourceName) {
      const scope = await getScope();
      const filter = await parseFilterParam(args.params.filter, scope);
      if (filter !== args.params.filter) {
        args.params = {
          ...args.params,
          filter,
        };
      }
    }

    const response = await execute(args);
    return response?.data;
  };
}
