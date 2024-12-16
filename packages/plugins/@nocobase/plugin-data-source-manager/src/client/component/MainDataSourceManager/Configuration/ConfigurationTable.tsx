/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useForm } from '@formily/react';
import { action } from '@formily/reactive';
import { uid } from '@formily/shared';
import {
  AddSubFieldAction,
  CollectionCategoriesContext,
  DataSourceContext_deprecated,
  EditSubFieldAction,
  FieldSummary,
  SchemaComponent,
  SchemaComponentContext,
  TemplateSummary,
  useAPIClient,
  useApp,
  useCancelAction,
  useCollectionManager_deprecated,
  useCompile,
  useCurrentAppInfo,
  useRecord,
} from '@nocobase/client';
import { getPickerFormat } from '@nocobase/utils/client';
import React, { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CollectionFields } from './CollectionFields';
import { collectionSchema } from './schemas/collections';

/**
 * @param service
 * @param exclude 不需要显示的 collection templates
 * @returns
 */
const useAsyncDataSource = (service: any, exclude?: string[]) => {
  return (field: any, options?: any) => {
    field.loading = true;
    service(field, options, exclude)
      .then(
        action.bound((data: any) => {
          field.dataSource = data;
          field.loading = false;
        }),
      )
      .catch(console.error);
  };
};

const useSelectedRowKeys = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  return [selectedRowKeys, setSelectedRowKeys];
};

const useDestroySubField = () => {
  const record = useRecord();
  const form = useForm();
  return {
    async run() {
      const children = form.values?.children?.slice?.();
      form.setValuesIn(
        'children',
        children.filter((child) => {
          return child.name !== record.name;
        }),
      );
    },
  };
};

const useBulkDestroySubField = () => {
  return {
    async run() {},
  };
};

// 获取当前字段列表
const useCurrentFields = () => {
  const record = useRecord();
  const { getCollectionFields } = useCollectionManager_deprecated();

  // 仅当当前字段为子表单时，从DataSourceContext中获取已配置的字段列表
  if (record.__parent && record.__parent.interface === 'subTable') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ctx = useContext(DataSourceContext_deprecated);
    return ctx.dataSource;
  }

  const fields = getCollectionFields(record.collectionName || record.name) as any[];
  return fields;
};

const useNewId = (prefix) => {
  return `${prefix || ''}${uid()}`;
};

export const ConfigurationTable = () => {
  const { t } = useTranslation();
  const { interfaces, getCollections, getCollection } = useCollectionManager_deprecated();
  const {
    data: { database },
  } = useCurrentAppInfo() || {
    data: { database: {} as any },
  };

  const data = useContext(CollectionCategoriesContext);
  const api = useAPIClient();
  const resource = api.resource('dbViews');
  const compile = useCompile();
  const form = useForm();
  const app = useApp();

  /**
   *
   * @param field
   * @param options
   * @param exclude 不需要返回的 collection templates
   * @returns
   */
  const loadCollections = async (field, options, exclude?: string[]) => {
    const { targetScope } = options;
    const isFieldInherits = field.props?.name === 'inherits';
    const filteredItems = getCollections().filter((item) => {
      if (exclude?.includes(item.template)) {
        return false;
      }
      const isAutoCreateAndThrough = item.autoCreate && item.isThrough;
      if (isAutoCreateAndThrough) {
        return false;
      }
      if (isFieldInherits && item.template === 'view') {
        return false;
      }
      //目标表不支持联合主键表
      if (field.props.name === 'target' && Array.isArray(item.filterTargetKey) && item.filterTargetKey.length > 1) {
        return false;
      }
      const templateIncluded = !targetScope?.template || targetScope.template.includes(item.template);
      const nameIncluded = !targetScope?.[field.props?.name] || targetScope[field.props.name].includes(item.name);
      return templateIncluded && nameIncluded;
    });
    return filteredItems.map((item) => ({
      label: compile(item.title),
      value: item.name,
    }));
  };

  const loadCategories = async () => {
    return data.data.map((item: any) => ({
      label: compile(item.name),
      value: item.id,
    }));
  };

  const loadDBViews = async () => {
    return resource.list().then(({ data }) => {
      return data?.data?.map((item: any) => {
        const schema = item.schema;
        return {
          label: schema ? `${schema}.${compile(item.name)}` : item.name,
          value: schema ? `${schema}@${item.name}` : item.name,
        };
      });
    });
  };

  const loadFilterTargetKeys = async (field) => {
    const { name, fields: targetFields } = field.form.values;
    const { fields } = getCollection(name) || {};
    return Promise.resolve({
      data: fields || targetFields,
    }).then(({ data }) => {
      return data
        .filter((field) => {
          if (!field.interface) {
            return false;
          }
          const interfaceOptions = app.dataSourceManager.collectionFieldInterfaceManager.getFieldInterface(
            field.interface,
          );
          if (interfaceOptions.titleUsable) {
            return true;
          }
          return false;
        })
        ?.map((item: any) => {
          return {
            label: compile(item.uiSchema?.title) || item.name,
            value: item.name,
          };
        });
    });
  };

  const loadStorages = async () => {
    return api
      .resource('storages')
      .list()
      .then(({ data }) => {
        return data?.data?.map((item: any) => {
          return {
            label: t(compile(item.title)),
            value: item.name,
          };
        });
      });
  };

  const ctx = useContext(SchemaComponentContext);
  const schemaComponentContext = useMemo(() => ({ ...ctx, designable: false }), [ctx]);

  return (
    <SchemaComponentContext.Provider value={schemaComponentContext}>
      <SchemaComponent
        schema={collectionSchema}
        components={{
          AddSubFieldAction,
          EditSubFieldAction,
          FieldSummary,
          TemplateSummay: TemplateSummary,
          CollectionFields,
        }}
        scope={{
          loadFilterTargetKeys,
          useDestroySubField,
          useBulkDestroySubField,
          useSelectedRowKeys,
          useAsyncDataSource,
          loadCollections,
          loadCategories,
          loadDBViews,
          loadStorages,
          useCurrentFields,
          useNewId,
          useCancelAction,
          interfaces,
          enableInherits: database?.dialect === 'postgres',
          isPG: database?.dialect === 'postgres',
          getPickerFormat,
        }}
      />
    </SchemaComponentContext.Provider>
  );
};
