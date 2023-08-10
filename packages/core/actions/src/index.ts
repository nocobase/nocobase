import { Cache } from '@nocobase/cache';
import { Database } from '@nocobase/database';
import { Action } from '@nocobase/resourcer';
import Koa from 'koa';
import lodash from 'lodash';
import * as actions from './actions';
import { Application } from '@nocobase/server';

export * as utils from './utils';

export type Next = () => Promise<any>;

export interface Context extends Omit<Koa.Context, 'app'> {
  db: Database;
  cache: Cache;
  action: Action;
  body: any;
  app: Application;

  [key: string]: any;
}

export function registerActions(api: any) {
  api.actions(
    lodash.pick(actions, [
      'add',
      'create',
      'destroy',
      'get',
      'list',
      'remove',
      'set',
      'toggle',
      'update',
      'move',
      'firstOrCreate',
      'updateOrCreate',
    ]),
  );
}

export default actions;
