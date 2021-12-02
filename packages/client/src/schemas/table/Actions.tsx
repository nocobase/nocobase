import React from 'react';
import { Space } from 'antd';
import { RecursionField } from '@formily/react';
import { useDesignable } from '..';
import { Droppable, SortableItem } from '../../components/Sortable';
import { getSchemaPath } from '../../components/schema-renderer';

export const Actions = (props: any) => {
  const { align = 'left' } = props;
  const { schema, designable } = useDesignable();
  return (
    <Droppable
      id={`${schema.name}-${align}`}
      className={`action-bar-align-${align}`}
      data={{ align, path: getSchemaPath(schema) }}
    >
      <Space>
        {schema.mapProperties((s) => {
          const currentAlign = s['x-align'] || 'left';
          if (currentAlign !== align) {
            return null;
          }
          return (
            <SortableItem
              id={s.name}
              data={{
                align,
                draggable: true,
                title: s.title,
                path: getSchemaPath(s),
              }}
            >
              <RecursionField name={s.name} schema={s} />
            </SortableItem>
          );
        })}
      </Space>
    </Droppable>
  );
};
