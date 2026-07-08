/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CollectionTemplateOptions } from '../../plugin';

type FieldInterfaceIncludeItem = string | { interface?: string; name?: string };

type FieldInterfacePolicy = {
  include?: FieldInterfaceIncludeItem[];
  exclude?: string[];
  create?: {
    include?: FieldInterfaceIncludeItem[];
    exclude?: string[];
  };
};

type FieldInterfaceLike = {
  creatable?: boolean;
  group?: string;
  name: string;
};

function getFieldInterfacePolicy(template?: CollectionTemplateOptions): FieldInterfacePolicy | undefined {
  return template?.fieldInterfaces || template?.availableFieldInterfaces;
}

function getIncludedInterfaceName(item: FieldInterfaceIncludeItem) {
  return typeof item === 'string' ? item : item.interface || item.name;
}

function isIncludedFieldInterface(include: FieldInterfaceIncludeItem[] | undefined, fieldInterfaceName: string) {
  return include?.some((item) => getIncludedInterfaceName(item) === fieldInterfaceName);
}

export function filterFieldInterfacesByCollectionTemplate<T extends FieldInterfaceLike>(
  fieldInterfaces: T[],
  template: CollectionTemplateOptions | undefined,
  collection: Record<string, unknown>,
  options?: { databaseDialect?: string },
) {
  const { include, exclude = [] } = getFieldInterfacePolicy(template) || {};
  const hasIncludes = Array.isArray(include) && include.length > 0;

  return fieldInterfaces.filter((fieldInterface) => {
    if (fieldInterface.group === 'systemInfo') {
      if (fieldInterface.name === 'tableoid') {
        return hasIncludes
          ? isIncludedFieldInterface(include, fieldInterface.name)
          : options?.databaseDialect === 'postgres';
      }
      return typeof collection[fieldInterface.name] === 'boolean' ? collection[fieldInterface.name] : true;
    }

    if (hasIncludes) {
      return isIncludedFieldInterface(include, fieldInterface.name);
    }

    return !exclude.includes(fieldInterface.name);
  });
}

export function filterCreateFieldInterfacesByCollectionTemplate<T extends FieldInterfaceLike>(
  fieldInterfaces: T[],
  template: CollectionTemplateOptions | undefined,
) {
  const { create } = getFieldInterfacePolicy(template) || {};
  const include = create?.include;
  const exclude = create?.exclude || [];
  const hasIncludes = Array.isArray(include) && include.length > 0;

  return fieldInterfaces.filter((fieldInterface) => {
    if (fieldInterface.creatable === false) {
      return false;
    }
    if (hasIncludes) {
      return isIncludedFieldInterface(include, fieldInterface.name);
    }
    return !exclude.includes(fieldInterface.name);
  });
}
