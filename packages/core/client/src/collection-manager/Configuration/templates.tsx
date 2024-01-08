import { ISchema } from '@formily/react';
import * as types from '../templates';

export const templates = new Map<string, ISchema>();

export const collectionTemplates: any = {};

export function registerTemplate(key: string, schema: any) {
  collectionTemplates[key] = schema;
}

Object.keys(types).forEach((type) => {
  const schema = types[type];
  registerTemplate(schema.name || 'others', { order: 0, ...schema });
});
