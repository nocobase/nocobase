import { getConfigurableProperties } from './properties';
import { CollectionTemplateV2 } from '../../application';

export const generalCollectionTemplate = new CollectionTemplateV2({
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
