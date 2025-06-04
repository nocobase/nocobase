/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useField, useFieldSchema } from '@formily/react';
import React, { useState } from 'react';
import { CollectionProvider_deprecated, useCollectionManager_deprecated } from '../../../../collection-manager';
import { NocoBaseRecursionField } from '../../../../formily/NocoBaseRecursionField';
import { CreateAction } from '../../../../schema-initializer/components';
import { ActionContextProvider, useActionContext } from '../../action';
import { useAssociationFieldContext, useInsertSchema } from '../hooks';
import schema from '../schema';
import { TabsContextProvider } from '../../tabs/context';

export const CreateRecordAction = observer(
  (props) => {
    const field: any = useField();
    const fieldSchema = useFieldSchema();
    const ctx = useActionContext();
    const { getCollection } = useCollectionManager_deprecated();
    const insertAddNewer = useInsertSchema('AddNewer');
    const { options: collectionField } = useAssociationFieldContext();
    const [visibleAddNewer, setVisibleAddNewer] = useState(false);
    const targetCollection = getCollection(collectionField?.target);
    const [currentCollection, setCurrentCollection] = useState(targetCollection?.name);
    const [currentDataSource, setCurrentDataSource] = useState(targetCollection?.dataSource);
    const [formValueChanged, setFormValueChanged] = useState(false);

    const addbuttonClick = (collectionData) => {
      insertAddNewer(schema.AddNewer);
      setVisibleAddNewer(true);
      setCurrentCollection(collectionData.name);
      setCurrentDataSource(collectionData.dataSource);
    };
    return (
      <CollectionProvider_deprecated name={collectionField?.target}>
        <CreateAction {...props} onClick={(arg) => addbuttonClick(arg)} />
        <ActionContextProvider
          value={{
            ...ctx,
            visible: visibleAddNewer,
            setVisible: setVisibleAddNewer,
            formValueChanged,
            setFormValueChanged,
          }}
        >
          <CollectionProvider_deprecated name={currentCollection} dataSource={currentDataSource}>
            <TabsContextProvider>
              <NocoBaseRecursionField
                onlyRenderProperties
                basePath={field.address}
                schema={fieldSchema}
                filterProperties={(s) => {
                  return s['x-component'] === 'AssociationField.AddNewer';
                }}
              />
            </TabsContextProvider>
          </CollectionProvider_deprecated>
        </ActionContextProvider>
      </CollectionProvider_deprecated>
    );
  },
  { displayName: 'CreateRecordAction' },
);
