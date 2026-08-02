/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  filterOperatorRegistry,
  normalizeFilterableOperators,
  type FieldFilterable,
  type FieldFilterOperator,
  type FieldFilterOperatorReference,
} from '../collection-manager/filter-operators';
import { configurePropertiesToItems } from '../collection-manager/field-configure';
import {
  addFieldValidationConfiguresToGroup,
  fieldValidationConfigureRegistry,
  registerFieldValidationConfigure,
  registerFieldValidationConfigureGroup,
  type FieldValidationConfigureInput,
  type FieldValidationConfigureItem,
} from '../collection-manager/field-validation';
import type { FieldInterfaceConfigure } from './CollectionFieldInterface';
import type { ReactNode } from 'react';

interface FieldInterfaceLike {
  name?: string;
  title?: ReactNode;
  group?: string;
  order?: number;
  creatable?: boolean;
  isAssociation?: boolean;
  supportDataSourceType?: string[];
  notSupportDataSourceType?: string[];
  properties?: Record<string, any>;
  configure?: FieldInterfaceConfigure;
  filterable?: FieldFilterable;
  addComponentOption?: (option: any) => void;
  addOperator?: (option: FieldFilterOperator) => void;
  getConfigureFormProperties?: (collectionInfo?: any) => Record<string, any>;
}

