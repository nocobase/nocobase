import { useState } from 'react';
import { useCollectionManager } from '../../../collection-manager';

export const useCollectionState = (currentCollectionName: string) => {
  const { getAllCollectionsInheritChain, getCollection, getCollectionFieldsOptions } = useCollectionManager();
  const [collectionList] = useState(getCollectionList);

  function getCollectionList() {
    const collections = getAllCollectionsInheritChain(currentCollectionName);
    return collections.map((name) => ({ label: getCollection(name).title, value: name }));
  }

  const getEnableFieldTree = (collectionName: string) => {
    if (!collectionName) {
      return [];
    }

    // 过滤掉系统字段
    const exceptInterfaces = [
      'id',
      'sort',
      'createdById',
      'createdBy',
      'createdAt',
      'updatedById',
      'updatedBy',
      'updatedAt',
    ];
    const currentFieldsOptions = getCollectionFieldsOptions(currentCollectionName, undefined, {
      association: true,
      allowAllTypes: true,
      exceptInterfaces,
      usePrefix: true,
    });
    if (currentCollectionName === collectionName) {
      return currentFieldsOptions;
    }

    const fieldsOptions = getCollectionFieldsOptions(collectionName, undefined, {
      association: true,
      allowAllTypes: true,
      exceptInterfaces,
      usePrefix: true,
    });

    // 过滤掉当前表中不存在的字段
    return fieldsOptions.filter((field) => {
      return currentFieldsOptions.some((item) => item.value === field.value);
    });
  };

  return {
    collectionList,
    getEnableFieldTree,
  };
};
