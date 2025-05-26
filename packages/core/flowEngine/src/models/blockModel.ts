/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from './flowModel';
import { ActionModel } from './actions/actionModel';
import { define, observable } from '@formily/reactive';
import { DeleteActionModel } from './actions/deleteActionModel';
import { RefreshActionModel } from './actions/refreshActionModel';
import { ExtendedFlowDefinition } from '../types';
import { UpdateActionModel } from './actions/updateActionModel';

const registeredActionModels = new WeakMap<
  typeof BlockModel,
  Set<{
    title: string;
    type: typeof ActionModel;
  }>
>();

export class BlockModel extends FlowModel {
  public actions: Map<string, ActionModel>;

  static {
    this.initFlows();
    this.initSupportedActions();
  }

  constructor(options: { uid: string; stepParams?: Record<string, any> }) {
    super({
      uid: options.uid,
      stepParams: options.stepParams,
    });
    this.actions = observable(new Map<string, ActionModel>());
    define(this, {
      actions: observable,
    });
  }

  setActions(actions: ActionModel[]) {
    this.actions.clear();
    actions.forEach((action) => this.actions.set(action.uid, action));
  }

  addAction(action: ActionModel) {
    this.actions.set(action.uid, action);
  }

  getAction(uid: string): ActionModel | undefined {
    return this.actions.get(uid);
  }

  removeAction(uid: string): boolean {
    return this.actions.delete(uid);
  }

  getActions(): ActionModel[] {
    return Array.from(this.actions.values());
  }

  public static registerActionModel({ title, type }: { title: string; type: typeof ActionModel }) {
    registeredActionModels.get(this) || registeredActionModels.set(this, new Set());
    registeredActionModels.get(this)?.add({ title, type });
  }

  public static get supportedActions(): {
    title: string;
    type: typeof ActionModel;
  }[] {
    // 收集当前类和所有父类的 actions（继承链向上查找）
    const allActions = new Set<{
      title: string;
      type: typeof ActionModel;
    }>();

    let currentClass = this;
    // 向上遍历继承链，直到到达 BlockModel 的基类
    while (currentClass && typeof currentClass === 'function') {
      const actions = registeredActionModels.get(currentClass);
      if (actions) {
        actions.forEach((action) => allActions.add(action));
      }

      // 向上查找父类
      const parentClass = Object.getPrototypeOf(currentClass);
      // 如果父类不再是 BlockModel 的子类，则停止（避免越过 BlockModel 基类边界）
      if (parentClass === FlowModel || parentClass === Function.prototype) {
        break;
      }
      currentClass = parentClass;
    }

    return Array.from(allActions);
  }

  protected static initFlows() {
    this.registerFlow({
      key: 'default',
      autoApply: true,
      title: '区块通用属性',
      steps: {
        setHeight: {
          title: '设置高度',
          handler: (ctx, model, params) => {
            const { height } = params || {};
            if (height !== undefined) {
              model.setProps('height', height);
            }
          },
          uiSchema: {
            height: {
              type: 'number',
              'x-component': 'InputNumber',
            },
          },
          defaultParams: { height: 300 },
        },
      },
    });
  }

  protected static initSupportedActions() {
    this.registerActionModel({
      title: '删除',
      type: DeleteActionModel,
    });
    // this.registerActionModel({
    //   title: '保存',
    //   type: SaveActionModel,
    // });
    this.registerActionModel({
      title: '刷新',
      type: RefreshActionModel,
    });
    this.registerActionModel({
      title: '更新',
      type: UpdateActionModel,
    });
  }

  /**
   * 覆盖父类的 extends 方法，支持 supportedActions 参数
   */
  public static extends<T extends typeof BlockModel>(this: T, flows: ExtendedFlowDefinition[]): T;

  public static extends<T extends typeof BlockModel>(
    this: T,
    flows: ExtendedFlowDefinition[],
    supportedActions: {
      title: string;
      type: typeof ActionModel;
    }[],
  ): T;

  public static extends<T extends typeof BlockModel>(
    this: T,
    flows: ExtendedFlowDefinition[] = [],
    supportedActions?: {
      title: string;
      type: typeof ActionModel;
    }[],
  ): T {
    // 先调用父类的 extends 方法处理 flows
    const ExtendedClass = FlowModel.extends.call(this, flows) as T;

    // 注册 supportedActions
    if (supportedActions && supportedActions.length > 0) {
      supportedActions.forEach((action) => {
        ExtendedClass.registerActionModel(action);
      });
    }

    return ExtendedClass;
  }
}
