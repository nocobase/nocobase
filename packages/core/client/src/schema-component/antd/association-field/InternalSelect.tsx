import { RecursionField, useField, useFieldSchema } from '@formily/react';
import { Button, Input, Select } from 'antd';
import React, { useState } from 'react';
import { ActionContext } from '../action';
import { useInsertSchema } from './hooks';
import schema from './schema';

export const InternalSelect = () => {
  const field = useField();
  const [visibleAddNewer, setVisibleAddNewer] = useState(false);
  const [visibleSelector, setVisibleSelector] = useState(false);
  const fieldSchema = useFieldSchema();
  const insertAddNewer = useInsertSchema('AddNewer');
  const insertSelector = useInsertSchema('Selector');
  return (
    <>
      <Input.Group compact>
        <Select
          open={false}
          style={{ width: '60%' }}
          onDropdownVisibleChange={() => {
            insertSelector(schema.Selector);
            setVisibleSelector(true);
          }}
        ></Select>
        <Button
          type={'primary'}
          onClick={() => {
            insertAddNewer(schema.AddNewer);
            setVisibleAddNewer(true);
          }}
        >
          Add new
        </Button>
      </Input.Group>
      <ActionContext.Provider value={{ openMode: 'drawer', visible: visibleAddNewer, setVisible: setVisibleAddNewer }}>
        <RecursionField
          onlyRenderProperties
          basePath={field.address}
          schema={fieldSchema}
          filterProperties={(s) => {
            return s['x-component'] === 'AssociationField.AddNewer';
          }}
        />
      </ActionContext.Provider>
      <ActionContext.Provider value={{ openMode: 'drawer', visible: visibleSelector, setVisible: setVisibleSelector }}>
        <RecursionField
          onlyRenderProperties
          basePath={field.address}
          schema={fieldSchema}
          filterProperties={(s) => {
            return s['x-component'] === 'AssociationField.Selector';
          }}
        />
      </ActionContext.Provider>
    </>
  );
};
