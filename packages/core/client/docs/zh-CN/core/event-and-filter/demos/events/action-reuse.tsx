import React from 'react';
import { EventManager } from '../libs/event-manager';
import openDialog from '../actions/open-simple-dialog';
import { Button, Flex } from 'antd';

const eventManager = new EventManager();
eventManager.on('button:click', (ctx) => {
  openDialog(ctx);
});

const Button1 = () => {
  const ctx = {
    payload: {
      text: 'From Button1',
      description: 'This is an extra description from Button1',
    },
    source: {
      id: 'button1',
    },
  };
  return <Button onClick={() => eventManager.dispatchEvent('button:click', ctx)}>按钮1</Button>;
};

const Button2 = () => {
  const ctx = {
    payload: {
      text: 'From Button2',
    },
    source: {
      id: 'button2',
    },
  };
  return <Button onClick={() => eventManager.dispatchEvent('button:click', ctx)}>按钮2</Button>;
};

export default () => {
  return (
    <Flex gap="small">
      <Button1 />
      <Button2 />
    </Flex>
  );
};
