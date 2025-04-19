/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
// @ts-ignore
import { pathToRegexp } from 'path-to-regexp';
import qs from 'qs';
import { ResourceType } from './resource';

export interface ParseRequest {
  path: string;
  method: string;
  namespace?: string;
  // 资源类型
  type?: ResourceType;
}

export interface ParseOptions {
  prefix?: string;
  accessors?: {
    list?: string;
    create?: string;
    get?: string;
    update?: string;
    delete?: string;
    set?: string;
    add?: string;
  };
}

export interface ParsedParams {
  actionName?: string;
  resourceName?: string;
  resourceIndex?: string;
  associatedName?: string;
  associatedIndex?: string;
  // table: string;
  // tableKey?: string | number;
  // relatedTable?: string;
  // relatedKey?: string | number;
  // action?: ActionName,
}

export function getNameByParams(params: ParsedParams): string {
  const { resourceName, associatedName } = params;
  return associatedName ? `${associatedName}.${resourceName}` : resourceName;
}

export function parseRequest(request: ParseRequest, options: ParseOptions = {}): ParsedParams | false {
  const accessors = {
    // 常规 actions
    list: 'list',
    create: 'create',
    get: 'get',
    update: 'update',
    delete: 'destroy',
    // associate 操作
    add: 'add',
    set: 'set',
    remove: 'remove',
    ...(options.accessors || {}),
  };
  const keys = [];

  const regexp = pathToRegexp('/resourcer/:rest(.*)', keys);
  const reqPath = decodeURI(request.path);
  const matches = regexp.exec(reqPath);
  if (matches) {
    const params = {};
    const [resource, action] = matches[1].split(':');
    const [res1, res2] = resource.split('.');
    if (res1) {
      if (res2) {
        params['associatedName'] = res1;
        params['resourceName'] = res2;
      } else {
        params['resourceName'] = res1;
      }
    }
    if (action) {
      params['actionName'] = action;
    }
    return params;
  }
  const defaults = {
    single: {
      '/:resourceName': {
        get: accessors.list,
        post: accessors.create,
        delete: accessors.delete,
      },
      '/:resourceName/:resourceIndex': {
        get: accessors.get,
        put: accessors.update,
        patch: accessors.update,
        delete: accessors.delete,
      },
      '/:associatedName/:associatedIndex/:resourceName': {
        get: accessors.list,
        post: accessors.create,
        delete: accessors.delete,
      },
      '/:associatedName/:associatedIndex/:resourceName/:resourceIndex': {
        get: accessors.get,
        post: accessors.create,
        put: accessors.update,
        patch: accessors.update,
        delete: accessors.delete,
      },
    },
    hasOne: {
      '/:associatedName/:associatedIndex/:resourceName': {
        get: accessors.get,
        post: accessors.update,
        put: accessors.update,
        patch: accessors.update,
        delete: accessors.delete,
      },
    },
    hasMany: {
      '/:associatedName/:associatedIndex/:resourceName': {
        get: accessors.list,
        post: accessors.create,
        delete: accessors.delete,
      },
      '/:associatedName/:associatedIndex/:resourceName/:resourceIndex': {
        get: accessors.get,
        post: accessors.create,
        put: accessors.update,
        patch: accessors.update,
        delete: accessors.delete,
      },
    },
    belongsTo: {
      '/:associatedName/:associatedIndex/:resourceName': {
        get: accessors.get,
        delete: accessors.remove,
      },
      '/:associatedName/:associatedIndex/:resourceName/:resourceIndex': {
        post: accessors.set,
      },
    },
    belongsToMany: {
      '/:associatedName/:associatedIndex/:resourceName': {
        get: accessors.list,
        post: accessors.set,
      },
      '/:associatedName/:associatedIndex/:resourceName/:resourceIndex': {
        get: accessors.get,
        post: accessors.add,
        put: accessors.update, // Many to Many 的 update 是针对 through
        patch: accessors.update, // Many to Many 的 update 是针对 through
        delete: accessors.remove,
      },
    },
    set: {
      '/:associatedName/:associatedIndex/:resourceName': {
        get: accessors.list,
        post: accessors.add,
        delete: accessors.remove,
      },
    },
  };

  const params: ParsedParams = {};

  let prefix = (options.prefix || '').trim().replace(/\/$/, '');

  if (prefix && !prefix.startsWith('/')) {
    prefix = `/${prefix}`;
  }

  const { type = 'single' } = request;

  for (const path in defaults[type]) {
    const keys = [];
    const regexp = pathToRegexp(`${prefix}${path}`, keys, {});
    const matches = regexp.exec(reqPath);
    if (!matches) {
      continue;
    }
    keys.forEach((obj, index) => {
      if (matches[index + 1] === undefined) {
        return;
      }
      params[obj.name] = matches[index + 1];
    });
    params.actionName = _.get(defaults, [type, path, request.method.toLowerCase()]);
  }

  if (Object.keys(params).length === 0) {
    return false;
  }

  if (params.resourceName) {
    const [resourceName, actionName] = params.resourceName.split(':');
    if (actionName) {
      params.resourceName = resourceName;
      params.actionName = actionName;
    }
  }

  if (params.associatedIndex) {
    params.associatedIndex = decodeURIComponent(params.associatedIndex);
  }

  return params;
}

