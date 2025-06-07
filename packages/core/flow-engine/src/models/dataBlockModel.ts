/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockModel } from './blockModel';
import { FlowResource } from '../resources/flowResource';

export class DataBlockModel extends BlockModel {
  public resource: FlowResource;
  public fields: any[];

  static {
    this.initFlows();
  }

  constructor(options: { uid: string; stepParams?: Record<string, any>; resource?: FlowResource }) {
    super({
      uid: options.uid,
      stepParams: options.stepParams,
    });
    if (options.resource) {
      this.resource = options.resource;
    }
    this.fields = [];
  }

  /**
   * 设置Resource实例
   * @param {FlowResource} resource FlowResource实例
   */
  setResource(resource: FlowResource): void {
    this.resource = resource;
  }

  setFields(fields: any[]) {
    this.fields = fields;
  }

  getFields() {
    return this.fields;
  }

  protected static initFlows() {
    // 添加 DataBlockModel 特有的 flows
    // 保存(修改) data
    // 添加 data
    // 删除 data
    this.registerFlow({
      key: 'saveData',
      on: {
        eventName: 'saveData',
      },
      steps: {
        save: {
          handler: (ctx, params) => {
            console.log('saveData', ctx, ctx.model, params);
          },
        },
      },
    });

    this.registerFlow({
      key: 'addData',
      on: {
        eventName: 'addData',
      },
      steps: {
        add: {
          handler: (ctx, params) => {
            console.log('addData', ctx, ctx.model, params);
          },
        },
      },
    });

    this.registerFlow({
      key: 'deleteData',
      on: {
        eventName: 'deleteData',
      },
      steps: {
        delete: {
          handler: (ctx, params) => {
            console.log('deleteData', ctx, ctx.model, params);
          },
          uiSchema: {
            showConfirm: {
              type: 'boolean',
              title: '是否二次确认',
              'x-component': 'Switch',
            },
          },
          defaultParams: {
            showConfirm: true,
          },
        },
      },
    });
  }
}
