import { Repository, Transactionable } from '@nocobase/database';
import { Op } from 'sequelize';
import _ from 'lodash';
import { UserGroupsRepository } from './userGroupRepository';

/**
 * the repository for the usergroups.
 */
export class UserRepository extends Repository {
    private static readonly roleAttr = [
        'createdAt',
        'updatedAt',
        'name',
        'title',
        'description',
        'strategy',
        'default',
        'hidden',
        'allowConfigure',
        'allowNewMenu',
        'sort',
        'rolesUsers',
    ];
    /**
     * get all ther groups of the input ptree.
     * which will be a tree to the root group.
     * parents[0] will be the root by default.
     * parents[length] the last one should be self.
     * @param ctx help to get dbs. 
     * @param ptree the ptree 
     * @param desc order in desc flag.
     */
    async getParentGroupTree(userid, desc = false) {
        if (!userid) {
            return null;
        }

        //find the object.
        const userObj = await this.findOne({
            filter: { id: userid },
            appends: ['userGroups'],
        });

        if (!userObj) {
            return null;
        }

        //found the user's groups object.
        await userObj['getUserGroups']();
        //get the user's default group 0
        const groupObj = userObj['userGroups'][0];

        const groupRep = this.database.getRepository('userGroups') as UserGroupsRepository;
        const parents = await groupRep.getParentGroupTree(groupObj.gid, desc);
        if (!parents) {
            return [];
        }

        return parents;
    }

    /**
     * get the parent tree roles.
     * @param ctx 
     * @param next 
     */
    async getTreeRoles(userid, desc = true) {
        if (!userid) {
            return null;
        }

        //find the object.
        const userObj = await this.findOne({
            filter: { id: userid },
            appends: ['userGroups', 'roles'],
        });

        if (!userObj) {
            return null;
        }

        //confirm found the user's roles object.
        await userObj['getRoles']();
        let userRoles = userObj['roles'] ? userObj['roles'] : [];

        //the data to return.
        let result = [];

        for (let tp of userRoles) {
            result.push(_.pick(tp, UserRepository.roleAttr));
        }

        //confirm found the user's groups object.
        await userObj['getUserGroups']();
        const groupObj = userObj['userGroups'][0];
        //get the tree roles ,iterate through the trees and get all the roles.
        //list the groups roles.
        const groupRep = this.database.getRepository('userGroups') as UserGroupsRepository;
        const treeRoles = await groupRep.getTreeRoles(groupObj.gid, desc);

        //if there is tree roles push into result.
        if (treeRoles) {
            result = _.concat(result, treeRoles);
        }

        return result;

    }

}

export default UserRepository;