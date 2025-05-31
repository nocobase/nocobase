/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockModel } from '..';
import { StepParams } from '../../types';
import { FlowModel } from '../flowModel';

export class ActionModel extends FlowModel {
  public blockModel: BlockModel;

  static {
    this.initFlows();
  }

  constructor(options: { uid: string; stepParams?: StepParams; blockModel?: BlockModel }) {
    super({
      uid: options.uid,
      stepParams: options.stepParams,
    });
    if (options.blockModel) {
      this.blockModel = options.blockModel;
    }
  }

  /**
   * 设置BlockModel实例
   * @param {BlockModel} blockModel BlockModel实例
   */
  setBlockModel(blockModel: BlockModel): void {
    this.blockModel = blockModel;
  }

  protected static initFlows() {
    this.registerFlow({
      key: 'default',
      autoApply: true,
      title: '按钮属性',
      steps: {
        setText: {
          title: '文本',
          handler: (ctx, model, params) => model.setProps('text', params.text),
          uiSchema: {
            text: {
              type: 'string',
              title: '标题',
              'x-component': 'Input',
            },
          },
          defaultParams: { text: '操作' },
        },
        setDanger: {
          title: '是否danger',
          handler: (ctx, model, params) => model.setProps('danger', params.danger),
          uiSchema: {
            danger: {
              type: 'boolean',
              title: '是否危险',
              'x-component': 'Switch',
            },
          },
          defaultParams: { danger: false },
        },
        setType: {
          title: '按钮类型',
          handler: (ctx, model, params) => model.setProps('type', params.type),
          uiSchema: {
            type: {
              type: 'string',
              title: '类型',
              'x-component': 'Select',
              enum: [
                { label: 'Primary', value: 'primary' },
                { label: 'Default', value: 'default' },
              ],
            },
          },
          defaultParams: { type: 'default' },
        },
        setOnClick: {
          title: '点击事件',
          handler: (ctx, model, params) => {
            model.setProps('onClick', () => {
              model.dispatchEvent('onClick', ctx);
            });
          },
        },
      },
    });

    this.registerFlow<ActionModel>({
      key: 'remove',
      on: {
        eventName: 'remove',
      },
      steps: {
        remove: {
          title: '移除操作',
          handler: async (ctx, model, params) => {
            model.blockModel.removeAction(model.uid);
            await model.flowEngine.destroyModel(model.blockModel.uid);
            await model.blockModel.applyAutoFlows();
          },
        },
      },
    });
  }
}
