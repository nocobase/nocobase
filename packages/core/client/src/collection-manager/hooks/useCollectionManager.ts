import { CascaderProps } from 'antd';
import _ from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useCompile, useSchemaComponentContext } from '../../schema-component';
import { CollectionFieldOptions, CollectionOptions } from '../types';
import { useCollectionManagerV2 } from '../../application/collection/CollectionManagerProvider';
import { InheritanceCollectionMixin } from '../mixins/InheritanceCollectionMixin';
import { uid } from '@formily/shared';
import { useCollectionDataSourceName } from '../../application/collection/CollectionDataSourceProvider';

export const useCollectionManager = (dataSourceName?: string) => {
  const cm = useCollectionManagerV2();
  const blockDataSourceName = useCollectionDataSourceName();
  const dataSourceNameValue = dataSourceName || blockDataSourceName || undefined;
  const [random, setRandom] = useState(uid());
  const { refresh } = useSchemaComponentContext();
  const interfaces = useMemo(() => cm?.getFieldInterfaces(), [cm, random]);
  const templates = useMemo(() => cm?.getCollectionTemplates(), [cm, random]);
  const getCollections = useCallback(() => {
    return cm
      ?.getCollections()
      .filter((item) => !item.isLocal)
      .map((item) => item.getOptions());
  }, [cm]);
  const collections = useMemo(() => getCollections(), [cm, random]);
  const service = useCallback(
    () =>
      cm?.reloadMain(() => {
        refresh();
        setRandom(uid());
      }),
    [cm],
  );
  const updateCollection = cm?.setCollections.bind(cm);
  const refreshCM = useCallback(
    () =>
      cm?.reloadMain(() => {
        refresh();
        setRandom(uid());
      }),
    [cm],
  );

  const compile = useCompile();
  const getInheritedFields = useCallback(
    (name: string, customDataSource?: string) => {
      return (
        cm
          ?.getCollection<InheritanceCollectionMixin>(name, { dataSource: customDataSource || dataSourceNameValue })
          ?.getInheritedFields() || []
      );
    },
    [cm],
  );

  const getCollectionFields = useCallback(
    (name: any, customDataSource?: string): CollectionFieldOptions[] => {
      if (!name) return [];
      const collection = cm?.getCollection<InheritanceCollectionMixin>(name, {
        dataSource: customDataSource || dataSourceNameValue,
      });

      return collection?.getAllFields?.() || collection?.getFields() || [];
    },
    [cm],
  );
  const getCollectionField = useCallback(
    (name: string, customDataSource?: string) => {
      if (!name || name.split('.').length < 2) return;
      return cm?.getCollectionField(name, { dataSource: customDataSource || dataSourceNameValue });
    },
    [cm],
  );
  const getInheritCollections = useCallback(
    (name, customDataSource?: string) => {
      if (!name) return [];
      return (
        cm
          ?.getCollection<InheritanceCollectionMixin>(name, { dataSource: customDataSource || dataSourceNameValue })
          ?.getParentCollectionsName() || []
      );
    },
    [cm],
  );

  const getChildrenCollections = useCallback(
    (name: string, isSupportView = false, customDataSource?: string) => {
      if (!name) return [];
      return (
        cm
          ?.getCollection<InheritanceCollectionMixin>(name, { dataSource: customDataSource || dataSourceNameValue })
          ?.getChildrenCollections(isSupportView) || []
      );
    },
    [cm],
  );
  const getCurrentCollectionFields = useCallback(
    (name: string, customDataSource?: string) => {
      if (!name) return [];
      return (
        cm
          ?.getCollection<InheritanceCollectionMixin>(name, { dataSource: customDataSource || dataSourceNameValue })
          ?.getCurrentFields() || []
      );
    },
    [cm],
  );

  // 缓存下面已经获取的 options，防止无限循环
  const getCollectionFieldsOptions = useCallback(
    (
      collectionName: string,
      type: string | string[] = 'string',
      opts?: {
        dataSource?: string;
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
        dataSource: customDataSourceNameValue,
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
      const fields = getCollectionFields(collectionName, customDataSourceNameValue);
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
                  dataSource: customDataSourceNameValue,
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
    },
    [getCollectionFields],
  );

  const getCollection = useCallback(
    (name: any, customDataSource?: string): CollectionOptions => {
      return cm?.getCollection(name, { dataSource: customDataSource || dataSourceNameValue });
    },
    [cm],
  );

  // 获取当前 collection 继承链路上的所有 collection
  const getAllCollectionsInheritChain = useCallback(
    (collectionName: string, customDataSource?: string) => {
      return cm
        ?.getCollection<InheritanceCollectionMixin>(collectionName, {
          dataSource: customDataSource || dataSourceNameValue,
        })
        ?.getAllCollectionsInheritChain();
    },
    [cm],
  );

  /**
   * 获取继承的所有 collectionName，排列顺序为当前表往祖先表排列
   * @param collectionName
   * @returns
   */
  const getInheritCollectionsChain = useCallback(
    (collectionName: string, customDataSource?: string) => () => {
      return cm
        ?.getCollection<InheritanceCollectionMixin>(collectionName, {
          dataSource: customDataSource || dataSourceNameValue,
        })
        ?.getInheritCollectionsChain();
    },
    [cm],
  );

  const getInterface = useCallback(
    (name: string) => {
      return cm?.getFieldInterface(name);
    },
    [cm],
  );

  // 是否可以作为标题字段
  const isTitleField = (field) => {
    return !field.isForeignKey && getInterface(field.interface)?.titleUsable;
  };

  const getParentCollectionFields = (parentCollection, currentCollection, customDataSource?: string) => {
    return cm
      ?.getCollection<InheritanceCollectionMixin>(currentCollection, {
        dataSource: customDataSource || dataSourceNameValue,
      })
      ?.getParentCollectionFields(parentCollection);
  };

  const getTemplate = useCallback(
    (name = 'general') => {
      return cm?.getCollectionTemplate(name);
    },
    [cm],
  );

  return {
    service,
    interfaces,
    collections,
    templates,
    getTemplate,
    getInterface,
    getCollections,
    getParentCollectionFields,
    getInheritCollections,
    getChildrenCollections,
    refreshCM,
    updateCollection,
    get: getCollection,
    getInheritedFields,
    getCollectionField,
    getCollectionFields,
    getCollectionFieldsOptions,
    getCurrentCollectionFields,
    getCollection,
    getCollectionJoinField: getCollectionField,
    getAllCollectionsInheritChain,
    getInheritCollectionsChain,
    isTitleField,
  };
};
