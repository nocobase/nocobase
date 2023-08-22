import { Collection, Field, RelationField } from '@nocobase/database';
import { getTypeByField } from './field-type-map';

function getCollectionReadOnlyFields(collection: Collection) {
  const readOnlyFields = [];

  // autoIncrement field is readOnly
  const primaryKey = collection.model.primaryKeyAttribute;

  if (primaryKey) {
    const primaryField = collection.fields.get(primaryKey);
    if (primaryField && primaryField.options?.autoIncrement) {
      readOnlyFields.push(primaryKey);
    }
  }

  for (const [fieldName, field] of collection.fields) {
    if (field.type == 'sort') {
      readOnlyFields.push(fieldName);
      continue;
    }

    if (field.type == 'context') {
      readOnlyFields.push(fieldName);
      continue;
    }

    if (fieldName === 'createdAt' || fieldName === 'updatedAt') {
      readOnlyFields.push(fieldName);
      continue;
    }
  }

  return readOnlyFields;
}

export default (collection: Collection) => {
  return {
    schemas: {
      [collection.name]: {
        type: 'object',
        properties: Array.from(collection.fields)
          .filter(([key, value]) => {
            return !(value instanceof RelationField);
          })
          .reduce((obj, [key, value]) => {
            obj[key] = {
              ...getFieldTypeAttributes(value),
            };
            return obj;
          }, {}),
      },
      [`${collection.name}.form`]: {
        allOf: [
          {
            $ref: `#/components/schemas/${collection.name}`,
          },
          {
            type: 'object',
            properties: getCollectionReadOnlyFields(collection).reduce((obj, key) => {
              obj[key] = {
                readOnly: true,
              };
              return obj;
            }, {}),
          },
        ],
      },
    },
  };
};

function getFieldTypeAttributes(field: Field) {
  return getTypeByField(field);
}
