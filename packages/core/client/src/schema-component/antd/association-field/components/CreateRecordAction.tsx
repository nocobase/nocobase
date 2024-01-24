import { RecursionField, observer, useField, useFieldSchema } from '@formily/react';
import React, { useState } from 'react';
import { CollectionProvider, useCollectionManager } from '../../../../collection-manager';
import { CreateAction } from '../../../../schema-initializer/components';
import { ActionContextProvider, useActionContext } from '../../action';
import { useAssociationFieldContext, useInsertSchema } from '../hooks';
import schema from '../schema';

export const CreateRecordAction = observer(
  (props) => {
    const field: any = useField();
    const fieldSchema = useFieldSchema();
    const ctx = useActionContext();
    const { getCollection } = useCollectionManager();
    const insertAddNewer = useInsertSchema('AddNewer');
    const { options: collectionField } = useAssociationFieldContext();
    const [visibleAddNewer, setVisibleAddNewer] = useState(false);
    const targetCollection = getCollection(collectionField?.target);
    const [currentCollection, setCurrentCollection] = useState(targetCollection?.name);
    const [currentDataSource, setCurrentDataSource] = useState(targetCollection?.dataSource);
    const addbuttonClick = (collectionData) => {
      insertAddNewer(schema.AddNewer);
      setVisibleAddNewer(true);
      setCurrentCollection(collectionData.name);
      setCurrentDataSource(collectionData.dataSource);
    };
    return (
      <CollectionProvider name={collectionField?.target}>
        <CreateAction {...props} onClick={(arg) => addbuttonClick(arg)} />
        <ActionContextProvider value={{ ...ctx, visible: visibleAddNewer, setVisible: setVisibleAddNewer }}>
          <CollectionProvider name={currentCollection} dataSource={currentDataSource}>
            <RecursionField
              onlyRenderProperties
              basePath={field.address}
              schema={fieldSchema}
              filterProperties={(s) => {
                return s['x-component'] === 'AssociationField.AddNewer';
              }}
            />
          </CollectionProvider>
        </ActionContextProvider>
      </CollectionProvider>
    );
  },
  { displayName: 'CreateRecordAction' },
);
