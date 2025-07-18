/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { DataSourceManager } from '../data-source';
import type {
  CollectionFieldInterface,
  CollectionFieldInterfaceComponentOption,
  CollectionFieldInterfaceFactory,
} from './CollectionFieldInterface';

interface ActionType {
  type: 'addComponentOption';
  data: any;
}

export class CollectionFieldInterfaceManager {
  protected collectionFieldInterfaceInstances: Record<string, CollectionFieldInterface> = {};
  protected collectionFieldGroups: Record<string, { label: string; order?: number }> = {};
  protected actionList: Record<string, ActionType[]> = {};

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
      if (Array.isArray(this.actionList[instance.name])) {
        this.actionList[instance.name].forEach((item) => {
          instance[item.type](item.data);
        });
        this.actionList[instance.name] = undefined;
      }
      return acc;
    }, {});

    Object.assign(this.collectionFieldInterfaceInstances, newCollectionFieldInterfaces);
  }

  addFieldInterfaceComponentOption(interfaceName: string, componentOption: CollectionFieldInterfaceComponentOption) {
    const fieldInterface = this.getFieldInterface(interfaceName);
    if (!fieldInterface) {
      if (!this.actionList[interfaceName]) {
        this.actionList[interfaceName] = [];
      }
      this.actionList[interfaceName].push({ type: 'addComponentOption', data: componentOption });
      return;
    }
    fieldInterface.addComponentOption(componentOption);
  }

  /**
   * 为指定的字段接口添加操作符选项
   *
   * @param name 字段接口的名称
   * @param operatorOption 要添加的操作符选项
   *
   * @example
   * // 为"单行文本"类型字段添加"等于任意一个"操作符
   * fieldInterfaceManager.addFieldInterfaceOperator('input', {
   *   label: '{{t("equals any of")}}',
   *   value: '$in',
   * });
   */
  addFieldInterfaceOperator(name: string, operatorOption: any) {
    const fieldInterface = this.getFieldInterface(name);
    fieldInterface?.addOperator(operatorOption);
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
