import { css, cx } from '@emotion/css';
import { createForm } from '@formily/core';
import { RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { Tag } from 'antd';
import React, { SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { Column } from './Column';
import { useKanbanV2BlockContext, useCollection, useBlockRequestContext } from '../../../../';
import { ActionContext } from '../../';
import { RecordProvider } from '../../../../record-provider';
import { isAssocField } from '../../../../filter-provider/utils';

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

const ColumnHeader = ({ color, label }) => {
  return (
    <div
      className={'react-kanban-column-header'}
      style={{ background: '#f9f9f9', padding: '8px', width: '300px', margin: '5px', marginBottom: '0px' }}
    >
      <Tag color={color}>{label}</Tag>
    </div>
  );
};
export const KanbanV2: any = (props) => {
  const { useProps } = props;
  const { columns, groupField } = useProps();
  const field = useField();
  const { associateCollectionField } = useKanbanV2BlockContext();
  const [columnData, setColumnData] = useState(columns);
  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState<any>({});
  const isAssociationField = isAssocField(groupField);
  const { resource, service } = useBlockRequestContext();
  useEffect(() => {
    columns.map((v, index) => {
      getColumnDatas(v, index);
    });
  }, [groupField]);

  const getColumnDatas = (el, index) => {
    if (el.value !== '__unknown__') {
      const filter = isAssociationField
        ? {
            $and: [{ [groupField.name]: { [associateCollectionField[1]]: { $eq: el.value } } }],
          }
        : {
            $and: [{ [groupField.name]: { $eq: el.value } }],
          };

      resource
        .list({
          ...service.params?.[0],
          filter: filter,
        })
        .then(({ data }) => {
          if (data) {
            const newState: any = [...columnData];
            const newColumn = columnData.find((v) => v.value === el.value);
            newColumn.cards = data.data;
            newState[index] = newColumn;
            setColumnData(newState);
          }
        });
    }
  };
  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) {
      return;
    }
    const sInd = source.droppableId;
    const dInd = destination.droppableId;
    if (sInd === dInd) {
      // same column
      const items = reorder(columnData.find((v) => v.value === sInd).cards, source.index, destination.index);
      const newColumn = columnData.find((v) => v.value === sInd);
      const index = columnData.findIndex((v) => v.value === sInd);
      const newState: any = [...columnData];
      newState[index] = { ...newColumn, cards: items };
      setColumnData(newState);
      handleCardDragEndSave(
        { fromColumnId: source.droppableId, fromPosition: source.index },
        { toColumnId: destination.droppableId, toPosition: destination.index },
      );
    } else {
      const result = move(
        columnData.find((v) => v.value === sInd).cards,
        columnData.find((v) => v.value === dInd).cards,
        source,
        destination,
      );
      const newState = [...columnData];
      const sColumns = columnData.find((v) => v.value === sInd);
      const sIndex = columnData.findIndex((v) => v.value === sInd);
      const dColumns = columnData.find((v) => v.value === dInd);
      const dIndex = columnData.findIndex((v) => v.value === dInd);
      newState[sIndex] = { ...sColumns, cards: result[sInd] };
      newState[dIndex] = { ...dColumns, cards: result[dInd] };
      setColumnData(newState.filter((group) => group.cards.length));
      handleCardDragEndSave(
        { fromColumnId: source.droppableId, fromPosition: source.index },
        { toColumnId: destination.droppableId, toPosition: destination.index },
      );
    }
  };

  const handleCardDragEndSave = async ({ fromColumnId, fromPosition }, { toColumnId, toPosition }) => {
    const sourceColumn = columns.find((column) => column.value === fromColumnId);
    const destinationColumn = columns.find((column) => column.value === toColumnId);
    const sourceCard = sourceColumn?.cards?.[fromPosition];
    const targetCard = destinationColumn?.cards?.[toPosition];
    const values = {
      sourceId: sourceCard.id,
      sortField: `${groupField.name}_sort`,
    };
    if (targetCard) {
      values['targetId'] = targetCard.id;
    } else {
      values['targetScope'] = {
        [groupField.name]: toColumnId,
      };
    }
    await resource.move(values);
  };
  return (
    <div>
      <div style={{ display: 'flex' }}>
        <DragDropContext onDragEnd={onDragEnd}>
          {columnData.map((el, ind) => (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <ColumnHeader {...el} />
              {el.cards && <Column key={ind} data={el} ind={ind} />}
            </div>
          ))}
          <KanbanRecordViewer visible={visible} setVisible={setVisible} record={record} />
        </DragDropContext>
      </div>
    </div>
  );
};
