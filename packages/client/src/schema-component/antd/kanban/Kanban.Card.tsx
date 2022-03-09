import { observer, RecursionField, useFieldSchema } from '@formily/react';
import { Card } from 'antd';
import React, { useContext, useState } from 'react';
import { ActionContext, BlockItem } from '..';
import { RecordProvider } from '../../../record-provider';
import { SchemaComponentOptions } from '../../core/SchemaComponentOptions';
import { KanbanCardContext } from './context';

const FormItem = observer((props) => {
  return <BlockItem {...props} />;
});

export const KanbanCard: any = observer((props: any) => {
  const { cardViewerSchema, card, cardField, columnIndex, cardIndex } = useContext(KanbanCardContext);
  const fieldSchema = useFieldSchema();
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Card
        onClick={(e) => {
          setVisible(true);
        }}
        bordered={false}
        hoverable
        style={{ width: 280, margin: '0 10px 10px 10px', cursor: 'pointer' }}
      >
        <SchemaComponentOptions components={{}}>
          <RecursionField
            basePath={cardField.address.concat(`${columnIndex}.cards.${cardIndex}`)}
            schema={fieldSchema}
            onlyRenderProperties
          />
        </SchemaComponentOptions>
      </Card>
      {cardViewerSchema && (
        <ActionContext.Provider value={{ openMode: 'drawer', visible, setVisible }}>
          <RecordProvider record={card}>
            <RecursionField name={cardViewerSchema.name} schema={cardViewerSchema} onlyRenderProperties />
          </RecordProvider>
        </ActionContext.Provider>
      )}
    </>
  );
});
