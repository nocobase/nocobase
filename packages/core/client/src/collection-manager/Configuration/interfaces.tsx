import { ISchema } from '@formily/react';
import set from 'lodash/set';
import * as types from '../interfaces';

export const interfaces = new Map<string, ISchema>();

const fields = {};
const groupLabels = {};

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
registerGroupLabel('advanced', '{{t("Advanced type")}}');
registerGroupLabel('systemInfo', '{{t("System info")}}');
registerGroupLabel('others', '{{t("Others")}}');

export const getOptions = () => {
  return Object.keys(groupLabels).map((groupName) => {
    return {
      label: groupLabels[groupName],
      key: groupName,
      children: Object.keys(fields[groupName] || {})
        .map((type) => {
          const field = fields[groupName][type];
          return {
            value: type,
            label: field.title,
            name: type,
            ...fields[groupName][type],
          };
        })
        .sort((a, b) => a.order - b.order),
    };
  });
};

export const options = getOptions();
