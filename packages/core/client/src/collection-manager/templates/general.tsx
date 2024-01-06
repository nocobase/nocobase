import { CollectionV2 } from '../../application';
import { getConfigurableProperties } from './properties';
import { ICollectionTemplate } from './types';

export const general: ICollectionTemplate = {
  name: 'general',
  Collection: CollectionV2,
  transform: (collection, app) => {
    const { rawTitle, title, fields, ...rest } = collection;
    return {
      ...rest,
      title: rawTitle ? title : app.i18n.t(title),
      rawTitle: rawTitle || title,
      fields: fields.map(({ uiSchema, ...field }) => {
        if (uiSchema?.title) {
          const title = uiSchema.title;
          uiSchema.title = uiSchema.rawTitle ? title : app.i18n.t(title, { ns: 'lm-collections' });
          uiSchema.rawTitle = uiSchema.rawTitle || title;
        }
        if (uiSchema?.enum) {
          uiSchema.enum = uiSchema.enum.map((item) => ({
            ...item,
            value: item?.value || item,
            label: item.rawLabel ? item.label : app.i18n.t(item.label, { ns: 'lm-collections' }),
            rawLabel: item.rawLabel || item.label,
          }));
        }
        return { uiSchema, ...field };
      }),
    };
  },
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

// export class GeneralCollectionTemplate extends CollectionTemplateV2 {
//   name = 'general';
//   title = '{{t("General collection")}}';
//   order = 1;
//   color = 'blue';
//   default = {
//     fields: [],
//   };
//   configurableProperties = getConfigurableProperties(
//     'title',
//     'name',
//     'inherits',
//     'category',
//     'description',
//     'moreOptions',
//   );
// }
