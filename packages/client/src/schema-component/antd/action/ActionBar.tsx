import { observer, RecursionField, useFieldSchema } from '@formily/react';
import { Space } from 'antd';
import React from 'react';
import { DndContext } from '../../common';
import { useComponent } from '../../hooks';

export const ActionBar = observer((props: any) => {
  const { layout = 'tow-columns', style, ...others } = props;
  const fieldSchema = useFieldSchema();
  const ActionInitializer = useComponent(fieldSchema['x-action-initializer']);
  if (layout === 'one-column') {
    return (
      <div style={{ display: 'flex', ...style }} {...others}>
        {props.children && <div style={{ marginRight: 8 }}>{props.children}</div>}
        {ActionInitializer && <ActionInitializer />}
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', ...style }} {...others}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <DndContext>
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
        </DndContext>
      </div>
      {ActionInitializer && <ActionInitializer />}
    </div>
  );
});
