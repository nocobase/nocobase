/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createAssociationAwareObjectMetaFactory, createAssociationSubpathResolver } from '@nocobase/flow-engine';

export type ItemChain = {
  index?: number;
  length?: number;
  __is_new__?: boolean;
  __is_stored__?: boolean;
  value: any;
  parentItem?: ItemChain;
};

export type ItemChainResolver = (subPath: string) => boolean;

export type ParentItemAccessors = {
  parentPropertiesAccessor: (ctx?: any) => any;
  parentItemMetaAccessor: () => any;
  parentItemResolverAccessor: () => ItemChainResolver | undefined;
};

export function createItemChainGetter(options: {
  valueAccessor: () => any;
  parentItemAccessor?: () => ItemChain | undefined;
  indexAccessor?: () => number | undefined;
  lengthAccessor?: () => number | undefined;
  isNewAccessor?: () => boolean | undefined;
  isStoredAccessor?: () => boolean | undefined;
}): () => ItemChain {
  return () => {
    const value = options.valueAccessor();
    return {
      index: options.indexAccessor?.(),
      length: options.lengthAccessor?.(),
      __is_new__: options.isNewAccessor?.() ?? value?.__is_new__,
      __is_stored__: options.isStoredAccessor?.() ?? value?.__is_stored__,
      value,
      parentItem: options.parentItemAccessor?.(),
    };
  };
}

export function createRootItemChain(formValues: any): ItemChain {
  return {
    index: undefined,
    __is_new__: formValues?.__is_new__,
    __is_stored__: formValues?.__is_stored__,
    value: formValues,
    parentItem: undefined,
  };
}

export function resolveRecordPersistenceState(
  record: any,
  filterTargetKey: string | string[] | null | undefined,
): {
  record: any;
  hasPrimaryKey: boolean;
  isNew: boolean;
  isStored: boolean;
} {
  const hasPrimaryKey = Array.isArray(filterTargetKey)
    ? filterTargetKey.length > 0 && filterTargetKey.every((key) => record?.[key] != null)
    : filterTargetKey
      ? record?.[filterTargetKey] != null
      : false;
  const isNew = !!record?.__is_new__ || !hasPrimaryKey;
  const isStored = !!record?.__is_stored__ || (!isNew && hasPrimaryKey);
  return {
    record,
    hasPrimaryKey,
    isNew,
    isStored,
  };
}

export function buildCurrentItemTitle(t: (key: string) => string, collectionField?: any, fallbackName?: string) {
  const rawLabel =
    (typeof collectionField?.title === 'string' && collectionField.title) ||
    (typeof collectionField?.name === 'string' && collectionField.name) ||
    fallbackName;
  const label = typeof rawLabel === 'string' && rawLabel ? t(rawLabel) : '';
  return label ? `${t('Current item')}（${label}）` : t('Current item');
}

export function createParentItemAccessorsFromContext(options: {
  parentContextAccessor: () => any;
  fallbackParentPropertiesAccessor?: (ctx?: any) => any;
}): ParentItemAccessors {
  return {
    parentPropertiesAccessor: (ctx?: any) => {
      return options.parentContextAccessor?.()?.item?.value ?? options.fallbackParentPropertiesAccessor?.(ctx);
    },
    parentItemMetaAccessor: () => options.parentContextAccessor?.()?.getPropertyOptions?.('item')?.meta,
    parentItemResolverAccessor: () =>
      options.parentContextAccessor?.()?.getPropertyOptions?.('item')?.resolveOnServer as ItemChainResolver | undefined,
  };
}

export function createParentItemAccessorsFromInputArgs(inputArgsAccessor: () => any): ParentItemAccessors {
  return {
    parentPropertiesAccessor: () => (inputArgsAccessor?.()?.parentItem as ItemChain | undefined)?.value,
    parentItemMetaAccessor: () => inputArgsAccessor?.()?.parentItemMeta,
    parentItemResolverAccessor: () => inputArgsAccessor?.()?.parentItemResolver as ItemChainResolver | undefined,
  };
}

