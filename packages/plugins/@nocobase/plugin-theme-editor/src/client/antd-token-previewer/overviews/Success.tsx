import { Card } from 'antd';
import React from 'react';

import Alert from '../component-demos/alert/success';
import Input from '../component-demos/input/success';
import Message from '../component-demos/message/success';
import Notification from '../component-demos/notification/success';
import Progress from '../component-demos/progress/success';
import Result from '../component-demos/result/success';
import Tag from '../component-demos/tag/success';
import Timeline from '../component-demos/timeline/success';

import { Flexbox } from '@arvinxu/layout-kit';

export const Success = () => {
  return (
    <Card size={'small'}>
      <Flexbox horizontal align={'start'} gap={24}>
        <Flexbox gap={40}>
          <Flexbox horizontal align={'center'} gap={12}>
            <div>{Tag.demo}</div>
            {Input.demo}
          </Flexbox>
          {Alert.demo}
        </Flexbox>
        <Flexbox align={'center'} gap={28}>
          {Message.demo}
          {Progress.demo}
        </Flexbox>
      </Flexbox>
      <Flexbox horizontal gap={40} style={{ marginTop: 32 }}>
        <div>{Notification.demo}</div>
        <div>{Timeline.demo}</div>
      </Flexbox>
      {Result.demo}
    </Card>
  );
};
