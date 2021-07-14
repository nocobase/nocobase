import { ISchema } from '@formily/react';
import { set } from 'lodash';

import { select } from './select';
import { string } from './string';
import { subTable } from './subTable';
import { textarea } from './textarea';

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

registerField('basic', 'string', string);
registerField('basic', 'textarea', textarea);
registerField('choices', 'select', select);
registerField('relation', 'subTable', subTable);

registerGroupLabel('basic', '基本类型');
registerGroupLabel('choices', '选择类型');
registerGroupLabel('relation', '关系类型');

export const options = Object.keys(fields).map((groupName) => {
  return {
    label: groupLabels[groupName],
    children: Object.keys(fields[groupName]).map((type) => {
      return fields[groupName][type];
    }),
  };
});
