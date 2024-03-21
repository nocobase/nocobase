import { useCollectionManager_deprecated } from '@nocobase/client';

const EXCLUDE_INTERFACES = [
  // 'icon',
  // 'formula',
  // 'attachment',
  // 'markdown',
  // 'richText',
  'id',
  'createdAt',
  'createdBy',
  'updatedAt',
  'updatedBy',
  // 'sequence',
];

export const useFields = (collectionName: string) => {
  const { getCollectionFields } = useCollectionManager_deprecated();
  const fields = getCollectionFields(collectionName);
  const field2option = (field, depth) => {
    if (!field.interface || EXCLUDE_INTERFACES.includes(field.interface)) {
      return;
    }
    const option = {
      name: field.name,
      title: field?.uiSchema?.title || field.name,
      schema: field?.uiSchema,
    };
    if (!field.target || depth >= 2) {
      return option;
    }

    if (field.target) {
      const targetFields = getCollectionFields(field.target);
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
  return getOptions(fields, 1);
};
