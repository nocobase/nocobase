import { CollectionTemplateV2, CollectionV2 } from '../../application';
import { getConfigurableProperties } from './properties';
// import { ICollectionTemplate } from './types';

// export const general: ICollectionTemplate = {
//   name: 'general',
//   Collection: CollectionV2,
//   title: '{{t("General collection")}}',
//   order: 1,
//   color: 'blue',
//   default: {
//     fields: [],
//   },
//   configurableProperties: getConfigurableProperties(
//     'title',
//     'name',
//     'inherits',
//     'category',
//     'description',
//     'moreOptions',
//   ),
// };

export class GeneralCollectionTemplate extends CollectionTemplateV2 {
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
