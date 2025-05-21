import { FlowModel, IModelComponentProps } from './flowModel';
import { Application } from '../../application';

export class ActionModel extends FlowModel {
  public event?: string;

  static {
    this.initDefaultFlows();
  }

  constructor(uid: string, app: Application) {
    super(uid, app);
  }

  private static initDefaultFlows() {
    this.registerFlow({
      key: 'setActionProps',
      title: '设置按钮文本',
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
          defaultParams: { type: 'primary' }
        },
        setOnClick: {
          handler: (ctx, model, params) => {
            model.setProps('onClick', () => {
              model.dispatchEvent('onClick', ctx);
            });
          },
        }
      },
    });
  }
} 