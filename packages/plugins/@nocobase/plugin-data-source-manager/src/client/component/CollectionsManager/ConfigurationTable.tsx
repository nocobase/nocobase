import { useForm, useField } from '@formily/react';
import { action } from '@formily/reactive';
import { uid } from '@formily/shared';
import React, { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {
  useAPIClient,
  useCurrentAppInfo,
  useRecord,
  SchemaComponent,
  SchemaComponentContext,
  useCompile,
  CollectionCategroriesContext,
  useCollectionManager_deprecated,
  useCancelAction,
  AddSubFieldAction,
  EditSubFieldAction,
  FieldSummary,
  TemplateSummary,
  ResourceActionContext,
  useDataSourceManager,
} from '@nocobase/client';
import { message } from 'antd';
import { getCollectionSchema } from './schema/collections';
import { CollectionFields } from './CollectionFields';
import { EditCollection } from './EditCollectionAction';
import { DataSourceContext } from '../../DatabaseConnectionProvider';

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

const useNewId = (prefix) => {
  return `${prefix || ''}${uid()}`;
};

export const ConfigurationTable = () => {
  const { t } = useTranslation();
  const { interfaces } = useCollectionManager_deprecated();
  const {
    data: { database },
  } = useCurrentAppInfo();
  const ds = useDataSourceManager();
  const ctx = useContext(SchemaComponentContext);
  const { name } = useParams();
  const data = useContext(CollectionCategroriesContext);
  const api = useAPIClient();
  const resource = api.resource('dbViews');
  const compile = useCompile();
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
    const { name } = useParams();
    field.data = field.data || {};
    const { setDataSource, dataSource } = useContext(DataSourceContext);
    return {
      async onClick() {
        field.data.loading = true;
        try {
          const { data } = await api.request({
            url: `dataSources:refresh?filterByTk=${name}&clientStatus=${dataSource?.status || 'loaded'}`,
            method: 'post',
          });
          field.data.loading = false;
          setDataSource(data?.data);
          if (data?.data?.status === 'reloading') {
            message.warning(t('Data source synchronization in progress'));
          } else if (data?.data?.status === 'loaded') {
            message.success(t('Data source synchronization successful'));
            service?.refresh?.();
          }
          await ds.getDataSource(name).reload();
        } catch (error) {
          field.data.loading = false;
        }
      },
    };
  };
  const collectionSchema = useMemo(() => {
    return getCollectionSchema(name);
  }, [name]);
  return (
    <SchemaComponentContext.Provider value={{ ...ctx, designable: false }}>
      <SchemaComponent
        schema={collectionSchema}
        components={{
          EditCollection,
          AddSubFieldAction,
          EditSubFieldAction,
          FieldSummary,
          TemplateSummay: TemplateSummary,
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
