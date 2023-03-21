import { CollectionData } from '../hooks/useDumpableCollections';

export const getCategories = (list: CollectionData[]) => {
  const result: string[] = [];
  list.forEach((item) => {
    item.category?.forEach((category) => {
      if (!result.includes(category.name)) {
        result.push(category.name);
      }
    });
  });
  return result;
};
