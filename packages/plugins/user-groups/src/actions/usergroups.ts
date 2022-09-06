/**
 * 
 * nocobase.com
 * 
 * the service for the usergroups actions.
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

import { UserGroupsRepository } from '../repository/userGroupRepository';


/**
 * find the tree of the group.
 * @param ctx 
 * @param next 
 */
export async function getParentGroupTree(ctx: Context, next: Next) {

  const { filter: { gid } } = ctx.action.params;
  const userGroupRepository = ctx.db.getCollection('userGroups').repository as UserGroupsRepository;

  if (!gid) {
    ctx.throw(400, `not a ligel groupid gid:${gid}`);
  };

  const parents = await userGroupRepository.getParentGroupTree(gid);

  if (parents == null) {
    ctx.throw(400, `found nothing from the gid:${gid}`);
  };

  ctx.response.status = 201;
  if (parents.length == 0) {//the group has no parent.
    ctx.response.body = {
      gid: gid,
      parentGroupTree: null,
      msg: 'no parent tree.',
      code: 2,
    };
  } else {//nomal parent.
    ctx.response.body = {
      gid: gid,
      parentGroupTree: parents,
      msg: 'ok.',
      code: 1,
    };
  }
  await next();
}

/**
 * get sub groups in tree mode. not in array.
 * get all the sub groups of the node.
 * @param ctx 
 * @param next 
 * @return a node or the input gid's node as root node's tree datas.
 */
export async function getSubGroupTree(ctx: Context, next: Next) {
  const { filter: { gid }, noTree = false } = ctx.action.params;
  const userGroupRepository = ctx.db.getCollection('userGroups').repository as UserGroupsRepository;

  if (!gid) {
    ctx.throw(400, `not a ligel groupid gid:${gid}`);
  };

  const treeData = await userGroupRepository.getSubGroupTree(gid, noTree);

  if (treeData == null) {
    ctx.throw(400, `found nothing from the gid:${gid}`);
  };

  ctx.response.status = 201;
  ctx.response.body = {
    gid,
    subGroupTree: treeData,
    msg: 'ok.',
    code: 1,
  };

  await next();
}

/**
 * get the parent tree roles.
 * @param ctx 
 * @param next 
 */
export async function getTreeRoles(ctx: Context, next: Next) {
  const { filter: { gid } } = ctx.action.params;
  const userGroupRepository = ctx.db.getCollection('userGroups').repository as UserGroupsRepository;

  if (!gid) {
    ctx.throw(400, `not a ligel groupid gid:${gid}`);
  };

  const troles = await userGroupRepository.getTreeRoles(gid);

  if (troles == null) {
    ctx.throw(400, `found nothing from the gid:${gid}`);
  };

  ctx.response.status = 201;
  if (troles.length == 0) {//the group has no parent.
    ctx.response.body = {
      gid,
      treeRoles: null,
      msg: 'no parent tree.',
      code: 2,
    };
  } else {//nomal parent.
    ctx.response.body = {
      gid,
      treeRoles: troles,
      msg: 'ok.',
      code: 1,
    };
  }
  await next();
}
