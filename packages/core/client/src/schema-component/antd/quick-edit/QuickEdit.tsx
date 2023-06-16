import { EditOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { FormItem } from '@formily/antd';
import { createForm } from '@formily/core';
import { FormContext, RecursionField, observer, useField, useFieldSchema } from '@formily/react';
import { Popover } from 'antd';
import React, { useMemo, useRef } from 'react';
import { useCollectionManager } from '../../../collection-manager';

export const QuickEdit = observer((props) => {
  const field: any = useField();
  const containerRef = useRef(null);
  const { getCollectionJoinField } = useCollectionManager();
  const fieldSchema = useFieldSchema();
  const collectionField = getCollectionJoinField(fieldSchema['x-collection-field']);
  if (!collectionField) {
    return null;
  }
  const schema: any = {
    name: fieldSchema.name,
    'x-collection-field': fieldSchema['x-collection-field'],
    'x-component': 'CollectionField',
    'x-read-pretty': true,
    default: field.value,
    'x-component-props': fieldSchema['x-component-props'],
  };
  const form = useMemo(
    () =>
      createForm({
        values: {
          [fieldSchema.name]: field.value,
        },
      }),
    [field.value, fieldSchema['x-component-props']],
  );
  const getContainer = () => {
    return containerRef.current;
  };

  const modifiedChildren = React.Children.map(props.children, (child) => {
    if (React.isValidElement(child)) {
      //@ts-ignore
      return React.cloneElement(child, { getContainer });
    }
    return child;
  });

  return (
    <FormItem labelStyle={{ display: 'none' }}>
      <Popover
        content={
          <div style={{ width: '100%', height: '100%', minWidth: 500 }}>
            <div ref={containerRef}>{modifiedChildren}</div>
          </div>
        }
        trigger="click"
        placement={'bottomLeft'}
        overlayClassName={css`
          padding-top: 0;
          .ant-popover-arrow {
            display: none;
          }
        `}
      >
        <span>
          <span style={{ display: 'inline', float: 'left', cursor: 'pointer' }}>
            <EditOutlined style={{ margin: '0 8px', color: !field.valid ? 'red' : null }} />
          </span>
          <FormContext.Provider value={form}>
            <RecursionField schema={schema} name={fieldSchema.name} />
          </FormContext.Provider>
          <div style={{ clear: 'both' }}></div>
        </span>
      </Popover>
    </FormItem>
  );
});
