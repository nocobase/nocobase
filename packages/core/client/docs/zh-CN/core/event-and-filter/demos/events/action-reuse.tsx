import React from 'react';
import { EventManager } from '../libs/event-manager';
import { openSimpleDialogAction } from '../actions/open-simple-dialog';
import { Button, Flex } from 'antd';

const eventManager = new EventManager();
eventManager.on('button:click', async (ctx) => {
  const result = await openSimpleDialogAction.handler({}, ctx);
});

const Button1 = () => {
  const ctx = {
    payload: {
      text: 'From Button1',
      description: 'This is an extra description from Button1',
    },
  };
  return <Button onClick={() => eventManager.dispatchEvent('button:click', ctx)}>按钮1</Button>;
};

const Button2 = () => {
  const ctx = {
    payload: {
      text: 'From Button2',
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
