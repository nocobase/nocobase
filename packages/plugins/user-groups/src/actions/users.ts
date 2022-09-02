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

import { listParentPgroupTree, crtErrorBody } from './util';

/**
 * find user's parent group tree.
 * in a list [0]is root ,last one is direct parent group.
 * @param ctx 
 * @param next 
 */
export async function getParentGroupTree(ctx: Context, next: Next) {

  const { filter: { id } } = ctx.action.params;
  const repostory = ctx.db.getRepository('users');

  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(id, `not a ligel userid id:${id}`);
    return next();
  };

  //find the object.
  const userObj = await repostory.findOne({
    where: { id },
    include: 'userGroups',
  });

  //if not find the obj return 
  if (!userObj || !userObj['nickname']) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(id, `found nothing from the id:${id}`);
    return next();
  };

  //found the user's groups object.
  await userObj['getUserGroups']();
  const groupObj = userObj['userGroups'][0];

  //if not find the obj return 
  if (!groupObj || !groupObj['name']) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(id, `user has no parent group userid:${id}`);
    ctx.response.body['user'] = userObj;
    return next();
  };

  //get associated parent.
  let parentUids = <string>groupObj['ptree'];
  //if ptree error,return error.
  if (!parentUids || parentUids.indexOf(',') == -1) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(id, `the  gid:${groupObj.gid} group's ptree:${parentUids} error.`);
    ctx.response.body['user'] = userObj;
    return next();
  };

  //get the parent group tree list.
  const parents = await listParentPgroupTree(ctx, parentUids);

  ctx.response.status = 201;
  if (!parents || parents.length == 0) {//the group has no parent.
    ctx.response.body = {
      user: userObj,
      parentGroupTree: null,
      msg: 'no parent tree.',
      code: 2,
    };
  } else {//nomal parent.
    ctx.response.body = {
      user: userObj,
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
  const repostory = ctx.db.getRepository('users');

  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(id, `not a ligel userid id:${id}`);
    return next();
  };

  //find the object.
  const userObj = await repostory.findOne({
    where: { id },
    include: ['userGroups', 'roles'],
  });

  //if not find the obj return 
  if (!userObj || !userObj['nickname']) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(id, `found nothing from the id:${id}`);
    return next();
  };

  //confirm found the user's groups object.
  await userObj['getUserGroups']();
  const groupObj = userObj['userGroups'][0];
  
  //confirm found the user's roles object.
  await userObj['getRoles']();
  const userRoles = userObj['roles'];

  //if not find the obj return 
  if (!groupObj || !groupObj['name']) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(id, `user has no parent group userid:${id}`);
    ctx.response.body['user'] = userObj;
    return next();
  };

  //get associated parents ids.
  let parentUids = <string>groupObj['ptree'];
  //if ptree error,return error.
  if (!parentUids || parentUids.indexOf(',') == -1) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(id, `the  gid:${groupObj.gid} group's ptree:${parentUids} error.`);
    ctx.response.body['user'] = userObj;
    return next();
  };

  //get groups in desc with roles.in desc order.close roles at first.
  const parents = await listParentPgroupTree(ctx, parentUids, true, ['roles']);

  //get the tree roles
  //iterate through the trees and get all the roles.
  let troles = userRoles;

  //list the groups roles.
  for (let tp of parents) {
    if (!tp['roles']) {
      tp['getRoles']();
    }
    const ttr = tp['roles'];
    troles = _.concat(troles, ttr);

  }

  ctx.response.status = 201;
  ctx.response.body = {
    user: userObj,
    treeRoles: troles,
    msg: 'ok.',
    code: 1,
  };

  await next();
}
