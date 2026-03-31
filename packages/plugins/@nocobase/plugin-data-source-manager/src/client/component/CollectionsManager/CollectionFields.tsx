/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm, Field } from '@formily/core';
import { FieldContext, FormContext, RecursionField, useField } from '@formily/react';
import {
  Collection,
  ResourceActionContext,
  ResourceActionProvider,
  SchemaComponentOptions,
  Select,
  useAPIClient,
  useAttach,
  useCompile,
  useDataSourceManager,
  useRecord,
  useResourceContext,
} from '@nocobase/client';
import { message } from 'antd';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { AddCollectionField } from './AddFieldAction';
import { ForeignKey, SourceCollection, SourceKey, TargetKey, ThroughCollection } from './components';
import { CollectionFieldInterfaceSelect } from './components/CollectionFieldInterfaceSelect';
import { FieldTitleInput } from './components/FieldTitleInput';
import { FieldType } from './components/FieldType';
import { TitleField } from './components/TitleField';
import { UnSupportFields } from './components/UnSupportFields';
import { EditCollectionField } from './EditFieldAction';
import { FilterTargetKeyAlert } from './FilterTargetKeyAlert';
import { useBulkDestroyActionAndRefreshCM, useDestroyActionAndRefreshCM } from './hooks';
import { collection, fieldsTableSchema } from './schema/collectionFields';

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

  let isProcessing = false;
  const queue = [];

  const processQueue = async () => {
    if (isProcessing) return;
    if (queue.length === 0) return;

    isProcessing = true;
    const { value, filterByTk, flag } = queue.shift();

    try {
      await handleFieldChange(value, filterByTk, flag);
    } catch (error) {
      console.error('Error processing handleFieldChange:', error);
    } finally {
      isProcessing = false;
      processQueue();
    }
  };

  const enqueueChange = (value, filterByTk, flag) => {
    queue.push({ value, filterByTk, flag });
    processQueue();
  };

  const handleFieldChange = async (value, filterByTk, flag = true) => {
    if (value.possibleTypes) {
      delete value.possibleTypes;
    }
    await api.request({
      url: `dataSourcesCollections/${dataSourceKey}.${name}/fields:update?filterByTk=${filterByTk}`,
      method: 'post',
      data: value,
    });
    dm.getDataSource(dataSourceKey).reload();
    flag && message.success(t('Saved successfully'));
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
      <FilterTargetKeyAlert collectionName={name} />
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
                enqueueChange,
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
