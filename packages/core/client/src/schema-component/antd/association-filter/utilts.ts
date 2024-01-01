import { CollectionFieldOptionsV2 } from '../../../application';

export const getTargetKey = (field?: CollectionFieldOptionsV2) => {
  return field?.targetKey || 'id';
};
