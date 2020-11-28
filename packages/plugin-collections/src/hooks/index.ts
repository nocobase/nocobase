import collectionsBeforeValidate from './collections-before-validate';
import collectionsAfterCreate from './collections-after-create';

import fieldsBeforeValidate from './fields-before-validate';
import fieldsAfterCreate from './fields-after-create';

export default {
  collections: {
    beforeValidate: collectionsBeforeValidate,
    afterCreate: collectionsAfterCreate,
  },
  fields: {
    beforeValidate: fieldsBeforeValidate,
    afterCreate: fieldsAfterCreate
  }
};
