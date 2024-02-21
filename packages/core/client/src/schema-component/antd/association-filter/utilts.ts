import { CollectionFieldOptions_deprecated } from '../../../collection-manager';

export const getTargetKey = (field?: CollectionFieldOptions_deprecated) => {
  return field?.targetKey || 'id';
};
