import { clone } from '@formily/shared';
import { useContext } from 'react';
import { CollectionManagerContext } from '../context';

export const useCollectionManager = () => {
  const { refreshCM, service, interfaces, collections } = useContext(CollectionManagerContext);
  const getCollectionField = (name: string) => {
    const [collectionName, fieldName] = name.split('.');
    if (!fieldName) {
      return;
    }
    const collection = collections?.find((collection) => collection.name === collectionName);
    if (!collection) {
      return;
    }
    return collection?.fields?.find((field) => field.name === fieldName);
  };
  return {
    service,
    interfaces,
    collections,
    refreshCM: () => refreshCM?.(),
    get(name: string) {
      return collections?.find((collection) => collection.name === name);
    },
    getCollection(name: any) {
      if (typeof name !== 'string') {
        return name;
      }
      return collections?.find((collection) => collection.name === name);
    },
    getCollectionFields(name: string) {
      const collection = collections?.find((collection) => collection.name === name);
      return collection?.fields || [];
    },
    getCollectionField,
    getCollectionJoinField(name: string) {
      if (!name) {
        return;
      }
      const [collectionName, ...fieldNames] = name.split('.');
      if (!fieldNames?.length) {
        return;
      }
      let cName = collectionName;
      let collectionField;
      while (cName && fieldNames.length > 0) {
        const fileName = fieldNames.shift();
        collectionField = getCollectionField(`${cName}.${fileName}`);
        if (collectionField?.target) {
          cName = collectionField.target;
        } else {
          cName = null;
        }
      }
      return collectionField;
    },
    getInterface(name: string) {
      return interfaces[name] ? clone(interfaces[name]) : null;
    },
  };
};
