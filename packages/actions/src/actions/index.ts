import Koa from 'koa';
import Database from '@nocobase/database';
import { Action } from '@nocobase/resourcer';

export type Next = () => Promise<any>;

export interface Context extends Koa.Context {
  db: Database;
  action: Action;
  body: any;
};

export { default as common } from './common';
export { default as associate } from './associate';
