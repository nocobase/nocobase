/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemo } from 'react';
import type React from 'react';
import { useApp, type CollectionFieldInterface, type FieldInterfaceConfigure } from '@nocobase/client-v2';
import { useT } from '../../../locale';
import { compileLegacyTemplate } from './legacy-template';

type FieldInterfaceLike = (CollectionFieldInterface | FieldInterfaceConfigure) & {
  hidden?: boolean;
  order?: number;
  group?: string;
  name?: string;
  title?: React.ReactNode;
};

type FieldInterfaceGroup = {
  label: string;
  order?: number;
};

export type FieldInterfaceOption = FieldInterfaceLike & {
  key: string;
  value?: string;
  label: React.ReactNode;
};

export type FieldInterfaceOptionGroup = FieldInterfaceGroup & {
  key: string;
  options: FieldInterfaceOption[];
};

const getOptions = (
  fieldInterfaces: Record<string, FieldInterfaceLike[]>,
  fieldGroups: Record<string, FieldInterfaceGroup>,
  t: (key: string, options?: Record<string, unknown>) => string,
) => {
  return Object.keys(fieldGroups)
    .map((groupName) => {
      const group = fieldGroups[groupName];
      return {
        ...group,
        label: compileLegacyTemplate(group.label, t),
        key: groupName,
        options: (fieldInterfaces[groupName] || [])
          .filter((fieldInterface) => !fieldInterface.hidden)
          .map((fieldInterface) => ({
            ...fieldInterface,
            key: `${groupName}-${fieldInterface.name}`,
            value: fieldInterface.name,
            label: compileLegacyTemplate(fieldInterface.title || fieldInterface.name, t),
          }))
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      };
    })
    .filter((group) => group.options.length > 0)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

export const useFieldInterfaceOptions = () => {
  const app = useApp();
  const t = useT();

  return useMemo(() => {
    const manager = app.dataSourceManager.collectionFieldInterfaceManager;
    const fieldInterfaceInstances = (manager?.getFieldInterfaces?.() || []) as FieldInterfaceLike[];
    const fieldGroups = manager?.getFieldInterfaceGroups?.() || {};
    const fieldInterfaceInstancesByGroups = fieldInterfaceInstances.reduce<Record<string, FieldInterfaceLike[]>>(
      (memo, fieldInterface) => {
        const group = fieldInterface.group || 'basic';
        if (!memo[group]) {
          memo[group] = [];
        }
        memo[group].push(fieldInterface);
        return memo;
      },
      {},
    );
    return getOptions(fieldInterfaceInstancesByGroups, fieldGroups, t);
  }, [app.dataSourceManager.collectionFieldInterfaceManager, t]);
};
