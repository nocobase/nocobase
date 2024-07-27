/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  Application,
  CollectionFieldInterface,
  CollectionFieldInterfaceFactory,
  useDataSourceManager,
  usePlugin,
} from '@nocobase/client';
import PluginFieldJSONDocumentClient from '.';
import { useMemo } from 'react';
import { useJSONDocTranslation } from './locale';
import { Schema } from '@formily/json-schema';

export class FieldInterfaceManager {
  constructor(protected app: Application) {}

  fieldInterfaces = new Map<string, CollectionFieldInterface>();

  addFieldInterfaces(...fieldInterfaces: CollectionFieldInterfaceFactory[]) {
    fieldInterfaces.forEach((Interface) => {
      const instance = new Interface(this.app.dataSourceManager.collectionFieldInterfaceManager);
      if (instance.properties) {
        // Delete useless settings
        if (instance.properties.layout) {
          instance.properties.layout = null;
        }
        if (instance.properties.unique) {
          instance.properties.unique = null;
        }
        if (instance.properties.autoIncrement) {
          instance.properties.autoIncrement = null;
        }
      }
      this.fieldInterfaces.set(instance.name, instance);
    });
  }

  getFieldInterfaces() {
    const groups = Array.from(this.fieldInterfaces.values()).reduce(
      (groups, fieldInterface) => {
        if (!groups[fieldInterface.group]) {
          groups[fieldInterface.group] = [];
        }
        groups[fieldInterface.group].push(fieldInterface);
        return groups;
      },
      {} as Record<string, CollectionFieldInterface[]>,
    );
    return groups;
  }
}

export const useFieldInterfaceOptions = () => {
  const { t } = useJSONDocTranslation();
  const dm = useDataSourceManager();
  const plugin = usePlugin(PluginFieldJSONDocumentClient);
  const fieldInterfaceGroups = plugin.fieldInterfaceManager.getFieldInterfaces();
  const fieldGroups = dm.collectionFieldInterfaceManager.getFieldInterfaceGroups();
  return useMemo(() => {
    return Object.entries(fieldGroups)
      .map(([group, options]) => {
        const interfaces = fieldInterfaceGroups[group];
        return {
          ...options,
          children: interfaces
            ?.map((fieldInterface) => ({
              value: fieldInterface.name,
              label: Schema.compile(fieldInterface.title, { t }),
              ...fieldInterface,
            }))
            .sort((a, b) => a.order - b.order),
        };
      })
      .filter((group) => group.children && group.children.length > 0);
  }, [fieldInterfaceGroups, fieldGroups]);
};

export const useFieldInterfaceManager = () => {
  const plugin = usePlugin(PluginFieldJSONDocumentClient);

  return {
    getInterface: (name: string) => {
      return plugin.fieldInterfaceManager.fieldInterfaces.get(name);
    },
  };
};
