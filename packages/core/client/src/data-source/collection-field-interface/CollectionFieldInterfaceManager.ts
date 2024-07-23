/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { DataSourceManager } from '../data-source';
import type { CollectionFieldInterface, CollectionFieldInterfaceFactory } from './CollectionFieldInterface';

export class CollectionFieldInterfaceManager {
  protected collectionFieldInterfaceInstances: Record<string, CollectionFieldInterface> = {};
  protected collectionFieldGroups: Record<string, { label: string; order?: number }> = {};

  constructor(
    fieldInterfaceClasses: CollectionFieldInterfaceFactory[],
    fieldInterfaceGroups: Record<string, { label: string; order?: number }>,
    public dataSourceManager: DataSourceManager,
  ) {
    this.addFieldInterfaces(fieldInterfaceClasses);
    this.addFieldInterfaceGroups(fieldInterfaceGroups);
  }

  addFieldInterfaces(fieldInterfaceClasses: CollectionFieldInterfaceFactory[] = []) {
    const newCollectionFieldInterfaces = fieldInterfaceClasses.reduce((acc, Interface) => {
      const instance = new Interface(this);
      acc[instance.name] = instance;
      return acc;
    }, {});

    Object.assign(this.collectionFieldInterfaceInstances, newCollectionFieldInterfaces);
  }

  addFieldInterfaceComponentOption(interfaceName: string, componentOption: { label: string; value: string }) {
    const fieldInterface = this.getFieldInterface(interfaceName);
    // TODO：暂时没做到能忽略顺序
    if (!fieldInterface) return;
    if (!fieldInterface.componentOptions) {
      fieldInterface.componentOptions = [];
    }
    fieldInterface.componentOptions.push(componentOption);
  }

  getFieldInterface<T extends CollectionFieldInterface>(name: string) {
    return this.collectionFieldInterfaceInstances[name] as T;
  }
  getFieldInterfaces(dataSourceType?: string) {
    return Object.values(this.collectionFieldInterfaceInstances).filter((item) => {
      if (!dataSourceType) return true;
      if (!item.supportDataSourceType && !item.notSupportDataSourceType) return true;

      if (item.supportDataSourceType) {
        return item.supportDataSourceType?.includes(dataSourceType);
      }
      if (item.notSupportDataSourceType) {
        return !item.notSupportDataSourceType?.includes(dataSourceType);
      }
    });
  }

  addFieldInterfaceGroups(groups: Record<string, { label: string; order?: number }>) {
    Object.assign(this.collectionFieldGroups, groups);
  }
  getFieldInterfaceGroups() {
    return this.collectionFieldGroups;
  }
  getFieldInterfaceGroup(name: string) {
    return this.collectionFieldGroups[name];
  }
}
