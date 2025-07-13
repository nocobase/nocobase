/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldInterface, useDataSourceManager } from '@nocobase/client';
import { useMemo } from 'react';
import { Schema } from '@formily/react';
import { useT } from '../../../locale';

const getOptions = (
  fieldInterfaces: Record<string, CollectionFieldInterface[]>,
  fieldGroups: Record<string, { label: string; order?: number }>,
  t: any,
) => {
  return Object.keys(fieldGroups)
    .map((groupName) => {
      const group = fieldGroups[groupName];
      return {
        ...group,
        label: Schema.compile(group.label, { t }),
        key: groupName,
        options: Object.keys(fieldInterfaces[groupName] || {})
          .map((type) => {
            const field = fieldInterfaces[groupName][type];
            return {
              ...fieldInterfaces[groupName][type],
              key: `${groupName}-${field.name}`,
              value: field.name,
              label: Schema.compile(field.title, { t }),
            };
          })
          .sort((a, b) => a.order - b.order),
      };
    })
    .filter((group) => group.options.length > 0)
    .sort((a, b) => a.order - b.order);
};

export const useFieldInterfaceOptions = () => {
  const dm = useDataSourceManager();
  const t = useT();

  return useMemo(() => {
    const fieldInterfaceInstances = dm.collectionFieldInterfaceManager.getFieldInterfaces();
    const fieldGroups = dm.collectionFieldInterfaceManager.getFieldInterfaceGroups();
    const fieldInterfaceInstancesByGroups = fieldInterfaceInstances
      .filter((fieldInterface) =>
        [
          'id',
          'input',
          'integer',
          'checkbox',
          'checkboxGroup',
          'color',
          'createdAt',
          'updatedAt',
          'createdBy',
          'updatedBy',
          'date',
          'datetime',
          'datetimeNoTz',
          'email',
          'icon',
          'json',
          'markdown',
          'multipleSelect',
          'nanoid',
          'number',
          'password',
          'percent',
          'phone',
          'radioGroup',
          'richText',
          'select',
          'textarea',
          'time',
          'unixTimestamp',
          'url',
          'uuid',
        ].includes(fieldInterface.name),
      )
      .reduce<Record<string, CollectionFieldInterface[]>>((memo, fieldInterface) => {
        const group = fieldInterface.group || 'basic';
        if (!memo[group]) {
          memo[group] = [];
        }
        memo[group].push(fieldInterface);
        return memo;
      }, {});
    return getOptions(fieldInterfaceInstancesByGroups, fieldGroups, t);
  }, [dm]);
};
