import { observer, useField, useFieldSchema } from '@formily/react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ActionContext } from './context';
import { useA } from './hooks';
import { ComposedAction } from './types';

export const ActionLink: ComposedAction = observer((props: any) => {
  const { openMode, containerRefKey, useAction = useA, onClick, ...others } = props;
  const [visible, setVisible] = useState(false);
  const schema = useFieldSchema();
  const field = useField();
  const { run } = useAction();
  return (
    <ActionContext.Provider value={{ visible, setVisible, openMode, containerRefKey }}>
      <Link
        {...others}
        onClick={(e) => {
          onClick && onClick(e);
          setVisible(true);
          run();
        }}
      >
        {field.title}
      </Link>
      {props.children}
    </ActionContext.Provider>
  );
});

export default ActionLink;
