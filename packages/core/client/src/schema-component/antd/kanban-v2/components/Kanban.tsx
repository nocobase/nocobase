import { css, cx } from '@emotion/css';
import { createForm } from '@formily/core';
import { RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { message } from 'antd';
import React, { SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { Column } from './Column';
import { ActionContext } from '../../';
import { RecordProvider } from '../../../../record-provider';

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

/**
 * Moves an item from one list to another list.
 */
const move = (source, destination, droppableSource, droppableDestination) => {
  console.log(source, destination, droppableSource, droppableDestination)
  const sourceClone = Array.from(source);
  const destClone = Array.from(destination);
  const [removed] = sourceClone.splice(droppableSource.index, 1);

  destClone.splice(droppableDestination.index, 0, removed);

  const result = {};
  result[droppableSource.droppableId] = sourceClone;
  result[droppableDestination.droppableId] = destClone;

  return result;
};
const KanbanRecordViewer = (props) => {
  const { visible, setVisible, record } = props;
  const form = useMemo(() => createForm(), [record]);
  const field = useField();
  const fieldSchema = useFieldSchema();
  const eventSchema: Schema = fieldSchema.properties.cardViewer;
  const close = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    eventSchema && (
      <ActionContext.Provider
        value={{
          openMode: fieldSchema['x-component-props']?.['openMode'] || 'drawer',
          openSize: fieldSchema['x-component-props']?.['openSize'],
          visible,
          setVisible,
        }}
      >
        <RecordProvider record={record}>
          <RecursionField
            basePath={field.address}
            schema={fieldSchema.properties.cardViewerSchema}
            onlyRenderProperties
          />
        </RecordProvider>
      </ActionContext.Provider>
    )
  );
};
export const KanbanV2: any = (props) => {
  const { useProps } = props;
  const { columns } = useProps();
  console.log(columns);
  const field = useField();
  const [columnData, setColumnData] = useState(columns);
  console.log(columnData)
  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState<any>({});

  const onDragEnd = (result) => {
    const { source, destination } = result;
     console.log(result)
    // dropped outside the list
    if (!destination) {
      return;
    }
    const sInd = +source.droppableId;
    const dInd = +destination.droppableId;

    if (sInd === dInd) {
      const items = reorder(columnData[sInd], source.index, destination.index);
      const newState: any = [...columnData];
      newState[sInd] = items;
      setColumnData(newState);
    } else {
      console.log(sInd)
      console.log(dInd)
      const result = move(columnData[sInd], columnData[dInd], source, destination);
      console.log(result)
      const newState = [...columnData];
      console.log(newState)
      // newState[sInd] = result[sInd];
      // newState[dInd] = result[dInd];
      console.log(newState.filter((group) => group.length))
      // setColumnData(newState.filter((group) => group.length));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex' }}>
        <DragDropContext onDragEnd={onDragEnd}>
          {columnData.map((el, ind) => (
            <Column key={ind} el={el} ind={ind} setState={setColumnData} />
          ))}
          <KanbanRecordViewer visible={visible} setVisible={setVisible} record={record} />
        </DragDropContext>
      </div>
    </div>
  );
};
