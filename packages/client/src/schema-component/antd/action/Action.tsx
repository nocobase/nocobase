import React, { useState } from 'react';
import { Button, ButtonProps } from 'antd';
import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { useA } from './hooks';
import { VisibleContext } from './context';
import { ComposedAction } from './types';
import { ActionDrawer } from './Action.Drawer';

export const Action: ComposedAction = observer((props) => {
  const { useAction = useA, onClick, ...others } = props;
  const [visible, setVisible] = useState(false);
  const schema = useFieldSchema();
  const field = useField();
  const { run } = useAction();
  return (
    <VisibleContext.Provider value={[visible, setVisible]}>
      <Button
        {...others}
        onClick={(e) => {
          onClick && onClick(e);
          setVisible(true);
          run();
        }}
      >
        {schema.title}
      </Button>
      <RecursionField basePath={field.address} schema={schema} onlyRenderProperties />
    </VisibleContext.Provider>
  );
});

Action.Drawer = ActionDrawer;

export default Action;
