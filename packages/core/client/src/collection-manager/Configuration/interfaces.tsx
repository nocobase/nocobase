import { ISchema } from '@formily/react';
import set from 'lodash/set';
import * as types from '../interfaces';

export const interfaces = new Map<string, ISchema>();

const fields = {};
const groups: Record<
  string,
  {
    label: string;
    order: number;
  }
> = {};

export function registerField(group: string, type: string, schema) {
  fields[group] = fields[group] || {};
  set(fields, [group, type], schema);
  interfaces.set(type, schema);
}

export function registerGroup(key: string, label: string | { label: string; order?: number }) {
  const group = typeof label === 'string' ? { label } : label;
  if (!group.order) {
    group.order = (Object.keys(groups).length + 1) * 10;
  }
  groups[key] = group as Required<typeof group>;
}

/**
 * @deprecated
 */
export const registerGroupLabel = registerGroup;

Object.keys(types).forEach((type) => {
  const schema = types[type];
  registerField(schema.group || 'others', type, { order: 0, ...schema });
});

registerGroup('basic', '{{t("Basic")}}');
registerGroup('choices', '{{t("Choices")}}');
registerGroup('media', '{{t("Media")}}');
registerGroup('datetime', '{{t("Date & Time")}}');
registerGroup('relation', '{{t("Relation")}}');
registerGroup('advanced', '{{t("Advanced type")}}');
registerGroup('systemInfo', '{{t("System info")}}');
registerGroup('others', '{{t("Others")}}');

export const getOptions = () => {
  return Object.keys(groups)
    .map((groupName) => {
      const group = groups[groupName];
      return {
        ...group,
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
    })
    .sort((a, b) => a.order - b.order);
};

export const options = getOptions();
