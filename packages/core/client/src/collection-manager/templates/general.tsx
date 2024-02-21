import { CollectionTemplate } from '../../data-source/collection-template/CollectionTemplate';
import { getConfigurableProperties } from './properties';

export class GeneralCollectionTemplate extends CollectionTemplate {
  name = 'general';
  title = '{{t("General collection")}}';
  order = 1;
  color = 'blue';
  default = {
    fields: [],
  };
  configurableProperties = getConfigurableProperties(
    'title',
    'name',
    'inherits',
    'category',
    'description',
    'presetFields',
  );
}
