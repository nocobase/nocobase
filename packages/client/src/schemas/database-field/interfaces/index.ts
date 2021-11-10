import { cloneDeep, set } from 'lodash';
import * as types from './types';
import { uid } from '@formily/shared';
import { ISchema } from '../..';

interface IDefaultSchema {
  dataType: string;
  uiSchema?: ISchema;
  [key: string]: any;
}

export interface FieldOptions extends ISchema {
  [key: string]: any;
  default?: IDefaultSchema;
}

export const interfaces = new Map<string, ISchema>();

const fields = {};
const groupLabels = {};

export function getDefaultFields() {
  const defaults = ['createdAt', 'updatedAt', 'createdBy', 'updatedBy'];
  return defaults.map((key) => {
    return {
      interface: key,
      key: uid(),
      name: uid(),
      privilege: 'undelete',
      ...cloneDeep(interfaces.get(key)?.default),
    };
  });
}

export function registerField(group: string, type: string, schema) {
  fields[group] = fields[group] || {};
  set(fields, [group, type], schema);
  interfaces.set(type, schema);
}

export function registerGroupLabel(key: string, label: string) {
  groupLabels[key] = label;
}

Object.keys(types).forEach((type) => {
  const schema = types[type];
  registerField(schema.group || 'others', type, { order: 0, ...schema });
});

registerGroupLabel('basic', '{{t("Basic")}}');
registerGroupLabel('choices', '{{t("Choices")}}');
registerGroupLabel('media', '{{t("Media")}}');
registerGroupLabel('datetime', '{{t("Date & Time")}}');
registerGroupLabel('relation', '{{t("Relation")}}');
registerGroupLabel('systemInfo', '{{t("System info")}}');
registerGroupLabel('others', '{{t("Others")}}');

export const options = Object.keys(groupLabels).map((groupName) => {
  return {
    label: groupLabels[groupName],
    children: Object.keys(fields[groupName] || {})
      .map((type) => {
        return {
          name: type,
          ...fields[groupName][type],
        };
      })
      .sort((a, b) => a.order - b.order),
  };
});

export const isAssociation = (field) => {
  const options = interfaces.get(field.interface);
  return options?.isAssociation;
};
