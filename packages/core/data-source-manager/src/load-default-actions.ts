/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { list } from './default-actions/list';
import { proxyToRepository } from './default-actions/proxy-to-repository';

type Actions = { [key: string]: { params: Array<string> | ((ctx: any) => Array<string>); method: string } };

const actions: Actions = {
  add: {
    params(ctx) {
      return ctx.action.params.filterByTk || ctx.action.params.filterByTks || ctx.action.params.values;
    },
    method: 'add',
  },
  create: {
    params: ['whitelist', 'blacklist', 'updateAssociationValues', 'values'],
    method: 'create',
  },
  get: {
    params: ['filterByTk', 'fields', 'appends', 'except', 'filter', 'targetCollection'],
    method: 'findOne',
  },
  update: {
    params: [
      'filterByTk',
      'values',
      'whitelist',
      'blacklist',
      'filter',
      'updateAssociationValues',
      'forceUpdate',
      'targetCollection',
    ],
    method: 'update',
  },
  destroy: {
    params: ['filterByTk', 'filter'],
    method: 'destroy',
  },
  firstOrCreate: {
    params: ['values', 'filterKeys', 'whitelist', 'blacklist', 'updateAssociationValues', 'targetCollection'],
    method: 'firstOrCreate',
  },
  updateOrCreate: {
    params: ['values', 'filterKeys', 'whitelist', 'blacklist', 'updateAssociationValues', 'targetCollection'],
    method: 'updateOrCreate',
  },
  remove: {
    params(ctx) {
      return ctx.action.params.filterByTk || ctx.action.params.filterByTks || ctx.action.params.values;
    },
    method: 'remove',
  },
  set: {
    params(ctx) {
      return ctx.action.params.filterByTk || ctx.action.params.filterByTks || ctx.action.params.values;
    },
    method: 'set',
  },
  toggle: {
    params(ctx) {
      return ctx.action.params.values;
    },
    method: 'toggle',
  },
};

export function loadDefaultActions() {
  return {
    ...Object.keys(actions).reduce((carry, key) => {
      carry[key] = proxyToRepository(actions[key].params, actions[key].method);
      return carry;
    }, {}),
    list,
  };
}
