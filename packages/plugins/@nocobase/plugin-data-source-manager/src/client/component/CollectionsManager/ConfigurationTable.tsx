import { useForm, useField } from '@formily/react';
import { action } from '@formily/reactive';
import { uid } from '@formily/shared';
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {
  useAPIClient,
  CollectionFieldsTable,
  useCurrentAppInfo,
  useRecord,
  SchemaComponent,
  SchemaComponentContext,
  useCompile,
  CollectionCategroriesContext,
  useCollectionManager,
  useCancelAction,
  AddSubFieldAction,
  EditSubFieldAction,
  FieldSummary,
  TemplateSummary,
  ResourceActionContext,
  useCollectionManagerV2,
} from '@nocobase/client';
import { message } from 'antd';
import { getCollectionSchema } from './schema/collections';
import { CollectionFields } from './CollectionFields';
import { EditCollection } from './EditCollectionAction';

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
      .catch((error) => console.log(error));
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

// // 获取当前字段列表
// const useCurrentFields = () => {
//   const record = useRecord();
//   // 仅当当前字段为子表单时，从DataSourceContext中获取已配置的字段列表
//   if (record.__parent && record.__parent.interface === 'subTable') {
//     const ctx = useContext(DataSourceContext);
//     return ctx.dataSource;
//   }

//   const { getCollectionFields } = useCollectionManager();
//   const fields = getCollectionFields(record.collectionName || record.name) as any[];
//   return fields;
// };

const useNewId = (prefix) => {
  return `${prefix || ''}${uid()}`;
};

export const ConfigurationTable = () => {
  const { t } = useTranslation();
  const { interfaces } = useCollectionManager();
  const {
    data: { database },
  } = useCurrentAppInfo();
  const ctx = useContext(SchemaComponentContext);
  const { name } = useParams();
  const data = useContext(CollectionCategroriesContext);
  const api = useAPIClient();
  const resource = api.resource('dbViews');
  const compile = useCompile();
  const cm = useCollectionManagerV2();

  useEffect(() => {
    return () => {
      cm.reloadThirdDataSource();
    };
  }, []);
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
          value: schema ? `${schema}_${item.name}` : item.name,
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

  const useRefreshActionProps = () => {
    const service = useContext(ResourceActionContext);
    const api = useAPIClient();
    const field = useField();
    field.data = field.data || {};
    return {
      async onClick() {
        field.data.loading = true;
        try {
          await api.request({
            url: `dataSources:refresh?filterByTk=${name}`,
            method: 'post',
          });
          field.data.loading = false;
          service?.refresh?.();
          message.success(t('Sync successfully'));
        } catch (error) {
          field.data.loading = false;
        }
      },
    };
  };
  return (
    <SchemaComponentContext.Provider value={{ ...ctx, designable: false }}>
      <SchemaComponent
        schema={getCollectionSchema(name)}
        components={{
          EditCollection,
          AddSubFieldAction,
          EditSubFieldAction,
          FieldSummary,
          TemplateSummay: TemplateSummary,
          CollectionFieldsTable,
          CollectionFields,
        }}
        scope={{
          useRefreshActionProps,
          useDestroySubField,
          useBulkDestroySubField,
          useSelectedRowKeys,
          useAsyncDataSource,
          loadCategories,
          loadDBViews,
          loadStorages,
          // useCurrentFields,
          useNewId,
          useCancelAction,
          interfaces,
          enableInherits: database?.dialect === 'postgres',
          isPG: database?.dialect === 'postgres',
        }}
      />
    </SchemaComponentContext.Provider>
  );
};
