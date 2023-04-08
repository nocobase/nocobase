import { getConfigurableProperties } from './properties';
import { ICollectionTemplate } from './types';

export const general: ICollectionTemplate = {
  name: 'general',
  title: '{{t("General collection")}}',
  order: 1,
  color: 'blue',
  default: {
    fields: [],
  },
  description: '{{t("General collection")}}',
  configurableProperties: getConfigurableProperties('title', 'name', 'inherits', 'category', 'moreOptions'),
};
