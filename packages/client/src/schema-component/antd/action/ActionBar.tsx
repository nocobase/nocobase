import { RecursionField, useFieldSchema } from '@formily/react';
import { Space } from 'antd';
import React from 'react';
import { useComponent } from '../../hooks';

export const ActionBar = () => {
  const fieldSchema = useFieldSchema();
  const ActionInitializer = useComponent(fieldSchema['x-action-initializer']);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <Space>
          {fieldSchema.mapProperties((schema, key) => {
            if (schema['x-align'] !== 'left') {
              return null;
            }
            return <RecursionField key={key} name={key} schema={schema} />;
          })}
        </Space>
        <Space>
          {fieldSchema.mapProperties((schema, key) => {
            if (schema['x-align'] === 'left') {
              return null;
            }
            return <RecursionField key={key} name={key} schema={schema} />;
          })}
        </Space>
      </div>
      {ActionInitializer && <ActionInitializer />}
    </div>
  );
};
