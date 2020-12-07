import collectionsBeforeValidate from './collections-before-validate';
import collectionsAfterCreate from './collections-after-create';

import fieldsBeforeValidate from './fields-before-validate';
import fieldsAfterCreate from './fields-after-create';
import generateName from './generateName';

export default {
  collections: {
    beforeValidate: collectionsBeforeValidate,
    afterCreate: collectionsAfterCreate,
  },
  fields: {
    beforeValidate: fieldsBeforeValidate,
    afterCreate: fieldsAfterCreate
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
