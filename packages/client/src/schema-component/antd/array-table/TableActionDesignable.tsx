import { observer, useFieldSchema } from '@formily/react';
import React from 'react';
import { createDesignable, useDesignable } from '../..';
import { useAPIClient } from '../../../api-client';

export const TableActionDesignable = observer((props) => {
  const fieldSchema = useFieldSchema();
  const api = useAPIClient();
  const { refresh } = useDesignable();
  return (
    <div>
      <span
        onClick={() => {
          const spaceSchema = fieldSchema.reduceProperties((buf, schema) => {
            if (schema['x-component'] === 'Space') {
              return schema;
            }
            return buf;
          }, null);
          const dn = createDesignable({
            current: spaceSchema,
            refresh,
            api,
          });
          dn.loadAPIClientEvents();
          dn.insertBeforeEnd({
            type: 'void',
            title: '{{ t("Delete") }}',
            'x-component': 'Action.Link',
            'x-component-props': {
              useAction: '{{ useDestroyAction }}',
            },
          });
        }}
      >
        Edit
      </span>
      {props.children}
    </div>
  );
});
