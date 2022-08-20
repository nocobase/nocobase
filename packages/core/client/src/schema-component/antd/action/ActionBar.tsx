import { css } from '@emotion/css';
import { observer, RecursionField, useFieldSchema } from '@formily/react';
import { Space } from 'antd';
import React from 'react';
import { useSchemaInitializer } from '../../../schema-initializer';
import { DndContext } from '../../common';

export const ActionBar = observer((props: any) => {
  const { layout = 'tow-columns', style, ...others } = props;
  const fieldSchema = useFieldSchema();
  const { render } = useSchemaInitializer(fieldSchema['x-initializer']);
  if (layout === 'one-column') {
    return (
      <div style={{ display: 'flex', ...style }} {...others}>
        {props.children && (
          <div style={{ marginRight: 8 }}>
            <Space>
              {fieldSchema.mapProperties((schema, key) => {
                return <RecursionField key={key} name={key} schema={schema} />;
              })}
            </Space>
          </div>
        )}
        {render()}
      </div>
    );
  }
  return (
    <div
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflowX: 'auto', ...style }}
      {...others}
    >
      <div className={css`
        .ant-space:last-child {
          margin-left: 8px;
        }
      `} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
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
      {render()}
    </div>
  );
});
