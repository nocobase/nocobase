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
  __is_new__?: boolean;
  __is_stored__?: boolean;
  value: any;
  parentItem?: ItemChain;
};

export function createRootItemChain(formValues: any): ItemChain {
  return {
    index: undefined,
    __is_new__: formValues?.__is_new__,
    __is_stored__: formValues?.__is_stored__,
    value: formValues,
    parentItem: undefined,
  };
}

export function createItemChainMetaFactory(options: {
  t: (key: string) => string;
  title: string;
  showIndex?: boolean;
  showParentIndex?: boolean;
  collectionAccessor: () => any;
  valueAccessor: (ctx: any) => any;
  parentCollectionAccessor?: () => any;
}) {
  const { t, title, showIndex, showParentIndex, collectionAccessor, valueAccessor, parentCollectionAccessor } = options;
  const valueMetaFactory = createAssociationAwareObjectMetaFactory(collectionAccessor, title, valueAccessor);
  const parentValueMetaFactory = parentCollectionAccessor
    ? createAssociationAwareObjectMetaFactory(parentCollectionAccessor, title, (ctx) => ctx?.item?.parentItem?.value)
    : null;

  const factory: any = async () => {
    const valueMeta = await valueMetaFactory();
    if (!valueMeta) return null;

    const parentValueMeta = parentValueMetaFactory ? await parentValueMetaFactory() : null;
    const buildVars = (valueMeta as any).buildVariablesParams;
    const parentBuildVars = parentValueMeta ? (parentValueMeta as any).buildVariablesParams : null;

    const createIndexMeta = () => ({ type: 'number', title: t('Index (starts from 0)') });

    const properties: Record<string, any> = {};
    if (showIndex !== false) {
      properties.index = createIndexMeta();
    }
    properties.value = { ...(valueMeta as any), title: t('Properties') };

    const parentProperties: Record<string, any> = {};
    if (showParentIndex !== false) {
      parentProperties.index = createIndexMeta();
    }
    parentProperties.value = parentValueMeta
      ? { ...(parentValueMeta as any), title: t('Properties') }
      : { type: 'object', title: t('Properties') };
    properties.parentItem = {
      type: 'object',
      title: t('Parent object'),
      properties: parentProperties,
    };

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
          const built = await parentBuildVars(ctx);
          if (built && typeof built === 'object' && Object.keys(built).length) {
            out.parentItem = { value: built };
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
  valueAccessor?: () => unknown;
  parentCollectionAccessor?: () => any;
  parentValueAccessor?: () => unknown;
}): (subPath: string) => boolean {
  const base = createAssociationSubpathResolver(options.collectionAccessor, options.valueAccessor);
  const baseParent =
    typeof options.parentCollectionAccessor === 'function'
      ? createAssociationSubpathResolver(options.parentCollectionAccessor, options.parentValueAccessor)
      : null;
  return (p: string) => {
    const raw = String(p || '');
    if (!raw) return false;
    if (raw === 'value') return false;
    if (raw.startsWith('value.')) {
      return base(raw.slice('value.'.length));
    }
    if (raw.startsWith('parentItem.value.')) {
      return baseParent ? baseParent(raw.slice('parentItem.value.'.length)) : false;
    }
    return false;
  };
}
