import React from 'react';
import { EventBus } from '../libs/event-bus';
import { openSimpleDialogAction } from '../actions/open-simple-dialog';
import { Button, Flex } from 'antd';

const eventBus = new EventBus();
eventBus.on('button:click', async (ctx) => {
  const result = await openSimpleDialogAction.handler({}, ctx);
  console.log('Dialog result from button:', result);
});

// 两个组件，共享同一个事件处理
const Button1 = () => {
  const ctx = {
    payload: {
      text: 'From Button1',
      description: 'This is an extra description from Button1',
    },
  };
  return <Button onClick={() => eventBus.dispatchEvent('button:click', ctx)}>按钮1</Button>;
};

const Button2 = () => {
  const ctx = {
    payload: {
      text: 'From Button2',
    },
  };
  return <Button onClick={() => eventBus.dispatchEvent('button:click', ctx)}>按钮2</Button>;
};

export default () => {
  return (
    <Flex gap="small">
      <Button1 />
      <Button2 />
    </Flex>
  );
};
