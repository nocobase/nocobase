import Application from '@nocobase/server';

export function afterUsersCreateOrUpdate(app: Application) {
    return async (model, options) => {
        if (model.constructor.name != 'users') {
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
        if (!options?.values?.userGroups) {
            try {
                const defaultGroup = await app.db.getRepository('userGroups').findOne({
                    filter: {
                        name: 'default',
                    },
                    transaction: transaction,
                });

                await model.setUserGroups([defaultGroup], { transaction: transaction });
            } catch (error) {
                console.log(error);
                transaction.rollback();
            }

        }

    }
}
