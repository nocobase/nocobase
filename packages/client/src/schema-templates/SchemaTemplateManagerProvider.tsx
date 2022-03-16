import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { Spin } from 'antd';
import React, { createContext, useContext } from 'react';
import { useAPIClient, useRequest } from '../api-client';
import { SchemaComponentOptions } from '../schema-component';
import { BlockTemplate } from './BlockTemplate';

export const SchemaTemplateManagerContext = createContext<any>({});

export const SchemaTemplateManagerProvider: React.FC<any> = (props) => {
  const { templates, refresh } = props;
  return (
    <SchemaTemplateManagerContext.Provider value={{ templates, refresh }}>
      <SchemaComponentOptions components={{ BlockTemplate }}>{props.children}</SchemaComponentOptions>
    </SchemaTemplateManagerContext.Provider>
  );
};

const regenerateUid = (s: ISchema) => {
  s['x-uid'] = uid();
  delete s['x-index'];
  Object.keys(s.properties || {}).forEach((key) => {
    regenerateUid(s.properties[key]);
  });
};

export const useSchemaTemplateManager = () => {
  const { refresh, templates = [] } = useContext(SchemaTemplateManagerContext);
  const api = useAPIClient();
  return {
    templates,
    refresh,
    async copyTemplateSchema(template) {
      const { data } = await api.request({
        url: `/uiSchemas:getJsonSchema/${template.uid}`,
      });
      const s = data?.data || {};
      regenerateUid(s);
      return s;
    },
    async saveAsTemplate(values) {
      const { uiSchema } = values;
      const key = uid();
      regenerateUid(uiSchema);
      await api.resource('uiSchemaTemplates').create({
        values: {
          key,
          ...values,
          uiSchema,
        },
      });
      await refresh();
      return { key };
    },
    async duplicate(template) {
      const { data } = await api.request({
        url: `/uiSchemas:getJsonSchema/${template.uid}`,
      });
      const s = data?.data || {};
      regenerateUid(s);
      return s;
    },
    getTemplateBySchemaId(schemaId) {
      return templates?.find((template) => template.uid === schemaId);
    },
    getTemplateById(key) {
      return templates?.find((template) => template.key === key);
    },
    getTemplatesByCollection(collectionName: string) {
      const items = templates?.filter?.((template) => template.collectionName === collectionName);
      return items || [];
    },
  };
};

export const RemoteSchemaTemplateManagerProvider: React.FC = (props) => {
  const api = useAPIClient();
  const options = {
    resource: 'uiSchemaTemplates',
    action: 'list',
    params: {
      appends: ['collection'],
      paginate: false,
    },
  };
  const service = useRequest(options);
  if (service.loading) {
    return <Spin />;
  }
  return (
    <SchemaTemplateManagerProvider
      refresh={async () => {
        const { data } = await api.request(options);
        service.mutate(data);
      }}
      templates={service?.data?.data}
    >
      {props.children}
    </SchemaTemplateManagerProvider>
  );
};
