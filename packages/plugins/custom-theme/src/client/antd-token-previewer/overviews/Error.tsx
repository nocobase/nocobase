import { Flexbox } from '@arvinxu/layout-kit';
import { Card } from 'antd';
import React from 'react';

import Alert from '../component-demos/alert/error';
import Badge from '../component-demos/badge/badge';
import Button from '../component-demos/button/dangerButton';
import Dropdown from '../component-demos/dropdown/dropdownError';
import Menu from '../component-demos/menu/menuDanger';
import Message from '../component-demos/message/error';
import Notification from '../component-demos/notification/error';
import Progress from '../component-demos/progress/danger';
import Tag from '../component-demos/tag/error';
import Timeline from '../component-demos/timeline/danger';
import Upload from '../component-demos/upload/danger';

export const Error = () => {
  return (
    <Card size={'small'}>
      <Flexbox horizontal align={'start'} gap={24}>
        <Flexbox gap={24}>
          <Flexbox horizontal align={'center'} gap={12} style={{ marginTop: 8 }}>
            {Button.demo}
            <div>{Tag.demo}</div>
            {Badge.demo}
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
      <Flexbox horizontal gap={40}>
        {Menu.demo}
        <div style={{ width: 300 }}>{Upload.demo}</div>
        {Dropdown.demo}
      </Flexbox>
    </Card>
  );
};
