import React from 'react';
import { Modal, Input } from 'antd';

/**
 * 打开一个包含表单的对话框，根据data属性自动生成表单字段
 * @param data 表单初始数据，会根据其属性生成表单字段
 * @returns Promise 包含用户填写后的表单数据
 */
const openFormDialog = async (data: Record<string, string>): Promise<Record<string, string>> => {
  return new Promise((resolve, reject) => {
    // 保存表单数据的状态
    const formState: Record<string, string> = { ...data };

    // 表单项更改处理
    const handleChange = (key: string, value: string) => {
      formState[key] = value;
    };

    // 渲染表单项
    const renderFormItems = () => {
      return Object.entries(data).map(([key, value]) => {
        return (
          <div key={key} style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontWeight: 'bold' }}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
            </div>
            <Input
              placeholder={`请输入${key}`}
              defaultValue={value}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          </div>
        );
      });
    };

    Modal.confirm({
      title: '表单',
      width: 500,
      icon: null,
      content: <div style={{ paddingTop: 10 }}>{renderFormItems()}</div>,
      okText: '提交',
      cancelText: '取消',
      onOk: () => {
        resolve(formState);
        return true;
      },
      onCancel: () => {
        resolve(null);
        return false;
      },
    });
  });
};

export default openFormDialog;
