import { clone } from '@formily/shared';
import { reduce, unionBy, uniq } from 'lodash';
import { useContext } from 'react';
import { CollectionManagerContext } from '../context';
import { CollectionFieldOptions } from '../types';

export const useCollectionManager = () => {
  const { refreshCM, service, interfaces, collections, templates } = useContext(CollectionManagerContext);
  const getInheritedFields = (name) => {
    const inheritKeys = getInheritCollections(name);
    const inheritedFields = reduce(
      inheritKeys,
      (result, value) => {
        const arr = result;
        return arr.concat(collections?.find((collection) => collection.name === value)?.fields);
      },
      [],
    );
    return inheritedFields;
  };

  const getCollectionFields = (name: string): CollectionFieldOptions[] => {
    const currentFields = collections?.find((collection) => collection.name === name)?.fields;
    const inheritedFields = getInheritedFields(name);
    const totalFields = unionBy(currentFields?.concat(inheritedFields) || [], 'name').filter((v: any) => {
      return !v.isForeignKey;
    });
    return totalFields;
  };
  const getCollectionField = (name: string) => {
    const [collectionName, fieldName] = name.split('.');
    if (!fieldName) {
      return;
    }
    const collection = collections?.find((collection) => collection.name === collectionName);
    if (!collection) {
      return;
    }
    return getCollectionFields(collectionName)?.find((field) => field.name === fieldName);
  };
  const getInheritCollections = (name) => {
    const parents = [];
    const getParents = (name) => {
      const collection = collections?.find((collection) => collection.name === name);
      if (collection) {
        const { inherits } = collection;
        if (inherits) {
          for (let index = 0; index < inherits.length; index++) {
            const collectionKey = inherits[index];
            parents.push(collectionKey);
            getParents(collectionKey);
          }
        }
      }
      return uniq(parents);
    };

    return getParents(name);
  };

  const getChildrenCollections = (name) => {
    const childrens = [];
    const getChildrens = (name) => {
      const inheritCollections = collections.filter((v) => {
        return v.inherits?.includes(name);
      });
      inheritCollections.forEach((v) => {
        const collectionKey = v.name;
        childrens.push(v);
        return getChildrens(collectionKey);
      });
      return childrens;
    };
    return getChildrens(name);
  };
  const getCurrentCollectionFields = (name: string) => {
    const collection = collections?.find((collection) => collection.name === name);
    return collection?.fields || [];
  };

  return {
    service,
    interfaces,
    collections,
    getInheritCollections,
    getChildrenCollections,
    refreshCM: () => refreshCM?.(),
    get(name: string) {
      return collections?.find((collection) => collection.name === name);
    },
    getInheritedFields,
    getCollectionField,
    getCollectionFields,
    getCurrentCollectionFields,
    getCollection(name: any) {
      if (typeof name !== 'string') {
        return name;
      }
      return collections?.find((collection) => collection.name === name);
    },
    getCollectionJoinField(name: string) {
      if (!name) {
        return;
      }
      const [collectionName, ...fieldNames] = name.split('.');
      if (!fieldNames?.length) {
        return;
      }
      let cName: any = collectionName;
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
    getTemplate(name: string = 'general') {
      return templates[name] ? clone(templates[name] || templates['general']) : null;
    },
    getParentCollectionFields: (parentCollection, currentCollection) => {
      const currentFields = collections?.find((collection) => collection.name === currentCollection)?.fields;
      const parentFields = collections?.find((collection) => collection.name === parentCollection)?.fields;
      const inheritKeys = getInheritCollections(currentCollection);
      const index = inheritKeys.indexOf(parentCollection);
      let filterFields = currentFields;
      if (index > 0) {
        inheritKeys.splice(index);
        inheritKeys.forEach((v) => {
          filterFields = filterFields.concat(getCurrentCollectionFields(v));
        });
      }
      return parentFields.filter((v) => {
        return !filterFields.find((k) => {
          return k.name === v.name;
        });
      });
    },
  };
};
