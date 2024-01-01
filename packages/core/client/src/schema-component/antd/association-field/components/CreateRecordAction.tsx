import { RecursionField, observer, useField, useFieldSchema } from '@formily/react';
import React, { useState } from 'react';
import { CreateAction } from '../../../../schema-initializer/components';
import { ActionContextProvider, useActionContext } from '../../action';
import { useAssociationFieldContext, useInsertSchema } from '../hooks';
import schema from '../schema';
import { CollectionProviderV2 } from '../../../../application';

export const CreateRecordAction = observer(
  (props) => {
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
      <CollectionProviderV2 name={collectionField?.target}>
        <CreateAction {...props} onClick={(arg) => addbuttonClick(arg)} />
        <ActionContextProvider value={{ ...ctx, visible: visibleAddNewer, setVisible: setVisibleAddNewer }}>
          <CollectionProviderV2 name={currentCollection}>
            <RecursionField
              onlyRenderProperties
              basePath={field.address}
              schema={fieldSchema}
              filterProperties={(s) => {
                return s['x-component'] === 'AssociationField.AddNewer';
              }}
            />
          </CollectionProviderV2>
        </ActionContextProvider>
      </CollectionProviderV2>
    );
  },
  { displayName: 'CreateRecordAction' },
);
