import { FormOutlined } from '@ant-design/icons';
import { ISchema, observer } from '@formily/react';
import { uid } from '@formily/shared';
import React from 'react';
import { SchemaInitializer } from '../..';

const gridRowColWrap = (schema: ISchema) => {
  return {
    type: 'void',
    'x-component': 'Grid.Row',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Grid.Col',
        properties: {
          [schema.name || uid()]: schema,
        },
      },
    },
  };
};

const itemWrap = SchemaInitializer.itemWrap;

const FormBlock = itemWrap((props) => {
  const { insert } = props;
  return (
    <SchemaInitializer.Item
      icon={<FormOutlined />}
      onClick={() => {
        insert({});
      }}
    />
  );
});

export const RecordBlockInitializer = observer((props: any) => {
  return (
    <SchemaInitializer.Button
      wrap={gridRowColWrap}
      insertPosition={'beforeEnd'}
      items={[
        {
          type: 'itemGroup',
          title: 'Data blocks',
          children: [
            {
              type: 'item',
              title: 'Form',
              component: FormBlock,
            },
            {
              type: 'item',
              title: 'Details',
              component: FormBlock,
            },
          ],
        },
      ]}
    >
      Add block
    </SchemaInitializer.Button>
  );
});
