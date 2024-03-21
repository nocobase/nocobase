import { list } from './default-actions/list';
import { move } from './default-actions/move';
import { proxyToRepository } from './default-actions/proxy-to-repository';
import { DataSource } from './data-source';

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
    params: ['values', 'filterKeys'],
    method: 'firstOrCreate',
  },
  updateOrCreate: {
    params: ['values', 'filterKeys'],
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

export function loadDefaultActions(dataSource: DataSource) {
  return {
    ...Object.keys(actions).reduce((carry, key) => {
      carry[key] = proxyToRepository(actions[key].params, actions[key].method);
      return carry;
    }, {}),
    list,
    move,
  };
}
