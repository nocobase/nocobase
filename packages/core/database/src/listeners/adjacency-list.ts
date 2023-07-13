import { CollectionOptions } from '../collection';

export const beforeDefineAdjacencyListCollection = (options: CollectionOptions) => {
  if (!options.tree) {
    return;
  }
  (options.fields || []).forEach((field) => {
    if (field.treeParent || field.treeChildren) {
      if (!field.target) {
        field.target = options.name;
      }
      if (!field.foreignKey) {
        field.foreignKey = 'parentId';
      }
    }
  });
};
