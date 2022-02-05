import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { Button } from 'antd';
import React, { useState } from 'react';
import { ActionDrawer } from './Action.Drawer';
import { VisibleContext } from './context';
import { useA } from './hooks';
import { ComposedAction } from './types';

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
        {field.title}
      </Button>
      <RecursionField basePath={field.address} schema={schema} onlyRenderProperties />
    </VisibleContext.Provider>
  );
});

Action.Drawer = ActionDrawer;

export default Action;
