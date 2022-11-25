import { ISchema } from '@formily/react';
import * as types from '../templates';

export const templates = new Map<string, ISchema>();

const collectionTemplates: any = {};

export function registerTemplace(key: string, schema: any) {
  collectionTemplates[key] = schema;
}

Object.keys(types).forEach((type) => {
  const schema = types[type];
  registerTemplace(schema.name || 'others', { order: 0, ...schema });
});
export const templateOptions = () =>
  Object.keys(collectionTemplates)
    .sort((a, b) => {
      return collectionTemplates[a].order - collectionTemplates[b].order;
    })
    .map((templace) => {
      return collectionTemplates[templace];
    });
