import { getConfigurableProperties } from './properties';
import { ICollectionTemplate } from './types';

export const view: ICollectionTemplate = {
  name: 'view',
  title: '{{t("View collection")}}',
  order: 4,
  color: 'yellow',
  default: {
    fields: [],
  },
  configurableProperties: getConfigurableProperties('title', 'name', 'inherits', 'category','dbView'),
};
