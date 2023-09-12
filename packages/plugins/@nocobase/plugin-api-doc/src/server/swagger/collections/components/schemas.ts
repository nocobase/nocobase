import { Collection, Field, RelationField } from '@nocobase/database';
import { getTypeByField } from './field-type-map';
import { associationFields } from '../paths/associations';

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

    if (
      [
        'createdAt',
        'updatedAt',
        'created_at',
        'updated_at',
        'sort',
        'created_by_id',
        'createdById',
        'updatedById',
        'updated_by_id',
      ].includes(fieldName)
    ) {
      readOnlyFields.push(fieldName);
      continue;
    }
  }

  return readOnlyFields;
}

function collectionToSchema(collection: Collection) {
  return {
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
  };
}

export default (collection: Collection, options) => {
  const associations = associationFields(collection);
  const associationsTarget = associations.map((field) => collection.db.getCollection(field.target));

  const schemas = collectionToSchema(collection);
  if (options.withAssociation) {
    for (const target of associationsTarget) {
      Object.assign(schemas, collectionToSchema(target));
    }
  }
  return {
    schemas,
  };
};

function getFieldTypeAttributes(field: Field) {
  return getTypeByField(field);
}
