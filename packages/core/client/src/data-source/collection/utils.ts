import type { Application } from '../../application/Application';
import type { CollectionOptions } from './Collection';

/**
 * @internal
 */
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

/**
 * @internal
 */
export function applyMixins(Cls: any, mixins: any[], options?: any, collectionManager?: any) {
  const instance = new Cls(options, collectionManager);
  mixins.forEach((MixinClass) => {
    const mixin = new MixinClass(options, collectionManager);
    // 设置实例属性，将 mixin 的属性复制到 instance 上
    Object.getOwnPropertyNames(mixin).forEach((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(mixin, key);
      if (descriptor) {
        Object.defineProperty(instance, key, descriptor);
      } else {
        instance[key] = mixin[key];
      }
    });

    // 将 mixin 的原型属方法复制到 instance 的原型上
    Object.getOwnPropertyNames(MixinClass.prototype).forEach((key) => {
      if (key !== 'constructor') {
        instance.__proto__[key] = MixinClass.prototype[key];
      }
    });
  });

  return instance;
}
