import { keyBy } from 'lodash';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useRequest } from '../api-client';
import { useAppSpin } from '../application/hooks/useAppSpin';
import { templateOptions } from '../collection-manager/Configuration/templates';
import { useCollectionHistory } from './CollectionHistoryProvider';
import { CollectionManagerSchemaComponentProvider } from './CollectionManagerSchemaComponentProvider';
import { CollectionCategroriesContext, CollectionManagerContext } from './context';
import * as defaultInterfaces from './interfaces';
import { CollectionManagerOptions } from './types';

export const CollectionManagerProvider: React.FC<CollectionManagerOptions> = (props) => {
  const { service, interfaces, collections = [], refreshCM, updateCollection, templates } = props;
  const defaultTemplates = keyBy(templateOptions(), (item) => item.name);
  const ctx = useContext(CollectionManagerContext);
  return (
    <CollectionManagerContext.Provider
      value={{
        ...ctx,
        service,
        interfaces: { ...defaultInterfaces, ...ctx.interfaces, ...interfaces },
        templates: { ...defaultTemplates, ...templates },
        collections: [...ctx.collections, ...collections],
        refreshCM,
        updateCollection,
      }}
    >
      <CollectionManagerSchemaComponentProvider>{props.children}</CollectionManagerSchemaComponentProvider>
    </CollectionManagerContext.Provider>
  );
};

export const RemoteCollectionManagerProvider = (props: any) => {
  const { t } = useTranslation('lm-collections');
  const api = useAPIClient();
  const [contentLoading, setContentLoading] = useState(false);
  const { refreshCH } = useCollectionHistory();
  const { render } = useAppSpin();
  const options = {
    resource: 'collections',
    action: 'list',
    params: {
      paginate: false,
      appends: ['fields', 'category'],
      filter: {
        // inherit: false,
      },
      sort: ['sort'],
    },
  };
  const coptions = {
    url: 'collectionCategories:list',
    params: {
      paginate: false,
      sort: ['sort'],
    },
  };
  const service = useRequest<{
    data: any;
  }>(options);
  const result = useRequest<{
    data: any;
  }>(coptions);

  if (service.loading) {
    return render();
  }
  const refreshCM = async (opts) => {
    if (opts?.reload) {
      setContentLoading(true);
    }
    const { data } = await api.request(options);
    service.mutate(data);
    await refreshCH();
    if (opts?.reload) {
      setContentLoading(false);
    }
    return data?.data || [];
  };
  const refreshCategory = async () => {
    const { data } = await api.request(coptions);
    result.mutate(data);
    return data?.data || [];
  };

  const updateCollection = (collection) => {
    service.mutate({ data: collection });
  };

  const collections = (service?.data?.data || []).map(({ rawTitle, title, fields, ...collection }) => ({
    ...collection,
    title: rawTitle ? title : t(title),
    rawTitle: rawTitle || title,
    fields: fields.map(({ uiSchema, ...field }) => {
      if (uiSchema?.title) {
        const title = uiSchema.title;
        uiSchema.title = uiSchema.rawTitle ? title : t(title);
        uiSchema.rawTitle = uiSchema.rawTitle || title;
      }
      if (uiSchema?.enum) {
        uiSchema.enum = uiSchema.enum.map((item) => ({
          ...item,
          value: item?.value || item,
          label: item.rawLabel ? item.label : t(item.label),
          rawLabel: item.rawLabel || item.label,
        }));
      }
      return { uiSchema, ...field };
    }),
  }));

  return (
    <CollectionCategroriesProvider service={{ ...result }} refreshCategory={refreshCategory}>
      <CollectionManagerProvider
        service={{ ...service, contentLoading, setContentLoading }}
        collections={collections}
        refreshCM={refreshCM}
        updateCollection={updateCollection}
        {...props}
      />
    </CollectionCategroriesProvider>
  );
};

export const CollectionCategroriesProvider = (props) => {
  const { service, refreshCategory } = props;
  return (
    <CollectionCategroriesContext.Provider
      value={{
        data: service?.data?.data,
        refresh: refreshCategory,
        ...props,
      }}
    >
      {props.children}
    </CollectionCategroriesContext.Provider>
  );
};
