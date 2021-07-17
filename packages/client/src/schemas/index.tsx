import { ISchema } from '@formily/react';
import { createContext } from 'react';

export * from '../components/schema-renderer';
export const VisibleContext = createContext(null);
export const DesignableBarContext = createContext(null);

export function useDefaultAction() {
  return {
    async run () {}
  }
}

import { extend } from 'umi-request';

export const request = extend({
  prefix: 'http://localhost:23003/api/',
  timeout: 1000,
});


export async function createSchema(schema: ISchema) {
  if (!schema['key']) {
    return;
  }
  return await request('ui_schemas:create', {
    method: 'post',
    data: schema.toJSON(),
  });
};

export async function removeSchema(schema: ISchema) {
  if (!schema['key']) {
    return;
  }
  await request('ui_schemas:destroy', {
    method: 'post',
    params: {
      filter: {
        key: schema['key'],
      }
    },
  });
}
