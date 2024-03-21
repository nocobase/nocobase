import { createForm, Field } from '@formily/core';
import { FieldContext, FormContext, useField, RecursionField } from '@formily/react';
import { message } from 'antd';
import React, { useContext, useMemo, useEffect, createContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {
  useAPIClient,
  SchemaComponentOptions,
  useRecord,
  useAttach,
  ResourceActionContext,
  ResourceActionProvider,
  useResourceContext,
  useCompile,
  Select,
  Collection,
  useDataSourceManager,
} from '@nocobase/client';
import { collection, fieldsTableSchema } from './schema/collectionFields';
import { TitleField } from './components/TitleField';
import { CollectionFieldInterfaceSelect } from './components/CollectionFieldInterfaceSelect';
import { AddCollectionField } from './AddFieldAction';
import { FieldTitleInput } from './components/FieldTitleInput';
import { useBulkDestroyActionAndRefreshCM, useDestroyActionAndRefreshCM } from './hooks';
import { EditCollectionField } from './EditFieldAction';
import { SourceCollection, TargetKey, SourceKey, ForeignKey, ThroughCollection } from './components';
import { FieldType } from './components/FieldType';
import { UnSupportFields } from './components/UnSupportFields';

const RemoteCollectionContext = createContext<{
  targetCollection: Collection;
  refreshRM: Function;
  titleField: string;
}>({ refreshRM: () => {}, titleField: null, targetCollection: null });
RemoteCollectionContext.displayName = 'RemoteCollectionContext';
export const useRemoteCollectionContext = () => {
  return useContext(RemoteCollectionContext);
};

export const CollectionFields = () => {
  const field: any = useField<Field>();
  const form = useMemo(() => createForm(), []);
  const f = useAttach(form.createArrayField({ ...field.props, basePath: '' }));
  const { t } = useTranslation();
  const { name: dataSourceKey } = useParams();
  const api = useAPIClient();
  const compile = useCompile();
  const service = useContext(ResourceActionContext);
  const collectionResource = useResourceContext();
  const { targetKey } = collectionResource || {};
  const targetCollection = useRecord();
  const { [targetKey]: filterByTk, titleField: targetField, name } = targetCollection;
  const [titleField, setTitleField] = useState(targetField);
  const useDataSource = (options) => {
    const service = useContext(ResourceActionContext);
    const field = useField();
    useEffect(() => {
      if (!service.loading) {
        options?.onSuccess(service.data);
        field.componentProps.dragSort = !!service.dragSort;
      }
    }, [service.loading]);
    return service;
  };

  const resourceActionProps = {
    association: {
      sourceKey: 'name',
      targetKey: 'name',
    },
    dragSort: false,
    collection,
    request: {
      url: `dataSourcesCollections/${dataSourceKey}.${name}/fields:list`,
      params: {
        paginate: false,
        filter: {
          $or: [{ 'interface.$not': null }, { 'options.source.$notEmpty': true }],
        },
        sort: ['sort'],
      },
    },
  };

  const dm = useDataSourceManager();
  const handleFieldChange = async (value, filterByTk) => {
    await api.request({
      url: `dataSourcesCollections/${dataSourceKey}.${name}/fields:update?filterByTk=${filterByTk}`,
      method: 'post',
      data: value,
    });
    dm.getDataSource(dataSourceKey).reload();
    message.success(t('Saved successfully'));
  };
  const useTitleFieldProps = () => {
    return {
      filterByTk,
      titleField,
      dataSourceKey,
      setTitleField,
    };
  };

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
    const { data } = await api.request({
      url: `dataSources/${dataSourceKey}/collections:list`,
      params: {
        paginate: false,
        appends: ['fields'],
        sort: ['sort'],
      },
    });
    const filteredItems = data?.data?.filter((item) => {
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
      label: compile(item.title || item.name),
      value: item.name,
    }));
  };

  return (
    <RemoteCollectionContext.Provider
      value={{
        refreshRM: () => {
          service.refresh();
        },
        titleField,
        targetCollection,
      }}
    >
      <ResourceActionProvider {...resourceActionProps}>
        <FormContext.Provider value={form}>
          <FieldContext.Provider value={f}>
            <SchemaComponentOptions
              components={{
                TitleField,
                CollectionFieldInterfaceSelect,
                AddCollectionField,
                SourceCollection,
                TargetKey,
                SourceKey,
                FieldTitleInput,
                EditCollectionField,
                Select,
                FieldType,
                ForeignKey,
                ThroughCollection,
              }}
              inherit
              scope={{
                useDataSource,
                useTitleFieldProps,
                handleFieldChange,
                useDestroyActionAndRefreshCM,
                useBulkDestroyActionAndRefreshCM,
                loadCollections,
              }}
            >
              <RecursionField schema={fieldsTableSchema} onlyRenderProperties />
            </SchemaComponentOptions>
          </FieldContext.Provider>
        </FormContext.Provider>
      </ResourceActionProvider>
      <UnSupportFields />
    </RemoteCollectionContext.Provider>
  );
};
