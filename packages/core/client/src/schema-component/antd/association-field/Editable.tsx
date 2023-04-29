import { observer, useField } from '@formily/react';
import { Space } from 'antd';
import React from 'react';
import { AssociationFieldProvider } from './AssociationFieldProvider';
import { FileManager } from './FileManager';
import { InternalNester } from './InternalNester';
import { InternalSelect } from './InternalSelect';
import { useInsertSchema } from './hooks';
import schema from './schema';

const Test = () => {
  const field = useField();
  const insertNester = useInsertSchema('Nester');
  return (
    <Space>
      <a
        onClick={() => {
          field.componentProps.mode = 'Picker';
        }}
      >
        Picker
      </a>
      <a
        onClick={() => {
          field.componentProps.mode = 'Nester';
          insertNester(schema.Nester);
        }}
      >
        Nester
      </a>
      <a
        onClick={() => {
          field.componentProps.mode = 'FileManager';
        }}
      >
        FileManager
      </a>
    </Space>
  );
};

export const Editable = observer((props: any) => {
  const { mode = 'Picker' } = props;
  return (
    <AssociationFieldProvider>
      <Test />
      {mode === 'Picker' && <InternalSelect />}
      {mode === 'FileManager' && <FileManager />}
      {mode === 'Nester' && <InternalNester />}
    </AssociationFieldProvider>
  );
});
