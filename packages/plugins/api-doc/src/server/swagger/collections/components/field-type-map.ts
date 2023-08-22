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
};

function getTypeByField(field: Field) {
  const fieldType = field.dataType.toString().toLowerCase();
  const fieldAttributes = fieldTypeMap[fieldType];

  if (!fieldAttributes) {
    throw new Error(`Unknown field type: ${fieldType}`);
  }
  return fieldAttributes;
}

export { fieldTypeMap, getTypeByField };
