import { observer, useFieldSchema } from '@formily/react';
import React from 'react';
import { DragHandler } from '../../';

export const Block = observer(
  (props) => {
    const fieldSchema = useFieldSchema();
    return (
      <div style={{ marginBottom: 20, padding: '0 20px', height: 50, lineHeight: '50px', background: '#f1f1f1' }}>
        Block {fieldSchema.title}
        <DragHandler />
      </div>
    );
  },
  { displayName: 'Block' },
);
