import { Button, Modal } from 'antd';
import React, { useState } from 'react';
import type { ComponentDemo } from '../../interface';

const Demo = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const showModal = () => {
    setIsModalVisible(true);
  };
  const handleOk = () => {
    setIsModalVisible(false);
  };
  const handleCancel = () => {
    setIsModalVisible(false);
  };
  return (
    <>
      <Button type="primary" onClick={showModal}>
        Open Modal
      </Button>
      <Modal title="Basic Modal" open={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
        <p>Some contents...</p> <p>Some contents...</p> <p>Some contents...</p>
      </Modal>
    </>
  );
};

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorBgMask'],
  key: 'modalWithButton',
};
export default componentDemo;
