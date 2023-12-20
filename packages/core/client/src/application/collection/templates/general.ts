import { getConfigurableProperties } from '../../../collection-manager/templates/properties';
import { CollectionV2 } from '../Collection';
import { CollectionTemplateV2 } from '../CollectionTemplate';

export const generalTemplate = new CollectionTemplateV2({
  name: 'general',
  Collection: CollectionV2,
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
