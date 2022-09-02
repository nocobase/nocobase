import { Context } from '@nocobase/actions';
import { Op } from 'sequelize';
import _ from 'lodash';

/**
 * get all ther groups of the input ptree.
 * which will be a tree to the root group.
 * parents[0] will be the root by default.
 * parents[length] the last one should be self.
 * @param ctx help to get dbs. 
 * @param ptree the ptree 
 * @param desc order in desc flag.
 */
export async function listParentPgroupTree(ctx: Context, ptree: string, desc = false, include = []) {

    const repostory = ctx.db.getRepository('userGroups');

    //delete the last comma.
    let parentUids = ptree.substring(0, ptree.length - 1);

    const parents = await repostory.find({
        where: {
            gid: {
                [Op.in]: parentUids.split(','),
            }
        },
        include: include,
        order: desc ? [['ptree', 'DESC']] : ['ptree'],
    });

    return parents;
}

/**
 * create the error msg and return .
 * @param gid 
 * @param errorMsg 
 * @returns 
 */
export function crtErrorBody(id: string, errorMsg: string) {
    const result = {
        id,
        error: errorMsg,
        msg: errorMsg,
        code: -1,
    };

    return result;
}