function createScopedItemContext(ctx: any, item: any) {
  if (!ctx || typeof ctx !== 'object') {
    return { item };
  }
  const scoped = Object.create(ctx);
  Object.defineProperty(scoped, 'item', {
    value: item,
    configurable: true,
    enumerable: true,
    writable: false,
  });
  return scoped;
}

async function resolveMetaFactory(metaOrFactory: any) {
  if (!metaOrFactory) return null;
  if (typeof metaOrFactory === 'function') {
    return (await metaOrFactory()) || null;
  }
  return metaOrFactory;
}

export function createItemChainMetaFactory(options: {
  t: (key: string) => string;
  title: string;
  showIndex?: boolean;
  showParentIndex?: boolean;
  collectionAccessor: () => any;
  propertiesAccessor: (ctx: any) => any;
  parentCollectionAccessor?: () => any;
  parentPropertiesAccessor?: (ctx: any) => any;
  parentItemMetaAccessor?: () => any;
}) {
  const {
    t,
    title,
    showIndex,
    showParentIndex,
    collectionAccessor,
    propertiesAccessor,
    parentCollectionAccessor,
    parentPropertiesAccessor,
    parentItemMetaAccessor,
  } = options;
  const propertiesMetaFactory = createAssociationAwareObjectMetaFactory(collectionAccessor, title, propertiesAccessor);
  const fallbackParentPropertiesMetaFactory = parentCollectionAccessor
    ? createAssociationAwareObjectMetaFactory(
        parentCollectionAccessor,
        title,
        (ctx) => parentPropertiesAccessor?.(ctx) ?? ctx?.item?.parentItem?.value,
      )
    : null;

  const factory: any = async () => {
    const propertiesMeta = await propertiesMetaFactory();
    if (!propertiesMeta) return null;

    const parentItemMeta = await resolveMetaFactory(parentItemMetaAccessor?.());
    const fallbackParentPropertiesMeta = fallbackParentPropertiesMetaFactory
      ? await fallbackParentPropertiesMetaFactory()
      : null;

    const buildVars = (propertiesMeta as any).buildVariablesParams;
    const parentBuildVars = parentItemMeta
      ? (parentItemMeta as any).buildVariablesParams
      : (fallbackParentPropertiesMeta as any)?.buildVariablesParams;

    const createIndexMeta = () => ({ type: 'number', title: t('Index (starts from 0)') });
    const createLengthMeta = () => ({ type: 'number', title: t('Total count') });

    const properties: Record<string, any> = {};
    if (showIndex !== false) {
      properties.index = createIndexMeta();
      properties.length = createLengthMeta();
    }
    properties.value = { ...(propertiesMeta as any), title: t('Attributes') };

    if (parentItemMeta) {
      properties.parentItem = {
        ...(parentItemMeta as any),
        title: parentItemMeta.title?.replace(t('Current item'), t('Parent item')) || t('Parent item'),
      };
    } else {
      const parentProperties: Record<string, any> = {};
      if (showParentIndex !== false) {
        parentProperties.index = createIndexMeta();
        parentProperties.length = createLengthMeta();
      }
      parentProperties.value = fallbackParentPropertiesMeta
        ? { ...(fallbackParentPropertiesMeta as any), title: t('Attributes') }
        : { type: 'object', title: t('Attributes') };
      properties.parentItem = {
        type: 'object',
        title: parentItemMeta?.title?.replace(t('Current item'), t('Parent item')) || t('Parent item'),
        properties: parentProperties,
      };
    }

    const meta: any = {
      type: 'object',
      title,
      properties,
      buildVariablesParams: async (ctx: any) => {
        const out: Record<string, any> = {};

        if (typeof buildVars === 'function') {
          const built = await buildVars(ctx);
          if (built && typeof built === 'object' && Object.keys(built).length) {
            out.value = built;
          }
        }

        if (typeof parentBuildVars === 'function') {
          const built = await parentBuildVars(createScopedItemContext(ctx, ctx?.item?.parentItem));
          if (built && typeof built === 'object' && Object.keys(built).length) {
            out.parentItem = parentItemMeta ? built : { value: built };
          }
        }

        return out;
      },
    };

    return meta;
  };

  factory.title = title;
  return factory;
}

