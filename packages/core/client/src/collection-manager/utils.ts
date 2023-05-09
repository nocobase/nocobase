import { CollectionFieldOptions } from './types';

/**
 * 是否是对一字段
 * @param collectionField
 * @returns
 */
export const isToOne = (collectionField: CollectionFieldOptions) => {
  if (!collectionField) return false;
  return ['hasOne', 'belongsTo'].includes(collectionField.type);
};
