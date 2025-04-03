import { Modal } from 'antd';
import React from 'react';

/**
 * 打开事件详情弹窗的全局方法
 * @param data 要显示的数据
 * @returns Promise 用户点击确定返回true，取消返回false
 */
const openDialog = async (data: any): Promise<boolean> => {
  return new Promise((resolve) => {
    Modal.confirm({
      title: '弹窗',
      width: 600,
      content: (
        <pre
          style={{
            padding: 16,
            background: '#f5f5f5',
            borderRadius: 4,
            maxHeight: 400,
            overflow: 'auto',
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      ),
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        resolve(true);
        return true;
      },
      onCancel: () => {
        resolve(false);
        return false;
      },
    });
  });
};

export default openDialog;
