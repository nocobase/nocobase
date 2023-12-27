import { useForm } from '@formily/react';
import { action } from '@formily/reactive';
import { uid } from '@formily/shared';
import React, { useContext, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CollectionFieldsTable } from '.';
import { useAPIClient } from '../../api-client';
import { useCurrentAppInfo } from '../../appInfo';
import { useRecord } from '../../record-provider';
import { SchemaComponent, SchemaComponentContext, useCompile } from '../../schema-component';
import { useCancelAction } from '../action-hooks';
import { CollectionCategroriesContext } from '../context';
import { DataSourceContext } from '../sub-table';
import { AddSubFieldAction } from './AddSubFieldAction';
import { CollectionFields } from './CollectionFields';
import { EditSubFieldAction } from './EditSubFieldAction';
import { FieldSummary } from './components/FieldSummary';
import { TemplateSummary } from './components/TemplateSummary';
import { collectionSchema } from './schemas/collections';
import { useCollectionManagerV2 } from '../../application';

/**
 * @param service
 * @param exclude 不需要显示的 collection templates
 * @returns
 */
const useAsyncDataSource = (service: any, exclude?: string[]) => {
  return (field: any, options?: any) => {
    field.loading = true;
    // eslint-disable-next-line promise/catch-or-return
    service(field, options, exclude).then(
      action.bound((data: any) => {
        field.dataSource = data;
        field.loading = false;
      }),
    );
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
  const cm = useCollectionManagerV2();
  // 仅当当前字段为子表单时，从DataSourceContext中获取已配置的字段列表
  if (record.__parent && record.__parent.interface === 'subTable') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ctx = useContext(DataSourceContext);
    return ctx.dataSource;
  }

  const fields = cm.getCollectionFields(record.collectionName || record.name) as any[];
  return fields;
};

const useNewId = (prefix) => {
  return `${prefix || ''}${uid()}`;
};

export const ConfigurationTable = () => {
  const { t } = useTranslation();
  const cm = useCollectionManagerV2();
  const {
    data: { database },
  } = useCurrentAppInfo();

  const data = useContext(CollectionCategroriesContext);
  const api = useAPIClient();
  const resource = api.resource('dbViews');
  const collectonsRef: any = useRef();
  collectonsRef.current = useMemo(() => cm.getCollections(), [cm]);
  const interfaces = useMemo(() => {
    return cm.getCollectionFieldInterfaces();
  }, [cm]);
  const compile = useCompile();

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
    const filteredItems = collectonsRef.current.filter((item) => {
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

  const ctx = useContext(SchemaComponentContext);
  return (
    <SchemaComponentContext.Provider value={{ ...ctx, designable: false }}>
      <SchemaComponent
        schema={collectionSchema}
        components={{
          AddSubFieldAction,
          EditSubFieldAction,
          FieldSummary,
          TemplateSummay: TemplateSummary,
          CollectionFieldsTable,
          CollectionFields,
        }}
        scope={{
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
        }}
      />
    </SchemaComponentContext.Provider>
  );
};
