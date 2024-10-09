/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Col, Divider, Row, ConfigProvider } from 'antd';

import Contact from './Contact';
import Message from './Message';
interface MessageBoxProps {
  message: string;
}

const MessageBox: React.FC<MessageBoxProps> = () => {
  return (
    <Row style={{ height: '100%' }}>
      <Col span={6}>
        <Contact />
      </Col>
      <Col span={18} style={{ height: '100%', background: 'rgba(55, 55, 55, 0.05)' }}>
        <Message />
      </Col>
    </Row>
  );
};
export default MessageBox;
