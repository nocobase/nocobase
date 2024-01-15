import { CollectionV2 } from '../../application/collection/Collection';
import { CollectionTemplateBase } from '../../application/collection/CollectionTemplate';
import { getConfigurableProperties } from './properties';
import { ICollectionTemplate } from './types';

export const general: ICollectionTemplate = {
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
};

export class GeneralCollectionTemplate extends CollectionTemplateBase {
  name = 'general';
  Collection = CollectionV2;
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
    'moreOptions',
  );
}
