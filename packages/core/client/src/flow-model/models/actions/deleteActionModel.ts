import { ActionModel } from './actionModel';
import { Modal } from 'antd';

export const DeleteActionModel = ActionModel.extends([
    {
        'key': 'deleteActionFlow',
        'title': '删除操作',
        steps: {
            showConfirm: {
                handler: async (ctx, model, params) => {
                    if (params.showConfirm) {
                        await new Promise((resolve) => {
                            Modal.confirm({
                                title: params.title,
                                content: params.content,
                                onOk: () => resolve(true),
                                onCancel: () => {
                                    ctx.$exit();
                                    resolve(false);
                                }
                            });
                        });
                    }
                },
                defaultParams: {
                    showConfirm: true,
                    title: '确定删除吗？',
                    content: '删除后无法恢复，请谨慎操作。',
                }
            },
            deleteData: {
                handler: (ctx, model, params) => {
                    console.log('delete', ctx, model, params);
                    Modal.success({
                        title: '删除成功',
                        content: '数据删除成功。',
                    });
                }
            }
        }
    }
]);
