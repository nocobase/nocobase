import type { Application } from '../../application/Application';
import type { CollectionOptions } from './Collection';

export const collectionTransform = (collection: CollectionOptions, app: Application) => {
  const { rawTitle, title, fields = [], ...rest } = collection;
  return {
    ...rest,
    title: rawTitle ? title : app.i18n.t(title),
    rawTitle: rawTitle || title,
    fields: fields?.map(({ uiSchema, ...field }) => {
      if (uiSchema?.title) {
        const title = uiSchema.title;
        uiSchema.title = uiSchema.rawTitle ? title : app.i18n.t(title, { ns: 'lm-collections' });
        uiSchema.rawTitle = uiSchema.rawTitle || title;
      }
      if (Array.isArray(uiSchema?.enum)) {
        uiSchema.enum = uiSchema.enum.map((item) => ({
          ...item,
          value: item?.value === undefined ? item : item.value,
          label: item.rawLabel ? item.label : app.i18n.t(item.label, { ns: 'lm-collections' }),
          rawLabel: item.rawLabel || item.label,
        }));
      }
      return { uiSchema, ...field };
    }),
  };
};

export function applyMixins(instance: any, mixins: any[]) {
  mixins.forEach((MixinClass) => {
    const mixin = new MixinClass();
    Object.getOwnPropertyNames(mixin).forEach((key) => {
      instance.__proto__[key] = mixin[key];
    });

    Object.getOwnPropertyNames(mixin.__proto__).forEach((key) => {
      if (key !== 'constructor') {
        instance.__proto__[key] = mixin.__proto__[key];
      }
    });
  });
}
