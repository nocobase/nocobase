import { ISchema } from '@formily/react';
import set from 'lodash/set';
import * as types from '../templates';

export const templates = new Map<string, ISchema>();

const fields = {};
const collectionTemplates :any= {};

export function registerField(group: string, type: string, schema) {
  fields[group] = fields[group] || {};
  set(fields, [group, type], schema);
  templates.set(type, schema);
}

export function registerTemplace(key: string, label: string) {
  collectionTemplates[key] = label;
}

Object.keys(types).forEach((type) => {
  const schema = types[type];
  registerTemplace(schema.name || 'others', { order: 0, ...schema });
});
export const options = Object.keys(collectionTemplates).sort((a, b) =>{
  return collectionTemplates[a].order - collectionTemplates[b].order}).map((templace) => {
  return {
    label: collectionTemplates[templace].title,
    schema: collectionTemplates[templace],
    key:collectionTemplates[templace].name
  };
})
