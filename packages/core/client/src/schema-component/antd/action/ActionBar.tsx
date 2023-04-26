import { css, cx } from '@emotion/css';
import { observer, RecursionField, useFieldSchema } from '@formily/react';
import { Space } from 'antd';
import React from 'react';
import { useSchemaInitializer } from '../../../schema-initializer';
import { DndContext } from '../../common';
import { useDesignable, useProps } from '../../hooks';

export const ActionBar = observer((props: any) => {
  const { layout = 'tow-columns', style, size, ...others } = useProps(props);
  const fieldSchema = useFieldSchema();
  const { render } = useSchemaInitializer(fieldSchema['x-initializer']);
  const { designable } = useDesignable();
  if (layout === 'one-column') {
    return (
      <DndContext>
        <div style={{ display: 'flex', ...style }} {...others} className={cx(others.className, 'nb-action-bar')}>
          {props.children && (
            <div style={{ marginRight: 8 }}>
              <Space size={size}>
                {fieldSchema.mapProperties((schema, key) => {
                  return <RecursionField key={key} name={key} schema={schema} />;
                })}
              </Space>
            </div>
          )}
          {render()}
        </div>
      </DndContext>
    );
  }
  const hasActions = Object.keys(fieldSchema.properties ?? {}).length > 0;
  return (
    <div
      style={
        !designable && !hasActions
          ? undefined
          : {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              overflowX: 'auto',
              flexShrink: 0,
              ...style,
            }
      }
      {...others}
      className={cx(others.className, 'nb-action-bar')}
    >
      <div
        className={css`
          .ant-space:last-child {
            margin-left: 8px;
          }
        `}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
      >
        <DndContext>
          <Space size={size}>
            {fieldSchema.mapProperties((schema, key) => {
              if (schema['x-align'] !== 'left') {
                return null;
              }
              return <RecursionField key={key} name={key} schema={schema} />;
            })}
          </Space>
          <Space size={size}>
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
