import { Field } from '@formily/core';
import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { toArr } from '@formily/shared';
import { Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { BlockAssociationContext, WithoutTableFieldResource } from '../../../block-provider';
import { CollectionProvider, useCollection, useCollectionManager } from '../../../collection-manager';
import { RecordProvider } from '../../../record-provider';
import { FormProvider } from '../../core';
import { useCompile } from '../../hooks';
import { ActionContext } from '../action';
import { useFieldNames } from './useFieldNames';

export const ReadPrettyRecordPicker: React.FC = observer((props: any) => {
  const fieldSchema = useFieldSchema();
  const { getCollectionJoinField } = useCollectionManager();
  const field = useField<Field>();
  const fieldNames = useFieldNames(props);
  const [visible, setVisible] = useState(false);
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema.name) || getCollectionJoinField(fieldSchema?.['x-collection-field']);
  const [record, setRecord] = useState({});
  const compile = useCompile();
  
  return collectionField ? (
    <div>
      <BlockAssociationContext.Provider value={`${collectionField.collectionName}.${collectionField.name}`}>
        <CollectionProvider name={collectionField.target}>
          <Space size={0} split={<span style={{ marginRight: 4, color: '#aaa' }}>, </span>}>
            {toArr(field.value).map((record, index) => {
              return (
                <span>
                  <a
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setVisible(true);
                      setRecord(record);
                    }}
                  >
                    {compile(record?.[fieldNames?.label || 'label'])}
                  </a>
                </span>
              );
            })}
          </Space>
          <ActionContext.Provider value={{ visible, setVisible, openMode: 'drawer' }}>
            <RecordProvider record={record}>
              <WithoutTableFieldResource.Provider value={true}>
                <FormProvider>
                  <RecursionField
                    schema={fieldSchema}
                    onlyRenderProperties
                    filterProperties={(s) => {
                      return s['x-component'] === 'RecordPicker.Viewer';
                    }}
                  />
                </FormProvider>
              </WithoutTableFieldResource.Provider>
            </RecordProvider>
          </ActionContext.Provider>
        </CollectionProvider>
      </BlockAssociationContext.Provider>
    </div>
  ) : null;
});
