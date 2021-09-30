import React, { createContext, useContext } from 'react';
import { UseRequestProvider } from 'ahooks';
import { ISchema } from '../schemas';
import { Schema, useField } from '@formily/react';
import { Resource } from '../resource';
import { ClientSDK } from '../ClientSDK';
import { extend } from 'umi-request';

const request = extend({
  prefix: process.env.API_URL,
  timeout: 30000,
});

request.use(async (ctx, next) => {
  const { headers } = ctx.req.options as any;
  const token = localStorage.getItem('NOCOBASE_TOKEN');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  await next();
});

const client = new ClientSDK({
  request,
});

const ClientContext = createContext<any>(client);

export function ClientProvider(props) {
  const { client } = props;
  return (
    <ClientContext.Provider value={client}>
      <UseRequestProvider
        value={{
          requestMethod: (service) => client.request(service),
        }}
      >
        {props.children}
      </UseRequestProvider>
    </ClientContext.Provider>
  );
}

export function useResourceRequest(options, ResourceClass?: any) {
  const Cls = ResourceClass || Resource;
  const { request } = useClient();
  return Cls.make(options, request);;
}

export function useClient() {
  const client = useContext(ClientContext);
  const request = client.options.request;

  return {
    client,
    request,
    async createSchema(schema: ISchema) {
      if (!schema) {
        return;
      }
      if (!schema['key']) {
        return;
      }
      return await request('ui_schemas:create', {
        method: 'post',
        data: schema.toJSON(),
      });
    },

    async collectionMoveToAfter(source, target) {
      if (source && target) {
        return request(`collections:sort/${source}`, {
          method: 'post',
          data: {
            field: 'sort',
            target: {
              name: target,
            },
          },
        });
      }
    },

    async updateSchema(schema: ISchema) {
      if (!schema) {
        return;
      }
      if (!schema['key']) {
        return;
      }
      return await request(`ui_schemas:update/${schema.key}`, {
        method: 'post',
        data: Schema.isSchemaInstance(schema) ? schema.toJSON() : schema,
      });
    },

    async removeSchema(schema: ISchema) {
      if (!schema['key']) {
        return;
      }
      await request('ui_schemas:destroy', {
        method: 'post',
        params: {
          filter: {
            key: schema['key'],
          },
        },
      });
    },
  };
}
