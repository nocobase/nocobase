import { ActionModel } from "./actionModel";
import { Modal } from 'antd';
export const SaveActionModel = ActionModel.extends([
    {
        'key': 'onClick',
        'title': '保存操作',
        'steps': {
            'save': {
                'handler': (ctx, model, params) => {
                    console.log('save', ctx, model, params);
                    Modal.success({
                        title: '保存成功',
                        content: '数据保存成功。',
                    });
                }
            }
        }
    },
    {
        'key': 'default',
        'patch': true,
        'steps': {
            'setText': {
                'defaultParams': {
                    'text': '保存',
                }
            }
        }
    }
]);