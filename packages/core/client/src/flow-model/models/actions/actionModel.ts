import { FlowModel } from '../flowModel';
import { Application } from '../../../application';
import { BlockModel } from '..';

export class ActionModel extends FlowModel {
  public blockModel: BlockModel;
  
  static {
    this.initFlows();
  }

  constructor(uid: string, app: Application, blockModel: BlockModel) {
    super(uid, app);
    this.blockModel = blockModel;
  }

  protected static initFlows() {
    this.registerFlow({
      key: 'default',
      default: true,
      title: '按钮属性',
      steps: {
        setText: {
          handler: (ctx, model, params) => model.setProps('text', params.text),
          uiSchema: {
            text: {
              type: 'string',
              title: '标题',
              'x-component': 'Input'
            },
          },
          defaultParams: { text: '操作' }
        },
        setDanger: {
          handler: (ctx, model, params) => model.setProps('danger', params.danger),
          uiSchema: {
            danger: {
              type: 'boolean',
              title: '是否危险',
              'x-component': 'Switch'
            },
          },
          defaultParams: { danger: false }
        },
        setType: {
          handler: (ctx, model, params) => model.setProps('type', params.type),
          uiSchema: {
            type: {
              type: 'string',
              title: '类型',
              'x-component': 'Select',
              enum: [
                { label: 'Primary', value: 'primary' },
                { label: 'Default', value: 'default' },
              ]
            },
          },
          defaultParams: { type: 'default' }
        },
        setOnClick: {
          handler: (ctx, model, params) => {
            model.setProps('onClick', () => {
              model.dispatchEvent('onClick', ctx);
            });
          }
        }
      },
    });

    this.registerFlow<ActionModel>({
      key: 'remove',
      on: {
        eventName: 'remove',
      },
      steps: {
        remove: {
          handler: async (ctx, model, params) => {
            model.blockModel.removeAction(model.uid);
            model.flowEngine.destroyModel(model.blockModel.uid);
            await model.blockModel.applyDefaultFlows();
          }
        }
      }
    });
  }
}
