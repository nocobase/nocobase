import { ActionModel } from "./actionModel";

export const UpdateActionModel = ActionModel.extends([
    {
        'key': 'onClick',
        'title': '更新操作',
        'steps': {
            'update': {
                'handler': (ctx, model, params) => {
                    console.log('update', ctx, model, params);
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
                    'text': '更新',
                }
            }
        }
    }
])