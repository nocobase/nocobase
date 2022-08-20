import { CollectionOptions } from '@nocobase/database';

export default {
    name: 'userGroupsUsers',
    fields: [
        //the relation status -1 delete 0 create 1 using 2 pandding
        {
            type: 'integer', name: 'status'
        },
    ],
} as CollectionOptions;