import { CascaderProps } from 'antd';
import _ from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useCompile, useSchemaComponentContext } from '../../schema-component';
import { CollectionFieldOptions, CollectionOptions } from '../types';
import { InheritanceCollectionMixin } from '../mixins/InheritanceCollectionMixin';
import { uid } from '@formily/shared';
import { useDataSourceManagerV2 } from '../../data-source/data-source/DataSourceManagerProvider';
import { useDataSourceV2 } from '../../data-source/data-source/DataSourceProvider';

export const useCollectionManager = (dataSourceName?: string) => {
  const dm = useDataSourceManagerV2();
  const dataSource = useDataSourceV2();
  const dataSourceNameValue = dataSourceName || dataSource?.key || undefined;
  const [random, setRandom] = useState(uid());
  const { refresh } = useSchemaComponentContext();
  const interfaces = useMemo(
    () =>
      dm?.collectionFieldInterfaceManager?.getFieldInterfaces().reduce((acc, cur) => {
        acc[cur.name] = cur;
        return acc;
      }, {}),
    [dm, random],
  );
  const templates = useMemo(() => dm?.collectionTemplateManager.getCollectionTemplates(), [dm, random]);
  const getCollections = useCallback(() => {
    return dm?.getCollections({ dataSource: dataSourceNameValue }).map((item) => item.getOptions());
  }, [dm, dataSource]);
  const collections = useMemo(() => dm?.getCollections(), [dm, random]);
  const service = useCallback(
    () =>
      dm
        ?.getDataSource()
        .reload()
        .then(() => {
          refresh();
          setRandom(uid());
        }),
    [dm],
  );
  const refreshCM = useCallback(
    () =>
      dm
        ?.getDataSource()
        .reload()
        .then(() => {
          refresh();
          setRandom(uid());
        }),
    [dm],
  );

  const compile = useCompile();
  const getInheritedFields = useCallback(
    (name: string, customDataSource?: string) => {
      return (
        dm
          ?.getDataSource(customDataSource || dataSourceNameValue)
          ?.collectionManager?.getCollection<InheritanceCollectionMixin>(name)
          ?.getInheritedFields() || []
      );
    },
    [dm],
  );

  const getCollectionFields = useCallback(
    (name: any, customDataSource?: string): CollectionFieldOptions[] => {
      if (!name) return [];
      const collection = dm
        ?.getDataSource(customDataSource || dataSourceNameValue)
        ?.collectionManager?.getCollection<InheritanceCollectionMixin>(name);

      return collection?.getAllFields?.() || collection?.getFields() || [];
    },
    [dm],
  );
  const getCollectionField = useCallback(
    (name: string, customDataSource?: string) => {
      if (!name || name.split('.').length < 2) return;
      return dm?.getDataSource(customDataSource || dataSourceNameValue)?.collectionManager.getCollectionField(name);
    },
    [dm],
  );
  const getInheritCollections = useCallback(
    (name, customDataSource?: string) => {
      if (!name) return [];
      return (
        dm
          ?.getDataSource(customDataSource || dataSourceNameValue)
          ?.collectionManager?.getCollection<InheritanceCollectionMixin>(name)
          ?.getParentCollectionsName() || []
      );
    },
    [dm],
  );

  const getChildrenCollections = useCallback(
    (name: string, isSupportView = false, customDataSource?: string) => {
      if (!name) return [];
      return (
        dm
          ?.getDataSource(customDataSource || dataSourceNameValue)
          ?.collectionManager?.getCollection<InheritanceCollectionMixin>(name)
          ?.getChildrenCollections(isSupportView) || []
      );
    },
    [dm],
  );
  const getCurrentCollectionFields = useCallback(
    (name: string, customDataSource?: string) => {
      if (!name) return [];
      return (
        dm
          ?.getDataSource(customDataSource || dataSourceNameValue)
          ?.collectionManager?.getCollection<InheritanceCollectionMixin>(name)
          ?.getCurrentFields() || []
      );
    },
    [dm],
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
      return dm
        ?.getDataSource(customDataSource || dataSourceNameValue)
        ?.collectionManager?.getCollection<InheritanceCollectionMixin>(name);
    },
    [dm],
  );

  // 获取当前 collection 继承链路上的所有 collection
  const getAllCollectionsInheritChain = useCallback(
    (collectionName: string, customDataSource?: string) => {
      return dm
        ?.getDataSource(customDataSource || dataSourceNameValue)
        ?.collectionManager?.getCollection<InheritanceCollectionMixin>(collectionName)
        ?.getAllCollectionsInheritChain();
    },
    [dm],
  );

  /**
   * 获取继承的所有 collectionName，排列顺序为当前表往祖先表排列
   * @param collectionName
   * @returns
   */
  const getInheritCollectionsChain = useCallback(
    (collectionName: string, customDataSource?: string) => () => {
      return dm
        ?.getDataSource(customDataSource || dataSourceNameValue)
        ?.collectionManager?.getCollection<InheritanceCollectionMixin>(collectionName)
        ?.getInheritCollectionsChain();
    },
    [dm],
  );

  const getInterface = useCallback(
    (name: string) => {
      return dm?.collectionFieldInterfaceManager.getFieldInterface(name);
    },
    [dm],
  );

  // 是否可以作为标题字段
  const isTitleField = (field) => {
    return !field.isForeignKey && getInterface(field.interface)?.titleUsable;
  };

  const getParentCollectionFields = (parentCollection, currentCollection, customDataSource?: string) => {
    return dm
      ?.getDataSource(customDataSource || dataSourceNameValue)
      ?.collectionManager?.getCollection<InheritanceCollectionMixin>(currentCollection)
      ?.getParentCollectionFields(parentCollection);
  };

  const getTemplate = useCallback(
    (name = 'general') => {
      return dm?.collectionTemplateManager.getCollectionTemplate(name);
    },
    [dm],
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
