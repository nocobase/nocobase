import { useFieldSchema } from '@formily/react';
import { useCollectionManagerV2 } from '@nocobase/client';

export const useFields = (collectionName: string) => {
  const fieldSchema = useFieldSchema();
  const nonfilterable = fieldSchema?.['x-component-props']?.nonfilterable || [];
  const cm = useCollectionManagerV2();
  const fields = cm.getCollectionFields(collectionName);
  const field2option = (field, depth) => {
    if (!field.interface) {
      return;
    }
    const option = {
      name: field.name,
      title: field?.uiSchema?.title || field.name,
      schema: field?.uiSchema,
    };
    if (!field.target || depth >= 3) {
      return option;
    }

    if (field.target) {
      const targetFields = cm.getCollectionFields(field.target);
      const options = getOptions(targetFields, depth + 1).filter(Boolean);
      option['children'] = option['children'] || [];
      option['children'].push(...options);
    }
    return option;
  };
  const getOptions = (fields, depth) => {
    const options = [];
    fields.forEach((field) => {
      const option = field2option(field, depth);
      if (option) {
        options.push(option);
      }
    });
    return options;
  };
  if (!collectionName) return [];
  return getOptions(fields, 1);
};
