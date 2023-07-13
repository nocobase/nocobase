import { CollectionFieldOptions } from '../../../collection-manager';

export const getTargetKey = (field?: CollectionFieldOptions) => {
  return field?.targetKey || 'id';
};
