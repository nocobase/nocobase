import React from 'react';
import { useDesignable } from '@nocobase/client';
import { Button } from 'antd';
import { observer } from '@formily/react';

export const Hello: React.FC<any> = observer(({ name }) => {
  const { patch, remove } = useDesignable();
  return (
    <div>
      <h1>Hello {name}!</h1>
      <Button
        onClick={() => {
          patch('x-component-props.name', Math.random());
        }}
      >
        更新
      </Button>
    </div>
  );
});
