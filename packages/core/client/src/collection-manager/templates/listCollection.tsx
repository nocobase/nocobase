import { defaultProps, defaultCollectionOptions } from './properties';
import { ICollectionTemplate } from './types';

export const listCollection: ICollectionTemplate = {
  name: 'listCollection',
  type: 'object',
  title: '{{t("List collection")}}',
  order: 1,
  color: 'blue',
  presetFields: [],
  properties: {
    ...defaultProps,
    ...defaultCollectionOptions,
  },
  //包含的interface类型
  include: [],
  // 排除的interface类型
  exclude: [],
};