export function parseQuery(input: string): any {
  // 自带 query 处理的不太给力，需要用 qs 转一下
  const query = qs.parse(input, {
    // 原始 query string 中如果一个键连等号“=”都没有可以被认为是 null 类型
    strictNullHandling: true,
    // 逗号分隔转换为数组
    // comma: true,
  });

  // filter 支持 json string
  if (typeof query.filter === 'string') {
    query.filter = JSON.parse(query.filter);
  }

  return query;
}

export function parseFields(fields: any) {
  if (!fields) {
    return {};
  }
  if (typeof fields === 'string') {
    fields = fields.split(',').map((field) => field.trim());
  }
  if (Array.isArray(fields)) {
    const onlyFields = [];
    const output: any = {};
    fields.forEach((item) => {
      if (typeof item === 'string') {
        onlyFields.push(item);
      } else if (typeof item === 'object') {
        if (item.only) {
          onlyFields.push(...item.only.toString().split(','));
        }
        Object.assign(output, parseFields(item));
      }
    });
    if (onlyFields.length) {
      output.only = onlyFields;
    }
    return output;
  }
  if (fields.only && typeof fields.only === 'string') {
    fields.only = fields.only.split(',').map((field) => field.trim());
  }
  if (fields.except && typeof fields.except === 'string') {
    fields.except = fields.except.split(',').map((field) => field.trim());
  }
  if (fields.appends && typeof fields.appends === 'string') {
    fields.appends = fields.appends.split(',').map((field) => field.trim());
  }
  return fields;
}

export function mergeFields(defaults: any, inputs: any) {
  let fields: any = {};
  defaults = parseFields(defaults);
  inputs = parseFields(inputs);
  if (inputs.only) {
    // 前端提供 only，后端提供 only
    if (defaults.only) {
      fields.only = defaults.only.filter((field) => inputs.only.includes(field));
    }
    // 前端提供 only，后端提供 except，输出 only 排除 except
    else if (defaults.except) {
      fields.only = inputs.only.filter((field) => !defaults.except.includes(field));
    }
    // 前端提供 only，后端没有提供 only 或 except
    else {
      fields.only = inputs.only;
    }
  } else if (inputs.except) {
    // 前端提供 except，后端提供 only，只输出 only 里排除 except 的字段
    if (defaults.only) {
      fields.only = defaults.only.filter((field) => !inputs.except.includes(field));
    }
    // 前端提供 except，后端提供 except 或不提供，合并 except
    else {
      fields.except = _.uniq([...inputs.except, ...(defaults.except || [])]);
    }
  }
  // 前端没提供 only 或 except
  else {
    fields = defaults;
  }
  // 如果前端提供了 appends
  if (!_.isEmpty(inputs.appends)) {
    fields.appends = _.uniq([...inputs.appends, ...(defaults.appends || [])]);
  }
  if (!fields.appends) {
    fields.appends = [];
  }
  return fields;
}
