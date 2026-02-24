/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { observable } from '@formily/reactive';
import { DefaultStructure, tExpr, FlowModel, observer } from '@nocobase/flow-engine';
import _ from 'lodash';
import React from 'react';
import { Tooltip } from 'antd';
import { BlockItemCard } from '../../components';
import { commonConditionHandler, ConditionBuilder } from '../../components/ConditionBuilder';
import { BlockPlaceholder, BlockDeletePlaceholder } from '../../components/placeholders/BlockPlaceholder';

export type BlockSceneType =
  | 'new'
  | 'filter'
  | 'one'
  | 'many'
  | 'select'
  | 'subForm'
  | 'bulkEditForm'
  | BlockSceneType[];

export const BlockSceneEnum = {
  new: 'new' as BlockSceneType,
  one: 'one' as BlockSceneType,
  many: 'many' as BlockSceneType,
  select: 'select' as BlockSceneType,
  filter: 'filter' as BlockSceneType,
  oam: ['one', 'many'] as BlockSceneType,
  subForm: 'subForm' as BlockSceneType,
  bulkEditForm: 'bulkEditForm' as BlockSceneType,
};

export class BlockModel<T = DefaultStructure> extends FlowModel<T> {
  decoratorProps: Record<string, any> = observable({});
  static scene: BlockSceneType;
  _defaultCustomModelClasses = {} as any;
  customModelClasses = {} as any;
  collectionRequired = false;
  private ObservedRenderComponent = null;

  /**
   * 记录各筛选来源是否活跃（有有效筛选值）
   * key: filterId (筛选器 uid), value: boolean (是否有有效筛选)
   */
  private activeFilterSources: Map<string, boolean> = new Map();

  /**
   * 设置指定筛选来源的活跃状态
   * @param filterId 筛选器 uid
   * @param active 是否有有效筛选值
   */
  setFilterActive(filterId: string, active: boolean) {
    this.activeFilterSources.set(filterId, active);
  }

  /**
   * 检查是否有任何活跃的筛选来源
   * @returns boolean
   */
  hasActiveFilters(): boolean {
    // 检查 dataScope 是否有筛选
    const resource = this['resource'] as any;
    if (resource && resource['filter'] && Object.keys(resource['filter']).length > 0) {
      return true;
    }

    // 检查所有绑定的筛选器
    for (const [, active] of this.activeFilterSources) {
      if (active) {
        return true;
      }
    }

    return false;
  }

  /**
   * 移除指定筛选来源
   * @param filterId 筛选器 uid
   */
  removeFilterSource(filterId: string) {
    this.activeFilterSources.delete(filterId);
  }

  /**
   * 获取数据加载模式
   * @returns 'auto' | 'manual'
   */
  getDataLoadingMode(): 'auto' | 'manual' {
    return this.getStepParams('dataLoadingModeSettings')?.mode || 'auto';
  }

  static _getScene() {
    return _.castArray(this['scene'] || []);
  }

  static _isScene(scene: BlockSceneType) {
    const scenes = this._getScene();
    return scenes.includes(scene);
  }

  getModelClassName(className: string) {
    if (Object.keys(this.customModelClasses).includes(className)) {
      return this.customModelClasses[className];
    }
    return this._defaultCustomModelClasses[className] || className;
  }

  // 设置态隐藏时的占位渲染
  protected renderHiddenInConfig(): React.ReactNode | undefined {
    if (this.forbidden) {
      return <BlockPlaceholder />;
    }

    return (
      <Tooltip title={this.context.t('The block is hidden and only visible when the UI Editor is active')}>
        <BlockItemCard ref={this.context.ref} {...this.decoratorProps} style={{ opacity: '0.3' }}>
          <this.ObservedRenderComponent />
        </BlockItemCard>
      </Tooltip>
    );
  }

  onInit(options: any): void {
    super.onInit(options);
    this.context.defineProperty('blockModel', {
      value: this,
    });
    this.context.defineMethod('getModelClassName', (className: string) => {
      return this.getModelClassName(className);
    });
    this.ObservedRenderComponent = observer(
      () => {
        return this.renderComponent();
      },
      {
        displayName: 'ObservedRenderComponent',
      },
    );
  }

  setDecoratorProps(props) {
    Object.assign(this.decoratorProps, props);
  }

  get title() {
    if (!this._title) {
      this._title = this.defaultBlockTitle();
    }
    return this._title;
  }

  protected defaultBlockTitle() {
    return `${this.translate(this.constructor['meta']?.label || this.constructor.name)}`;
  }

  renderComponent(): any {
    throw new Error('renderComponent method must be implemented in subclasses of BlockModel');
  }

  render() {
    if (this.collectionRequired && !this.context.collection) {
      return <BlockDeletePlaceholder />;
    }
    return (
      <BlockItemCard ref={this.context.ref} {...this.decoratorProps}>
        <this.ObservedRenderComponent />
      </BlockItemCard>
    );
  }
}

BlockModel.registerFlow({
  key: 'cardSettings',
  title: tExpr('Card settings'),
  steps: {
    titleDescription: {
      title: tExpr('Title & description'),
      uiSchema: {
        title: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          title: tExpr('Title'),
        },
        description: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
          title: tExpr('Description'),
        },
      },
      handler(ctx, params) {
        const title = ctx.t(params.title, { ns: 'lm-flow-engine' });
        const description = ctx.t(params.description, { ns: 'lm-flow-engine' });
        ctx.model.setDecoratorProps({ title, description });
      },
    },
    linkageRules: {
      use: 'blockLinkageRules',
    },
    blockHeight: {
      use: 'blockHeight',
    },
  },
});

BlockModel.define({
  hide: true,
  label: tExpr('Other blocks'),
  // async children(ctx) {
  //   const children = await buildSubModelItems(BlockModel)(ctx);
  //   const { collectionName, filterByTk, scene } = ctx.view.inputArgs;
  //   return children.filter((item) => {
  //     const M = ctx.engine.getModelClass(item.useModel);
  //     if (scene === 'select') {
  //       return M['_isScene']?.('select');
  //     }
  //     if (scene === 'new' || (collectionName && !filterByTk)) {
  //       return M['_isScene']?.('new');
  //     }
  //     return !M['_isScene'] || !M['_isScene']?.('select');
  //   });
  // },
});

// TODO: 应该放到 @nocobase/flow-engine 里，不过因为 flow-engine 里不能依赖 flow，所以先放这里
FlowModel.registerEvents({
  beforeRender: {
    title: tExpr('Before render'),
    name: 'beforeRender',
    uiSchema: {
      condition: {
        type: 'object',
        title: tExpr('Trigger condition'),
        'x-decorator': 'FormItem',
        'x-component': ConditionBuilder,
      },
    },
    handler: commonConditionHandler,
  },
});
