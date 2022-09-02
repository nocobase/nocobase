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

import { listParentPgroupTree, crtErrorBody } from './util';

/**
 * find the parent obj and return
 * @param ctx {parpams:{}}
 * @param next 
 */
export async function getParentGroup(ctx: Context, next: Next) {
  const { filter: { gid } } = ctx.action.params;
  const repostory = ctx.db.getRepository('userGroups');

  if (!gid) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(gid, `not a ligel groupid gid:${gid}`);
    return next();
  };

  //find the object.and get out the parent.
  const groupObj = await repostory.findOne({
    where: { gid },
    include: 'parent',
  });

  //if not find the obj return 
  if (!groupObj || !groupObj['name']) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(gid, `found nothing from the gid:${gid}`);
    return next();
  };

  //get associated parent.
  const userGroup = await groupObj['getParent']();

  ctx.response.status = 201;
  if (!userGroup) {//the group has no parent.
    ctx.response.body = {
      userGroup: groupObj,
      parentGroup: null,
      msg: 'no parent.',
      code: 2,
    };
  } else {//nomal parent.
    ctx.response.body = {
      userGroup: groupObj,
      parentGroup: userGroup,
      msg: 'ok.',
      code: 1,
    };
  }
  await next();
}

/**
 * find the tree of the group.
 * @param ctx 
 * @param next 
 */
export async function getParentGroupTree(ctx: Context, next: Next) {

  const { filter: { gid } } = ctx.action.params;
  const repostory = ctx.db.getRepository('userGroups');
  const sequelizeModel = ctx.db.getCollection('userGroups').model;

  if (!gid) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(gid, `not a ligel groupid gid:${gid}`);
    return next();
  };

  //find the object.
  const groupObj = await repostory.findOne({
    where: { gid },
  });

  //if not find the obj return 
  if (!groupObj || !groupObj['name']) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(gid, `found nothing from the gid:${gid}`);
    return next();
  };

  //get associated parent.
  let parentUids = <string>groupObj['ptree'];
  //if ptree error,return error.
  if (!parentUids || parentUids.indexOf(',') == -1) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(gid, `the gid:${gid} group's ptree:${parentUids} error.`);
    return next();
  };

  //get the parent group tree list.
  const parents = await listParentPgroupTree(ctx, parentUids);

  ctx.response.status = 201;
  if (!parents || parents.length == 0) {//the group has no parent.
    ctx.response.body = {
      userGroup: groupObj,
      parentGroupTree: null,
      msg: 'no parent tree.',
      code: 2,
    };
  } else {//nomal parent.
    ctx.response.body = {
      userGroup: groupObj,
      parentGroupTree: parents,
      msg: 'ok.',
      code: 1,
    };
  }
  await next();
}

/**
 * find the direct sub groups
 * without the all the subs.
 * @param ctx 
 * @param next 
 * @returns 
 */
