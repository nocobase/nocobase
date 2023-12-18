import { CollectionTemplate } from '../CollectionTemplate';
import { getConfigurableProperties } from '../../../collection-manager/templates/properties';

export const general = new CollectionTemplate({
  name: 'general',
  title: '{{t("General collection")}}',
  order: 1,
  color: 'blue',
  default: {
    fields: [],
  },
  configurableProperties: getConfigurableProperties(
    'title',
    'name',
    'inherits',
    'category',
    'description',
    'moreOptions',
  ),
});
