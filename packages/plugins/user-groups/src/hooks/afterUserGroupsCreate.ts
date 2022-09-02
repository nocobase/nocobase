import Application from '@nocobase/server';

/**
 * a hook that will add ptree after usergroups added.
 * @param app 
 * @returns 
 */
export function afterUserGroupsCreateWithAssociation(app: Application) {
    return async (model, options) => {
        if (model.constructor.name != 'userGroups') {
            return;
        }
        /**
         * @todo 
         * 1.judge if the new user has the usergroup.
         * 2.if not set to the default.
         * 
         */
        const transaction = options.transaction;

        //if not the user do not set the usergroups.
        //add transaction deelling.
        let ptree = model.gid+',';
        //load Parent if not.
        if(options.values.parent){//get parent ptree and add self .
            await options.values.parent.reload();
            ptree=options.values.parent.ptree+ptree;
        }
        model.ptree = ptree;

        try {
            await model.save({ transaction: transaction });
        } catch (error) {
            console.log(error);
            transaction.rollback();
        }

    }
}

export function afterUserGroupsSaveWithAssociation(app: Application) {
    return async (model, options) => {
        if (model.constructor.name != 'userGroups'||!options?.association) {
            return;
        }
        /**
         * @todo 
         * 1.judge if the new user has the usergroup.
         * 2.if not set to the default.
         * 
         */
        const transaction = options.transaction;

        //if not the user do not set the usergroups.
        //add transaction deelling.
        let ptree = model.gid+',';
        //load Parent if not.
        // model.ptree = ptree;

        try {
            // await model.save({ transaction: transaction });
        } catch (error) {
            console.log(error);
            transaction.rollback();
        }

    }
}
