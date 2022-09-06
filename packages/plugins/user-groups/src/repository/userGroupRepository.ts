import { Repository, Transactionable } from '@nocobase/database';
import { Op } from 'sequelize';
import _ from 'lodash';

/**
 * the repository for the usergroups.
 */
export class UserGroupsRepository extends Repository {
    private static readonly roleAttr = ['createdAt', 'updatedAt', 'name', 'title', 'description', 'strategy', 'default', 'hidden', 'allowConfigure', 'allowNewMenu', 'sort',];
    private static readonly groupAttr = ['name', 'gid', 'pid', 'ptree', 'sort', 'status', 'createdAt', 'updatedAt'];
    /**
     * get all ther groups of the input ptree.
     * which will be a tree to the root group.
     * parents[0] will be the root by default.
     * parents[length] the last one should be self.
     * @param ctx help to get dbs. 
     * @param ptree the ptree 
     * @param desc order in desc flag.
     */
    async getParentGroupTree(gid: string, desc = false, include = []) {
        if (!gid) {
            return null;
        }

        const parents = await this.listParentGroupTree(gid, desc, include);
        if (!parents) {
            return null;
        }
        //get only datas and return.
        let result = [];
        for (let tg of parents) {
            result.push(_.pick(tg, UserGroupsRepository.groupAttr));
        }
        return result;
    }

    private async listParentGroupTree(gid: string, desc = false, include = []) {
        if (!gid) {
            return null;
        }

        const groupObj = await this.findById(gid);
        if (!groupObj) {
            return null;
        }

        const ptree = groupObj['ptree'];

        //delete the last comma.
        let parentUids = ptree.substring(0, ptree.length - 1);
        const parents = await this.find({
            filter: {
                gid: {
                    [Op.in]: parentUids.split(','),
                }
            },
            appends: include,
            order: desc ? [['ptree', 'DESC']] : ['ptree'],
        });

        return parents;
    }

    /**
     * get the parent tree roles.
     * @param ctx 
     * @param next 
     */
    async getTreeRoles(gid: string, desc = true) {
        if (!gid) {
            return null;
        }

        //get groups in desc with roles.
        const parents = await this.listParentGroupTree(gid, desc, ['roles']);

        if (!parents) {
            return null;
        }

        //get the tree roles
        //iterate through the trees and get all the roles.
        const troles = [];
        for (let tp of parents) {
            if (!tp['roles']) {
                await tp['getRoles']();
            }
            const ttr = tp['roles'];
            for (let tr of ttr) {
                troles.push(tr);
            }

        }

        //get only datas and return.
        let result = [];
        for (let ttr of troles) {
            result.push(_.pick(ttr, UserGroupsRepository.roleAttr));
        }

        return result;

    }

    /**
     * get sub groups in tree mode. not in array.
     * get all the sub groups of the node.
     * @param ctx 
     * @param next 
     * @return a node or the input gid's node as root node's tree datas.
     */
    async getSubGroupTree(gid: string, noTree = false) {

        if (!gid) {
            return null;
        }

        const groupObj = await this.findById(gid);
        if (!groupObj) {
            return null;
        }

        //get ptree data.
        let parentUids = <string>groupObj['ptree'];
        /**
         * using the like operator to find all the sub groups in array.
         * all the group has the ptree data ,the tree is deep the ptree is long.
         * the ptree looks like : g_b0jm3isjuaj,g_p572hy1haci,g_w1ikc73pa3f,g_nv22di17e0q,
         * which is a root to self ids list.
         * [Op.like]: 'g_b0jm3isjuaj,g_p572hy1haci,g_w1ikc73pa3f,g_nv22di17e0q,%',
         * which will query out all the sub groups.
         */
        const childrens = await this.find({
            filter: {
                ptree: {
                    [Op.like]: `${parentUids}%`,
                }
            },
            order: ['ptree'],
        });

        let treedata = {};
        if (noTree) {//return a plan node.

            const result = [];
            //pick only datas.
            for (let td of childrens) {
                result.push(_.pick(td, UserGroupsRepository.groupAttr));
            }
            treedata = result;
        } else {//create the tree.

            //pick the data attr from the model data.
            let root = _.pick(childrens[0], UserGroupsRepository.groupAttr);
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
                        const td = _.pick(ad, UserGroupsRepository.groupAttr);
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

        return treedata;
    }

}

export default UserGroupsRepository;