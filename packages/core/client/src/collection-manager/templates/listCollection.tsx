import { defaultProps, defaultCollectionOptions } from './properties';
import { ICollectionTemplate } from './types';

export const listCollection: ICollectionTemplate = {
  name: 'listCollection',
  title: '{{t("General collection")}}',
  order: 1,
  color: 'blue',
  default: {
    fields:[]
  },
  configurableProperties: {
    ...defaultProps,
    ...defaultCollectionOptions,
  },

};