export async function getSubGroups(ctx: Context, next: Next) {
  const { filter: { gid } } = ctx.action.params;
  const repostory = ctx.db.getRepository('userGroups');

  if (!gid) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(gid, `not a ligel groupid gid:${gid}`);
    return next();
  };

  //find the object.
  const groupObj = await repostory.findOne({
    where: { gid },
    include: 'children',
  });

  //if not find the obj return 
  if (!groupObj || !groupObj['name']) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(gid, `found nothing from the gid:${gid}`);
    return next();
  };

  //get associated childrens.
  const subGroups = await groupObj['getChildren']();

  ctx.response.status = 201;
  if (!subGroups || subGroups.length == 0) {//the group has no parent.
    ctx.response.body = {
      userGroup: groupObj,
      subGroups: null,
      msg: 'no sub groups.',
      code: 2,
    };
  } else {//nomal parent.
    ctx.response.body = {
      userGroup: groupObj,
      subGroups: subGroups,
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
  const repostory = ctx.db.getRepository('userGroups');

  //no groupid return 400.
  if (!gid) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(gid, `not a ligel groupid gid:${gid}`);
    return next();
  };

  //find the object.
  //!!!---dababase query---!!!
  const groupObj = await repostory.findOne({
    where: { gid },
  });

  //if not find the obj return 
  if (!groupObj || !groupObj['name']) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(gid, `found nothing from the gid:${gid}`);
    return next();
  };

  //get ptree data.
  let parentUids = <string>groupObj['ptree'];
  //if ptree error,return error.
  if (!parentUids || parentUids.indexOf(',') == -1) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(gid, `the gid:${gid} group's ptree:${parentUids} error.`);
    return next();
  };

  /**
   * using the like operator to find all the sub groups in array.
   * all the group has the ptree data ,the tree is deep the ptree is long.
   * the ptree looks like : g_b0jm3isjuaj,g_p572hy1haci,g_w1ikc73pa3f,g_nv22di17e0q,
   * which is a root to self ids list.
   * [Op.like]: 'g_b0jm3isjuaj,g_p572hy1haci,g_w1ikc73pa3f,g_nv22di17e0q,%',
   * which will query out all the sub groups.
   */
  const childrens = await repostory.find({
    where: {
      ptree: {
        [Op.like]: `${parentUids}%`,
      }
    },
    order: ['ptree'],
  });

  let treedata = {};
  if (noTree) {//return a plan node.
    treedata = childrens;
  } else {//create the tree.

    //pick the data attr from the model data.
    const dataAttr = ['name', 'gid', 'pid', 'ptree', 'sort', 'status', 'createdAt', 'updatedAt'];
    let root = _.pick(childrens[0], dataAttr);
    let datanodes = _.cloneDeep(childrens);

    //the tree recursion invokes.
    const crtTree: any = (datanode) => {
      //remove self node for a better performance.
      _.remove(datanodes, td => td['gid'] == datanode.gid);
      datanode.subGroups = [];
      //find all subs from the array.
      for (let ad of datanodes) {
        if (ad['pid'] == datanode.gid) {
          //pick the data attr from the model data.
          const td = _.pick(ad, dataAttr);
          datanode.subGroups.push(td);
        }
      }
      for (let cd of datanode.subGroups) {
        crtTree(cd);
      }
    };

    //create the trees.
    crtTree(root);
    //set the treedata.
    treedata = root;
  }

  ctx.response.status = 201;
  if (!childrens) {//the group has no parent.
    ctx.response.body = {
      userGroup: groupObj,
      subGroupTree: null,
      msg: 'no sub groups tree.',
      code: 2,
    };
  } else {//nomal parent.
    ctx.response.body = {
      userGroup: groupObj,
      subGroupTree: treedata,
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
  const { filter: { gid } } = ctx.action.params;
  const repostory = ctx.db.getRepository('userGroups');

  if (!gid) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(gid, `not a ligel groupid gid:${gid}`);
    return next();
  };

  //find the object.
  const groupObj = await repostory.findOne({
    where: { gid },
  });

  //if not find the obj return 
  if (!groupObj || !groupObj['name']) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(gid, `found nothing from the gid:${gid}`);
    return next();
  };

  //get associated parent.
  let parentUids = <string>groupObj['ptree'];

  //if ptree error,return error.
  if (!parentUids || parentUids.indexOf(',') == -1) {
    ctx.response.status = 400;
    ctx.response.body = crtErrorBody(gid, `the gid:${gid} group's ptree:${parentUids} error.`);
    return next();
  };

  //get groups in desc with roles.
  const parents = await listParentPgroupTree(ctx, parentUids, true, ['roles']);

  //get the tree roles
  //iterate through the trees and get all the roles.
  const troles = [];
  for (let tp of parents) {
    if (!tp['roles']) {
      tp['getRoles']();
    }
    const ttr = tp['roles'];
    for (let tr of ttr) {
      troles.push(tr);
    }

  }

  ctx.response.status = 201;
  if (!parents || parents.length == 0) {//the group has no parent.
    ctx.response.body = {
      userGroup: groupObj,
      treeRoles: null,
      msg: 'no parent tree.',
      code: 2,
    };
  } else {//nomal parent.
    ctx.response.body = {
      userGroup: groupObj,
      treeRoles: troles,
      msg: 'ok.',
      code: 1,
    };
  }
  await next();
}
