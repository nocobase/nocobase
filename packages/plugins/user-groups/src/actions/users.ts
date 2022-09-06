/**
 * 
 * nocobase.com
 * 
 * the service for the user's groups actions.
 * 
 * service status :
 * 2XX:ok
 * 200:the normal ok.
 * 201:query ok.
 * 202:created or updated or upload and ok.
 * 203:deleted and ok.
 * 
 * 4xx:not found or no permissions
 * 400:normal not found error.
 * 401:refused,not logged in.
 * 403:forbidden.
 * 404:not found.
 * 
 * 5xx:programe error
 * 500:normal internal error.
 * 501:error invoke.
 * 502:out of time.
 * 503:not usable.
 * 
 */
import { Context, Next } from '@nocobase/actions';
import { Op } from 'sequelize';
import _ from 'lodash';

import { UserRepository } from '../repository';

/**
 * find user's parent group tree.
 * in a list [0]is root ,last one is direct parent group.
 * @param ctx 
 * @param next 
 */
export async function getParentGroupTree(ctx: Context, next: Next) {

  const { filter: { id } } = ctx.action.params;
  const userRepository = ctx.db.getCollection('users').repository as UserRepository;

  if (!id) {
    ctx.throw(400, `not a ligel userid:${id}`);
  };

  const parents = await userRepository.getParentGroupTree(id);

  if (parents == null) {
    ctx.throw(400, `found nothing from the userid:${id}`);
  };

  ctx.response.status = 201;
  if (parents.length == 0) {//the group has no parent.
    ctx.response.body = {
      userid: id,
      parentGroupTree: null,
      msg: 'no parent tree.',
      code: 2,
    };
  } else {//nomal parent.
    ctx.response.body = {
      userid: id,
      parentGroupTree: parents,
      msg: 'ok.',
      code: 1,
    };
  }
  await next();
}

/**
 * get the parent tree roles.
 * @param ctx 
 * @param next 
 */
export async function getTreeRoles(ctx: Context, next: Next) {
  const { filter: { id } } = ctx.action.params;
  const userRepository = ctx.db.getCollection('users').repository as UserRepository;

  if (!id) {
    ctx.throw(400, `not a ligel userid:${id}`);
  };

  const troles = await userRepository.getTreeRoles(id);

  if (troles == null) {
    ctx.throw(400, `found nothing from the userid:${id}`);
  };

  ctx.response.status = 201;
  ctx.response.body = {
    userid: id,
    treeRoles: troles,
    msg: 'ok.',
    code: 1,
  };

  await next();
}