interface PendingAction {
  type: 'addComponentOption' | 'addOperator' | 'registerConfigure';
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
        if (typeof Interface !== 'function') {
          return acc;
        }
        const instance = new Interface(this);
        if (!instance?.name) {
          return acc;
        }
        normalizeFilterableOperators(instance.filterable);
        acc[instance.name] = instance;
        if (Array.isArray(this.actionList[instance.name])) {
          this.actionList[instance.name].forEach((item) => {
            if (item.type === 'addComponentOption') {
              instance.addComponentOption?.(item.data);
              return;
            }
            if (item.type === 'registerConfigure') {
              instance.configure = this.mergeFieldInterfaceConfigure(instance.configure, item.data);
              return;
            }
            instance.addOperator?.(item.data);
          });
          delete this.actionList[instance.name];
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
  addFieldInterfaceOperator(name: string, operatorOption: FieldFilterOperator) {
    const fieldInterface = this.getFieldInterface(name);
    if (!fieldInterface) {
      this.enqueueAction(name, { type: 'addOperator', data: operatorOption });
      return;
    }
    fieldInterface.addOperator?.(operatorOption);
  }

  /**
   * 注册 v2 字段过滤操作符。
   *
   * 插件可通过该方法补充自己的过滤操作符，再把它们加入自定义 operator group。
   *
   * @param operator 过滤操作符配置
   * @returns void
   */
  registerFieldFilterOperator(operator: FieldFilterOperator) {
    filterOperatorRegistry.register(operator);
  }

  /**
   * 注册 v2 字段过滤操作符分组。
   *
   * 字段 interface 可以通过 `createFilterable(groupName)` 引用这里注册的分组。
   *
   * @param name 分组名
   * @param operators 操作符配置或已注册操作符名
   * @returns void
   */
  registerFieldFilterOperatorGroup(name: string, operators: FieldFilterOperatorReference[] = []) {
    filterOperatorRegistry.registerGroup(name, operators);
    this.normalizeFieldInterfaceFilterables();
  }

  /**
   * 向已有 v2 字段过滤操作符分组追加操作符。
   *
   * @param name 分组名
   * @param operators 操作符配置或已注册操作符名
   * @returns void
   */
  addFieldFilterOperatorsToGroup(name: string, operators: FieldFilterOperatorReference[] = []) {
    filterOperatorRegistry.addToGroup(name, operators);
    this.normalizeFieldInterfaceFilterables();
  }

  registerFieldValidationConfigure(item: FieldValidationConfigureItem) {
    registerFieldValidationConfigure(item);
  }

  registerFieldValidationConfigureGroup(name: string, items: FieldValidationConfigureInput[] = []) {
    registerFieldValidationConfigureGroup(name, items);
  }

  addFieldValidationConfiguresToGroup(name: string, items: FieldValidationConfigureInput[] = []) {
    addFieldValidationConfiguresToGroup(name, items);
  }

  getFieldValidationConfigureGroup(name: string) {
    return fieldValidationConfigureRegistry.getGroup(name);
  }

  /**
   * 注册字段接口创建/编辑字段时的配置项。
   *
   * 字段插件可以把复杂配置组件、配置属性、normalize / initialize 等逻辑挂到字段接口自身。
   * 如果字段接口尚未注册，配置会暂存并在接口注册后回放。
   *
   * @param options 字段接口配置
   * @returns void
   */
  registerFieldInterfaceConfigure(options: FieldInterfaceConfigure & { name: string }) {
    const fieldInterface = this.getFieldInterface(options.name);
    if (!fieldInterface) {
      this.enqueueAction(options.name, { type: 'registerConfigure', data: options });
      return;
    }
    fieldInterface.configure = this.mergeFieldInterfaceConfigure(fieldInterface.configure, options);
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
   * 获取字段接口创建/编辑字段时的配置属性。
   *
   * 字段接口可以通过自身的 properties / getConfigureFormProperties() 定义专属配置项。
   * 数据源管理等 v2 页面只需要通过该方法读取，不需要硬编码具体字段类型。
   *
   * @param name 字段接口名
   * @param collectionInfo 当前数据表信息
   * @returns 配置属性映射
   */
  getFieldInterfaceConfigureProperties(name: string, collectionInfo?: any) {
    const configure = this.getFieldInterfaceConfigure(name, collectionInfo);
    return configure?.getConfigureFormProperties?.(collectionInfo) || configure?.properties || {};
  }

  /**
   * 获取字段接口配置。
   *
   * 返回值会合并字段接口自身声明和后注册配置；后注册配置优先。
   *
   * @param name 字段接口名
   * @param collectionInfo 当前数据表信息
   * @returns 字段接口配置
   */
  getFieldInterfaceConfigure(name: string, collectionInfo?: any) {
    const fieldInterface = this.getFieldInterface(name);
    if (!fieldInterface) {
      return undefined;
    }
    const properties = fieldInterface.getConfigureFormProperties?.(collectionInfo) || fieldInterface.properties || {};
    const baseConfigure: FieldInterfaceConfigure = {
      name: fieldInterface.name,
      title: fieldInterface.title,
      group: fieldInterface.group,
      order: fieldInterface.order,
      default: (fieldInterface as any).default,
      titleUsable: (fieldInterface as any).titleUsable,
      isAssociation: fieldInterface.isAssociation,
      supportDataSourceType: fieldInterface.supportDataSourceType,
      notSupportDataSourceType: fieldInterface.notSupportDataSourceType,
      properties,
      items: configurePropertiesToItems(properties, { components: fieldInterface.configure?.components }),
      getConfigureFormProperties: fieldInterface.getConfigureFormProperties?.bind(fieldInterface),
    };

    return this.mergeFieldInterfaceConfigure(baseConfigure, fieldInterface.configure);
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

  protected normalizeFieldInterfaceFilterables() {
    Object.values(this.collectionFieldInterfaceInstances).forEach((fieldInterface) => {
      normalizeFilterableOperators(fieldInterface.filterable);
    });
  }

  protected mergeFieldInterfaceConfigure(
    base?: FieldInterfaceConfigure,
    override?: FieldInterfaceConfigure,
  ): FieldInterfaceConfigure | undefined {
    if (!base) {
      return override;
    }
    if (!override) {
      return base;
    }
    return {
      ...base,
      ...override,
      default: override.default || base.default,
      properties: {
        ...(base.properties || {}),
        ...(override.properties || {}),
      },
      items: this.mergeFieldConfigureItems(base.items, override.items),
      components: {
        ...(base.components || {}),
        ...(override.components || {}),
      },
    };
  }

  protected mergeFieldConfigureItems(
    baseItems: FieldInterfaceConfigure['items'] = [],
    overrideItems: FieldInterfaceConfigure['items'] = [],
  ) {
    const itemMap = new Map<string, NonNullable<FieldInterfaceConfigure['items']>[number]>();
    baseItems.forEach((item) => itemMap.set(item.name, item));
    overrideItems.forEach((item) => itemMap.set(item.name, item));
    return Array.from(itemMap.values());
  }
}
