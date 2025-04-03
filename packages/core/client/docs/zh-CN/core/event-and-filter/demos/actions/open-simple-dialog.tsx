import { Modal, Input, Button } from 'antd';
import React from 'react';

/**
 * 打开事件详情弹窗的全局方法
 * @param data 要显示的数据
 */
const openDialog = (data: any) => {
  Modal.info({
    title: '按钮事件触发详情',
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
    okText: '关闭',
    maskClosable: true,
  });
};

export default openDialog;
