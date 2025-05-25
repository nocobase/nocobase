import { BlockModel } from './blockModel';
import { Application } from '../../application';
import { BaseResource } from '../resources/baseResource';

export class DataBlockModel extends BlockModel {
  public resource: BaseResource;
  public fields: any[];

  static {
    this.initFlows();
  }

  constructor(uid: string, app: Application, resource?: BaseResource) {
    super(uid, app);
    this.resource = resource;
    this.fields = [];
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
          handler: (ctx, model, params) => {
            console.log('saveData', ctx, model, params);
          }
        }
      }
    });

    this.registerFlow({
      key: 'addData',
      on: {
        eventName: 'addData',
      },
      steps: {
        add: {
          handler: (ctx, model, params) => {
            console.log('addData', ctx, model, params);
          }
        }
      }
    });

    this.registerFlow({
      key: 'deleteData',
      on: {
        eventName: 'deleteData',
      },
      steps: {
        delete: {
          handler: (ctx, model, params) => {
            console.log('deleteData', ctx, model, params);
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
      }
    });
  }
} 