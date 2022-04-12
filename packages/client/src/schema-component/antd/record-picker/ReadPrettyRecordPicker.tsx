import { Field } from '@formily/core';
import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { toArr } from '@formily/shared';
import { Space } from 'antd';
import React, { useState } from 'react';
import { BlockAssociationContext } from '../../../block-provider';
import { CollectionProvider, useCollection } from '../../../collection-manager';
import { RecordProvider } from '../../../record-provider';
import { FormProvider } from '../../core';
import { ActionContext } from '../action';
import { useFieldNames } from './useFieldNames';

export const ReadPrettyRecordPicker: React.FC = observer((props: any) => {
  const fieldSchema = useFieldSchema();
  const field = useField<Field>();
  const fieldNames = useFieldNames(props);
  const [visible, setVisible] = useState(false);
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema.name);
  return (
    <div>
      <BlockAssociationContext.Provider value={`${collectionField.collectionName}.${collectionField.name}`}>
        <CollectionProvider name={collectionField.target}>
          <ActionContext.Provider value={{ visible, setVisible, openMode: 'drawer' }}>
            <Space size={0} split={<span style={{ marginRight: 4, color: '#aaa' }}>, </span>}>
              {toArr(field.value).map((record, index) => {
                return (
                  <span>
                    <a
                      onClick={() => {
                        console.log('setVisible');
                        setVisible(true);
                      }}
                    >
                      {record?.[fieldNames?.label || 'label']}
                    </a>
                    <RecordProvider record={record}>
                      <FormProvider>
                        <RecursionField schema={fieldSchema} onlyRenderProperties />
                      </FormProvider>
                    </RecordProvider>
                  </span>
                );
              })}
            </Space>
          </ActionContext.Provider>
        </CollectionProvider>
      </BlockAssociationContext.Provider>
    </div>
  );
});
