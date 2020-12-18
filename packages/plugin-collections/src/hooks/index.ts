import collectionsBeforeValidate from './collections-before-validate';
import collectionsAfterCreate from './collections-after-create';

import fieldsBeforeValidate from './fields-before-validate';
import fieldsAfterCreate from './fields-after-create';
import generateName from './generateName';
import fieldsAfterBulkUpdate from './fields-after-bulk-update';

export default {
  collections: {
    beforeValidate: collectionsBeforeValidate,
    afterCreate: collectionsAfterCreate,
    afterUpdate: collectionsAfterCreate,
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
