import { defaultProps, defaultSystemFields, defaultCollectionOptions } from './properties';
import { IField } from './types';

export const listCollection: IField = {
  name: 'listCollection',
  type: 'object',
  title: '{{t("List collection")}}',
  order: 1,
  color: 'blue',
  presetFields: [...defaultSystemFields],
  properties: {
    ...defaultProps,
    ...defaultCollectionOptions,
  },
  //包含的interface类型
  include: [],
  // 排除的interface类型
  exclude: [],
};
