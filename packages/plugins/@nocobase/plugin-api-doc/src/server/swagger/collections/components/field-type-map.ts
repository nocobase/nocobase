import { Field } from '@nocobase/database';

const fieldTypeMap = {
  bigint: {
    type: 'integer',
    format: 'int64',
  },
  datetime: {
    type: 'string',
    format: 'date-time',
  },
  string: {
    type: 'string',
  },
  text: {
    type: 'string',
  },

  jsontype: {
    type: 'string',
  },
};

function getTypeByField(field: Field) {
  const fieldType = field.dataType.toString().toLowerCase();
  const fieldAttributes = fieldTypeMap[fieldType];

  if (!fieldAttributes) {
    return {
      type: 'string',
    };
  }

  return fieldAttributes;
}

export { fieldTypeMap, getTypeByField };
