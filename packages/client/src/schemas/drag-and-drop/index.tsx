import React from 'react';
import { observer, useFieldSchema } from '@formily/react';
import { DragDropManagerProvider } from './../../components/drag-and-drop';

export const DragAndDrop = observer((props) => {
  const schema = useFieldSchema();
  console.log('DragAndDrop');
  return (
    <DragDropManagerProvider uid={schema.name}>
      <div className={'nb-dnd'}>{props.children}</div>
    </DragDropManagerProvider>
  );
});