export function createItemChainResolver(options: {
  collectionAccessor: () => any;
  propertiesAccessor?: () => unknown;
  parentCollectionAccessor?: () => any;
  parentPropertiesAccessor?: () => unknown;
  parentItemResolverAccessor?: () => ((subPath: string) => boolean) | undefined;
}): (subPath: string) => boolean {
  const base = createAssociationSubpathResolver(options.collectionAccessor, options.propertiesAccessor);
  const baseParent =
    typeof options.parentCollectionAccessor === 'function'
      ? createAssociationSubpathResolver(options.parentCollectionAccessor, options.parentPropertiesAccessor)
      : null;
  return (p: string) => {
    const raw = String(p || '');
    if (!raw) return false;
    if (raw === 'value') return false;
    if (raw.startsWith('value.')) {
      return base(raw.slice('value.'.length));
    }
    if (raw === 'parentItem') return false;
    if (raw.startsWith('parentItem.')) {
      const parentPath = raw.slice('parentItem.'.length);
      const parentResolver = options.parentItemResolverAccessor?.();
      if (typeof parentResolver === 'function') {
        return parentResolver(parentPath);
      }
      if (parentPath === 'value') return false;
      if (parentPath.startsWith('value.')) {
        return baseParent ? baseParent(parentPath.slice('value.'.length)) : false;
      }
      return false;
    }
    return false;
  };
}

export type ItemChainMetaAndResolverOptions = {
  metaFactoryOptions: Parameters<typeof createItemChainMetaFactory>[0];
  resolverOptions: Parameters<typeof createItemChainResolver>[0];
};

export function createItemChainMetaAndResolver(options: ItemChainMetaAndResolverOptions) {
  return {
    meta: createItemChainMetaFactory(options.metaFactoryOptions),
    resolveOnServer: createItemChainResolver(options.resolverOptions),
  };
}

export type AssociationItemChainContextPropertyOptions = {
  t: (key: string) => string;
  title: string;
  showIndex?: boolean;
  showParentIndex?: boolean;
  collectionAccessor: () => any;
  propertiesAccessor: (ctx: any) => any;
  resolverPropertiesAccessor?: () => unknown;
  parentCollectionAccessor?: () => any;
  parentAccessors?: Partial<ParentItemAccessors>;
  useParentItemMeta?: boolean;
  useParentItemResolver?: boolean;
};

export function createAssociationItemChainContextPropertyOptions(options: AssociationItemChainContextPropertyOptions) {
  const parentPropertiesAccessor = options.parentAccessors?.parentPropertiesAccessor;
  const parentItemMetaAccessor =
    options.useParentItemMeta === false ? undefined : options.parentAccessors?.parentItemMetaAccessor;
  const parentItemResolverAccessor =
    options.useParentItemResolver === false ? undefined : options.parentAccessors?.parentItemResolverAccessor;

  return createItemChainContextPropertyOptions({
    metaFactoryOptions: {
      t: options.t,
      title: options.title,
      showIndex: options.showIndex,
      showParentIndex: options.showParentIndex,
      collectionAccessor: options.collectionAccessor,
      propertiesAccessor: options.propertiesAccessor,
      parentCollectionAccessor: options.parentCollectionAccessor,
      parentPropertiesAccessor,
      parentItemMetaAccessor,
    },
    resolverOptions: {
      collectionAccessor: options.collectionAccessor,
      propertiesAccessor: options.resolverPropertiesAccessor,
      parentCollectionAccessor: options.parentCollectionAccessor,
      parentPropertiesAccessor,
      parentItemResolverAccessor,
    },
  });
}

export function createItemChainContextPropertyOptions(options: ItemChainMetaAndResolverOptions) {
  return {
    cache: false as const,
    ...createItemChainMetaAndResolver(options),
    serverOnlyWhenContextParams: true as const,
  };
}
