import Koa from 'koa';
import { MultipleRelationRepository, Repository } from '@nocobase/database';

import { Database } from '@nocobase/database';
import { Action } from '@nocobase/resourcer';
import { Cache } from '@nocobase/cache';

export interface Context extends Koa.Context {
  db: Database;
  cache: Cache;
  action: Action;
  body: any;
  app: any;

  [key: string]: any;
}

export function getRepositoryFromParams(ctx: Context) {
  const { resourceName, resourceOf } = ctx.action;

  if (resourceOf) {
    return ctx.db.getRepository<MultipleRelationRepository>(resourceName, resourceOf);
  }

  return ctx.db.getRepository<Repository>(resourceName);
}
