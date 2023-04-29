import { RecursionField, useField, useFieldSchema } from '@formily/react';
import React, { useState } from 'react';
import { ActionContext } from '../action';
import { useInsertSchema } from './hooks';
import schema from './schema';

export const InternalViewer = (props) => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const insertViewer = useInsertSchema('Viewer');
  const [visibleViewer, setVisibleViewer] = useState(false);
  return (
    <div>
      <a
        onClick={() => {
          insertViewer(schema.Viewer)
          setVisibleViewer(true);
        }}
      >
        This is a demo
      </a>
      <ActionContext.Provider value={{ openMode: 'drawer', visible: visibleViewer, setVisible: setVisibleViewer }}>
        <RecursionField
          onlyRenderProperties
          basePath={field.address}
          schema={fieldSchema}
          filterProperties={(s) => {
            return s['x-component'] === 'AssociationField.Viewer';
          }}
        />
      </ActionContext.Provider>
    </div>
  );
};
