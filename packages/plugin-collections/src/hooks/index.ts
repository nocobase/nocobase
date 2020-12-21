import collectionsBeforeValidate from './collections-before-validate';
import collectionsAfterCreate from './collections-after-create';
import collectionsAfterUpdate from './collections-after-update';

import fieldsBeforeValidate from './fields-before-validate';
import fieldsAfterCreate from './fields-after-create';
import fieldsAfterBulkUpdate from './fields-after-bulk-update';

import generateName from './generateName';

export default {
  collections: {
    beforeValidate: collectionsBeforeValidate,
    afterCreate: collectionsAfterCreate,
    afterUpdate: collectionsAfterUpdate,
  },
  fields: {
    beforeValidate: fieldsBeforeValidate,
    afterCreate: fieldsAfterCreate,
    afterBulkUpdate: fieldsAfterBulkUpdate,
  },
  actions: {
    beforeValidate: generateName
  },
  views: {
    beforeValidate: generateName
  },
  tabs: {
    beforeValidate: generateName
  },
};
