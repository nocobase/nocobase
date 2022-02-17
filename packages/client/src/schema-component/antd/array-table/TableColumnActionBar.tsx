import { observer, useFieldSchema } from '@formily/react';
import React from 'react';
import { useComponent } from '../..';

export const TableColumnActionBar = observer((props) => {
  const fieldSchema = useFieldSchema();
  const ActionInitializer = useComponent(fieldSchema['x-action-initializer']);
  return (
    <div>
      {ActionInitializer && <ActionInitializer />}
      {props.children}
    </div>
  );
});
