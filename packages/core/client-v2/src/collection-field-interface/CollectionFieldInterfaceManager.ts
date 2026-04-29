/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

interface FieldInterfaceLike {
  name?: string;
  supportDataSourceType?: string[];
  notSupportDataSourceType?: string[];
  addComponentOption?: (option: any) => void;
  addOperator?: (option: any) => void;
}

interface PendingAction {
  type: 'addComponentOption' | 'addOperator';
  data: any;
}

/**
 * 提供 client-v2 运行时所需的字段接口注册能力。
 *
 * 该管理器只保留运行时消费所需的最小行为：
 * 注册字段接口、分组、组件选项和操作符，并支持后注册的接口回放待处理动作。
 *
 * @example
 * ```typescript
 * const manager = new CollectionFieldInterfaceManager(dataSourceManager);
 * manager.addFieldInterfaces([InputFieldInterface]);
 * ```
 */
export class CollectionFieldInterfaceManager {
  protected collectionFieldInterfaceInstances: Record<string, FieldInterfaceLike> = {};
  protected collectionFieldGroups: Record<string, { label: string; order?: number }> = {};
  protected actionList: Record<string, PendingAction[]> = {};

  constructor(public dataSourceManager: any) {}

  /**
   * 注册字段接口类。
   *
   * @param fieldInterfaceClasses 字段接口类列表
   * @returns void
   */
  addFieldInterfaces(
    fieldInterfaceClasses: Array<new (manager: CollectionFieldInterfaceManager) => FieldInterfaceLike> = [],
  ) {
    const newCollectionFieldInterfaces = fieldInterfaceClasses.reduce<Record<string, FieldInterfaceLike>>(
      (acc, Interface) => {
        const instance = new Interface(this);
        if (!instance?.name) {
          return acc;
        }
        acc[instance.name] = instance;
        if (Array.isArray(this.actionList[instance.name])) {
          this.actionList[instance.name].forEach((item) => {
            if (item.type === 'addComponentOption') {
              instance.addComponentOption?.(item.data);
              return;
            }
            instance.addOperator?.(item.data);
          });
          this.actionList[instance.name] = undefined;
        }
        return acc;
      },
      {},
    );

    Object.assign(this.collectionFieldInterfaceInstances, newCollectionFieldInterfaces);
  }

  /**
   * 为字段接口补充组件选项。
   *
   * @param interfaceName 字段接口名
   * @param componentOption 组件选项
   * @returns void
   */
  addFieldInterfaceComponentOption(interfaceName: string, componentOption: any) {
    const fieldInterface = this.getFieldInterface(interfaceName);
    if (!fieldInterface) {
      this.enqueueAction(interfaceName, { type: 'addComponentOption', data: componentOption });
      return;
    }
    fieldInterface.addComponentOption?.(componentOption);
  }

  /**
   * 为字段接口补充操作符。
   *
   * @param name 字段接口名
   * @param operatorOption 操作符配置
   * @returns void
   */
  addFieldInterfaceOperator(name: string, operatorOption: any) {
    const fieldInterface = this.getFieldInterface(name);
    if (!fieldInterface) {
      this.enqueueAction(name, { type: 'addOperator', data: operatorOption });
      return;
    }
    fieldInterface.addOperator?.(operatorOption);
  }

  /**
   * 获取单个字段接口实例。
   *
   * @param name 字段接口名
   * @returns 字段接口实例
   */
  getFieldInterface<T = FieldInterfaceLike>(name: string) {
    return this.collectionFieldInterfaceInstances[name] as T;
  }

  /**
   * 获取全部字段接口实例。
   *
   * @param dataSourceType 可选的数据源类型过滤
   * @returns 字段接口实例列表
   */
  getFieldInterfaces<T = FieldInterfaceLike>(dataSourceType?: string) {
    return Object.values(this.collectionFieldInterfaceInstances).filter((item) => {
      if (!dataSourceType) {
        return true;
      }
      if (!item.supportDataSourceType && !item.notSupportDataSourceType) {
        return true;
      }
      if (item.supportDataSourceType) {
        return item.supportDataSourceType.includes(dataSourceType);
      }
      if (item.notSupportDataSourceType) {
        return !item.notSupportDataSourceType.includes(dataSourceType);
      }
      return true;
    }) as T[];
  }

  /**
   * 注册字段接口分组。
   *
   * @param groups 分组配置
   * @returns void
   */
  addFieldInterfaceGroups(groups: Record<string, { label: string; order?: number }> = {}) {
    Object.assign(this.collectionFieldGroups, groups);
  }

  /**
   * 获取全部字段接口分组。
   *
   * @returns 字段接口分组映射
   */
  getFieldInterfaceGroups() {
    return this.collectionFieldGroups;
  }

  /**
   * 获取单个字段接口分组。
   *
   * @param name 分组名
   * @returns 分组配置
   */
  getFieldInterfaceGroup(name: string) {
    return this.collectionFieldGroups[name];
  }

  protected enqueueAction(interfaceName: string, action: PendingAction) {
    if (!this.actionList[interfaceName]) {
      this.actionList[interfaceName] = [];
    }
    this.actionList[interfaceName].push(action);
  }
}
