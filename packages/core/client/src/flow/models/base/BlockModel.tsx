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

export type BlockSceneType = 'new' | 'filter' | 'one' | 'many' | 'select' | BlockSceneType[];

export const BlockSceneEnum = {
  new: 'new' as BlockSceneType,
  one: 'one' as BlockSceneType,
  many: 'many' as BlockSceneType,
  select: 'select' as BlockSceneType,
  filter: 'filter' as BlockSceneType,
  oam: ['one', 'many'] as BlockSceneType,
};

export class BlockModel<T = DefaultStructure> extends FlowModel<T> {
  decoratorProps: Record<string, any> = observable({});
  static scene: BlockSceneType;
  _defaultCustomModelClasses = {} as any;
  customModelClasses = {} as any;
  collectionRequired = false;
  private ObservedRenderComponent = null;
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
        const title = ctx.t(params.title);
        const description = ctx.t(params.description);
        ctx.model.setDecoratorProps({ title: title, description: description });
      },
    },
    linkageRules: {
      use: 'blockLinkageRules',
    },
    // setBlockHeight: {
    //   title: tval('Set block height'),
    //   uiSchema: {
    //     heightMode: {
    //       type: 'string',
    //       enum: [
    //         { label: tval('Default'), value: HeightMode.DEFAULT },
    //         { label: tval('Specify height'), value: HeightMode.SPECIFY_VALUE },
    //         { label: tval('Full height'), value: HeightMode.FULL_HEIGHT },
    //       ],
    //       required: true,
    //       'x-decorator': 'FormItem',
    //       'x-component': 'Radio.Group',
    //     },
    //     height: {
    //       title: tval('Height'),
    //       type: 'string',
    //       required: true,
    //       'x-decorator': 'FormItem',
    //       'x-component': 'NumberPicker',
    //       'x-component-props': {
    //         addonAfter: 'px',
    //       },
    //       'x-validator': [
    //         {
    //           minimum: 40,
    //         },
    //       ],
    //       'x-reactions': {
    //         dependencies: ['heightMode'],
    //         fulfill: {
    //           state: {
    //             hidden: '{{ $deps[0]==="fullHeight"||$deps[0]==="defaultHeight"}}',
    //             value: '{{$deps[0]!=="specifyValue"?null:$self.value}}',
    //           },
    //         },
    //       },
    //     },
    //   },
    //   defaultParams: () => {
    //     return {
    //       heightMode: HeightMode.DEFAULT,
    //     };
    //   },
    //   handler(ctx, params) {
    //     ctx.model.setDecoratorProps({ heightMode: params.heightMode, height: params.height });
    //   },
    // },
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
