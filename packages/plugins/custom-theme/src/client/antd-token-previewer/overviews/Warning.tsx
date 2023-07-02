import { Card } from 'antd';
import React from 'react';

import Alert from '../component-demos/alert/warning';
import Badge from '../component-demos/badge/warning';
import Input from '../component-demos/input/warning';
import Message from '../component-demos/message/warning';
import Modal from '../component-demos/modal/warning';
import Notification from '../component-demos/notification/warning';
import Popconfirm from '../component-demos/popconfirm/popconfirm';
import Result from '../component-demos/result/warning';
import Tag from '../component-demos/tag/warning';
import Text from '../component-demos/typography/warningText';
import Title from '../component-demos/typography/warningTitle';

import { Flexbox } from '@arvinxu/layout-kit';

export const Warning = () => {
  return (
    <Card size={'small'}>
      <Flexbox horizontal align={'start'} gap={24}>
        <Flexbox gap={24}>
          <Flexbox horizontal gap={12}>
            <div style={{ width: 200 }}>{Title.demo}</div>
            <div style={{ width: '100%' }}>{Input.demo}</div>
          </Flexbox>
          {Alert.demo}
        </Flexbox>
        <Flexbox align={'center'} gap={28}>
          {Message.demo}
          {Popconfirm.demo}
          <Flexbox horizontal gap={16}>
            {Badge.demo}
            {Tag.demo}
            {Text.demo}
          </Flexbox>
        </Flexbox>
      </Flexbox>
      <Flexbox horizontal gap={24} style={{ marginTop: 32 }}>
        <div>{Notification.demo}</div>
        <div>{Modal.demo}</div>
      </Flexbox>
      {Result.demo}
    </Card>
  );
};
