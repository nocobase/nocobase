import Application from '@nocobase/server';

export function afterUsersCreate(app: Application) {
    return async (model, options) => {
        if (model.constructor.name != 'users') {
            return;
        }
        /**
         * @todo 
         * 1.判断用户信息有没有关联的用户组信息。
         * 2.没有就给用户增加默认用户组。
         * 
         */
        const db = app.db;
        const transaction = options.transaction;

        if (!model.associations) {

            //direct load the user's usergroups.
            await model.getUsergroups();
            //still not have.
            if (!model.associations) {

                const defaultGroup = await app.db.getRepository('usergroups').findOne({
                    filter: {
                        name: 'default',
                    },
                });

                //create the default assocations belong to the default usergroup.
                await model.setUsergroups([defaultGroup], { transaction });
            }
        }
    }
}
