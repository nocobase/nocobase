import { Modal } from "antd";
import { ActionModel } from "./actionModel";

export const RefreshActionModel = ActionModel.extends([
    {
        'key': 'refreshActionFlow',
        'title': '刷新操作',
        'steps': {
            'refresh': {
                'handler': (ctx, model, params) => {
                    console.log('refresh', ctx, model, params);
                    Modal.success({
                        title: '刷新成功',
                        content: '数据刷新成功。',
                    });
                }
            }
        }
    }
]);