import { CascaderProps } from 'antd';
import _ from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useCompile, useSchemaComponentContext } from '../../schema-component';
import { CollectionFieldOptions_deprecated, CollectionOptions } from '../types';
import { InheritanceCollectionMixin } from '../mixins/InheritanceCollectionMixin';
import { uid } from '@formily/shared';
import { useDataSourceManager } from '../../data-source/data-source/DataSourceManagerProvider';
import { useDataSource } from '../../data-source/data-source/DataSourceProvider';
import { DEFAULT_DATA_SOURCE_KEY } from '../../data-source/data-source/DataSourceManager';
import { useCollectionManager } from '../../data-source/collection/CollectionManagerProvider';

/**
 * @deprecated use `useCollectionManager` instead
 */
export const useCollectionManager_deprecated = (dataSourceName?: string) => {
  const dm = useDataSourceManager();
  const dataSource = useDataSource();
  const cm = useCollectionManager();
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
    return dm
      ?.getDataSource(dataSourceNameValue)
      ?.collectionManager?.getCollections()
      .map((item) => item.getOptions());
  }, [dm, dataSource]);

  const getCm = useCallback(
    (dataSource?: string) => {
      if (cm && !dataSource) return cm;
      return dm?.getDataSource(dataSource || dataSourceNameValue)?.collectionManager;
    },
    [cm, dm, dataSourceNameValue],
  );

  const collections = useMemo(
    () => dm?.getDataSource(DEFAULT_DATA_SOURCE_KEY)?.collectionManager?.getCollections(),
    [dm, random],
  );
  const service = useCallback(
    () =>
      dm
        ?.getDataSource(DEFAULT_DATA_SOURCE_KEY)
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
        ?.getDataSource(DEFAULT_DATA_SOURCE_KEY)
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
      return getCm(customDataSource)?.getCollection<InheritanceCollectionMixin>(name)?.getInheritedFields() || [];
    },
    [dm, getCm],
  );

  const getCollectionFields = useCallback(
    (name: any, customDataSource?: string): CollectionFieldOptions_deprecated[] => {
      if (!name) return [];
      const collection = getCm(customDataSource)?.getCollection<InheritanceCollectionMixin>(name);

      return collection?.getAllFields?.() || collection?.getFields() || [];
    },
    [dm, getCm],
  );
  const getCollectionField = useCallback(
    (name: string, customDataSource?: string) => {
      if (!name || name.split('.').length < 2) return;
      return getCm(customDataSource)?.getCollectionField(name);
    },
    [dm, getCm],
  );
  const getInheritCollections = useCallback(
    (name, customDataSource?: string) => {
      if (!name) return [];
      return getCm(customDataSource)?.getCollection<InheritanceCollectionMixin>(name)?.getParentCollectionsName() || [];
    },
    [dm, getCm],
  );

  const getChildrenCollections = useCallback(
    (name: string, isSupportView = false, customDataSource?: string) => {
      if (!name) return [];
      const collection = getCm(customDataSource)?.getCollection<InheritanceCollectionMixin>(name);
      const res = collection?.getChildrenCollections(isSupportView);
      return res || [];
    },
    [dm, getCm],
  );
  const getCurrentCollectionFields = useCallback(
    (name: string, customDataSource?: string) => {
      if (!name) return [];
      return getCm(customDataSource)?.getCollection<InheritanceCollectionMixin>(name)?.getCurrentFields() || [];
    },
    [dm, getCm],
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
      return getCm(customDataSource)?.getCollection<InheritanceCollectionMixin>(name);
    },
    [dm, getCm],
  );

  // 获取当前 collection 继承链路上的所有 collection
  const getAllCollectionsInheritChain = useCallback(
    (collectionName: string, customDataSource?: string) => {
      return getCm(customDataSource)
        ?.getCollection<InheritanceCollectionMixin>(collectionName)
        ?.getAllCollectionsInheritChain();
    },
    [dm, getCm],
  );

  /**
   * 获取继承的所有 collectionName，排列顺序为当前表往祖先表排列
   * @param collectionName
   * @returns
   */
  const getInheritCollectionsChain = useCallback(
    (collectionName: string, customDataSource?: string) => () => {
      return getCm(customDataSource)
        ?.getCollection<InheritanceCollectionMixin>(collectionName)
        ?.getInheritCollectionsChain();
    },
    [dm, getCm],
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

  const getParentCollectionFields = useCallback(
    (parentCollection, currentCollection, customDataSource?: string) => {
      return getCm(customDataSource)
        ?.getCollection<InheritanceCollectionMixin>(currentCollection)
        ?.getParentCollectionFields(parentCollection);
    },
    [dm, getCm],
  );

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
