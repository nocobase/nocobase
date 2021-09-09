import Koa from 'koa';
import Database from '@nocobase/database';
import Resourcer, { Action } from '@nocobase/resourcer';

import * as actions from './actions';
import * as middlewares from './middlewares';

export type Next = () => Promise<any>;

export interface Context extends Koa.Context {
  db: Database;
  action: Action;
  body: any;
};

export * as utils from './utils';
export * as actions from './actions';
export * as middlewares from './middlewares';

export function registerActions(api: any) {
  const resourcer = api.resourcer as Resourcer;
  resourcer.use(middlewares.associated);
  resourcer.registerActions({ ...actions });
}

export default actions;

