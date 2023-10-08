import { clone } from '@formily/shared';
import { CascaderProps } from 'antd';
import _, { reduce, unionBy, uniq, uniqBy } from 'lodash';
import { useContext } from 'react';
import { useCompile } from '../../schema-component';
import { CollectionManagerContext } from '../context';
import { CollectionFieldOptions, CollectionOptions } from '../types';

export const useCollectionManager = () => {
  const { refreshCM, updateCollection, service, interfaces, collections, templates } = useContext(
    CollectionManagerContext,
  );
  const compile = useCompile();
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
    return inheritedFields.filter(Boolean);
  };

  const getCollectionFields = (name: any): CollectionFieldOptions[] => {
    const collection = getCollection(name);
    const currentFields = collection?.fields || [];
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

  const getChildrenCollections = (name, isSupportView = false) => {
    const children = [];
    const getChildren = (name) => {
      const inheritCollections = collections.filter((v) => {
        return v.inherits?.includes(name);
      });
      inheritCollections.forEach((v) => {
        const collectionKey = v.name;
        children.push(v);
        return getChildren(collectionKey);
      });
      if (isSupportView) {
        const sourceCollections = collections.filter((v) => {
          return v.sources?.length === 1 && v?.sources[0] === name;
        });
        sourceCollections.forEach((v) => {
          const collectionKey = v.name;
          children.push(v);
          return getChildren(collectionKey);
        });
      }
      return uniqBy(children, 'key');
    };
    return getChildren(name);
  };
  const getCurrentCollectionFields = (name: string) => {
    const collection = collections?.find((collection) => collection.name === name);
    return collection?.fields || [];
  };

  // 缓存下面已经获取的 options，防止无限循环
  const getCollectionFieldsOptions = (
    collectionName: string,
    type: string | string[] = 'string',
    opts?: {
      cached?: Record<string, any>;
      collectionNames?: string[];
      /**
       * 为 true 时允许查询所有关联字段
       * 为 Array<string> 时仅允许查询指定的关联字段
       */
      association?: boolean | string[];
      /**
       * Max depth of recursion
       */
      maxDepth?: number;
      allowAllTypes?: boolean;
      /**
       * 排除这些接口的字段
       */
      exceptInterfaces?: string[];
      /**
       * field value 的前缀，用 . 连接，比如 a.b.c
       */
      prefixFieldValue?: string;
      /**
       * 是否使用 prefixFieldValue 作为 field value
       */
      usePrefix?: boolean;
    },
  ) => {
    const {
      association = false,
      cached = {},
      collectionNames = [collectionName],
      maxDepth = 1,
      allowAllTypes = false,
      exceptInterfaces = [],
      prefixFieldValue = '',
      usePrefix = false,
    } = opts || {};

    if (collectionNames.length - 1 > maxDepth) {
      return;
    }

    if (cached[collectionName]) {
      // avoid infinite recursion
      return _.cloneDeep(cached[collectionName]);
    }

    if (typeof type === 'string') {
      type = [type];
    }
    const fields = getCollectionFields(collectionName);
    const options = fields
      ?.filter(
        (field) =>
          field.interface &&
          !exceptInterfaces.includes(field.interface) &&
          (allowAllTypes ||
            type.includes(field.type) ||
            (association && field.target && field.target !== collectionName && Array.isArray(association)
              ? association.includes(field.interface)
              : false)),
      )
      ?.map((field) => {
        const result: CascaderProps<any>['options'][0] = {
          value: usePrefix && prefixFieldValue ? `${prefixFieldValue}.${field.name}` : field.name,
          label: compile(field?.uiSchema?.title) || field.name,
          ...field,
        };
        if (association && field.target) {
          result.children = collectionNames.includes(field.target)
            ? []
            : getCollectionFieldsOptions(field.target, type, {
                ...opts,
                cached,
                collectionNames: [...collectionNames, field.target],
                prefixFieldValue: usePrefix
                  ? prefixFieldValue
                    ? `${prefixFieldValue}.${field.name}`
                    : field.name
                  : '',
                usePrefix,
              });
          if (!result.children?.length) {
            return null;
          }
        }
        return result;
      })
      // 过滤 map 产生为 null 的数据
      .filter(Boolean);

    cached[collectionName] = options;
    return options;
  };

  const getCollection = (name: any): CollectionOptions => {
    if (typeof name !== 'string') {
      return name;
    }
    return collections?.find((collection) => collection.name === name);
  };

  // 获取当前 collection 继承链路上的所有 collection
  const getAllCollectionsInheritChain = (collectionName: string) => {
    const collectionsInheritChain = [collectionName];
    const getInheritChain = (name: string) => {
      const collection = getCollection(name);
      if (collection) {
        const { inherits } = collection;
        const children = getChildrenCollections(name);
        // 搜寻祖先表
        if (inherits) {
          for (let index = 0; index < inherits.length; index++) {
            const collectionKey = inherits[index];
            if (collectionsInheritChain.includes(collectionKey)) {
              continue;
            }
            collectionsInheritChain.push(collectionKey);
            getInheritChain(collectionKey);
          }
        }
        // 搜寻后代表
        if (children) {
          for (let index = 0; index < children.length; index++) {
            const collectionKey = children[index].name;
            if (collectionsInheritChain.includes(collectionKey)) {
              continue;
            }
            collectionsInheritChain.push(collectionKey);
            getInheritChain(collectionKey);
          }
        }
      }
      return collectionsInheritChain;
    };

    return getInheritChain(collectionName);
  };

  /**
   * 获取继承的所有 collectionName，排列顺序为当前表往祖先表排列
   * @param collectionName
   * @returns
   */
  const getInheritCollectionsChain = (collectionName: string) => {
    const collectionsInheritChain = [collectionName];
    const getInheritChain = (name: string) => {
      const collection = getCollection(name);
      if (collection) {
        const { inherits } = collection;
        if (inherits) {
          for (let index = 0; index < inherits.length; index++) {
            const collectionKey = inherits[index];
            if (collectionsInheritChain.includes(collectionKey)) {
              continue;
            }
            collectionsInheritChain.push(collectionKey);
            getInheritChain(collectionKey);
          }
        }
      }
      return collectionsInheritChain;
    };

    return getInheritChain(collectionName);
  };

  const getInterface = (name: string) => {
    return interfaces[name] ? clone(interfaces[name]) : null;
  };

  // 是否可以作为标题字段
  const isTitleField = (field) => {
    return !field.isForeignKey && getInterface(field.interface)?.titleUsable;
  };

  return {
    service,
    interfaces,
    collections,
    getInheritCollections,
    getChildrenCollections,
    refreshCM: () => refreshCM?.(),
    updateCollection,
    get(name: string) {
      return collections?.find((collection) => collection.name === name);
    },
    getInheritedFields,
    getCollectionField,
    getCollectionFields,
    getCollectionFieldsOptions,
    getCurrentCollectionFields,
    getCollection,
    getCollectionJoinField(name: string): CollectionFieldOptions {
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
    getInterface,
    getTemplate(name = 'general') {
      return templates[name] ? clone(templates[name] || templates['general']) : null;
    },
    getParentCollectionFields: (parentCollection, currentCollection) => {
      const currentFields = collections?.find((collection) => collection.name === currentCollection)?.fields || [];
      const parentFields = collections?.find((collection) => collection.name === parentCollection)?.fields || [];
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
    getAllCollectionsInheritChain,
    getInheritCollectionsChain,
    isTitleField,
  };
};
