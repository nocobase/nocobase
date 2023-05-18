import { RecursionField, observer, useField, useFieldSchema } from '@formily/react';
import React, { useState } from 'react';
import { CollectionProvider } from '../../../../collection-manager';
import { CreateAction } from '../../../../schema-initializer/components';
import { ActionContext, useActionContext } from '../../action';
import { useAssociationFieldContext, useInsertSchema } from '../hooks';
import schema from '../schema';

export const CreateRecordAction = observer((props) => {
  const field: any = useField();
  const fieldSchema = useFieldSchema();
  const ctx = useActionContext();
  const insertAddNewer = useInsertSchema('AddNewer');
  const { options: collectionField } = useAssociationFieldContext();
  const [visibleAddNewer, setVisibleAddNewer] = useState(false);
  const [currentCollection, setCurrentCollection] = useState(collectionField?.target);
  const addbuttonClick = (name) => {
    insertAddNewer(schema.AddNewer);
    setVisibleAddNewer(true);
    setCurrentCollection(name);
  };
  return (
    <CollectionProvider name={collectionField?.target}>
      <CreateAction {...props} onClick={(arg) => addbuttonClick(arg)} />
      <ActionContext.Provider value={{ ...ctx, visible: visibleAddNewer, setVisible: setVisibleAddNewer }}>
        <CollectionProvider name={currentCollection}>
          <RecursionField
            onlyRenderProperties
            basePath={field.address}
            schema={fieldSchema}
            filterProperties={(s) => {
              return s['x-component'] === 'AssociationField.AddNewer';
            }}
          />
        </CollectionProvider>
      </ActionContext.Provider>
    </CollectionProvider>
  );
});
