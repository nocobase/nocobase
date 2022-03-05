import { VoidField } from '@formily/core';
import { observer, Schema, useField, useFieldSchema } from '@formily/react';
import React, { useState } from 'react';
import { SchemaComponent } from '../..';
import { AsyncDataProvider, useRequest } from '../../../';
import { Board } from '../../../board';
import { CardContext } from './context';
import { KanbanCard } from './Kanban.Card';
import { KanbanCardDesigner } from './Kanban.Card.Designer';
import { KanbanCardAdder } from './Kanban.CardAdder';
import { KanbanCardViewer } from './Kanban.CardViewer';
import { KanbanDesigner } from './Kanban.Designer';
import { toGroupDataSource } from './utils';

const useRequestProps = (props) => {
  const { request, dataSource } = props;
  if (request) {
    return request;
  }
  return (params: any = {}) => {
    return Promise.resolve({
      data: dataSource,
    });
  };
};

const useDefDataSource = (options, props) => {
  return useRequest(useRequestProps(props), options);
};

export const Kanban: ComposedKanban = observer((props: any) => {
  const { useDataSource = useDefDataSource, groupField, ...restProps } = props;
  const field = useField<VoidField>();
  const fieldSchema = useFieldSchema();
  const [dataSource, setDataSource] = useState<IDataSource>({ columns: [] });
  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState<any>({});
  const result = useDataSource(
    {
      uid: fieldSchema['x-uid'],
      refreshDeps: [props.dataSource],
      onSuccess({ data }) {
        const ds = toGroupDataSource(groupField, data);
        setDataSource(ds);
      },
    },
    props,
  );
  const cardSchema: Schema = fieldSchema.reduceProperties((buf, current) => {
    if (current['x-component'] === 'Kanban.Card') {
      return current;
    }
    return buf;
  }, null);
  return (
    <AsyncDataProvider value={result}>
      <Board
        renderCard={(card, column, dragging) => {
          return (
            <CardContext.Provider value={{ card, column, dragging }}>
              <SchemaComponent memoized name={cardSchema.name} schema={cardSchema as any} />
            </CardContext.Provider>
          );
        }}
        {...restProps}
      >
        {dataSource}
      </Board>
    </AsyncDataProvider>
  );
});

Kanban.Card = KanbanCard;

Kanban.CardAdder = KanbanCardAdder;

Kanban.CardViewer = KanbanCardViewer;

Kanban.Card.Designer = KanbanCardDesigner;

Kanban.Designer = KanbanDesigner;
