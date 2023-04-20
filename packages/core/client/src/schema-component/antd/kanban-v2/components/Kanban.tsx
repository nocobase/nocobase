import { cx } from '@emotion/css';
import { RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { Tag, message } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { useTranslation } from 'react-i18next';
import { Column } from './Column';
import { useKanbanV2BlockContext, useBlockRequestContext } from '../../../../';
import { mergeFilter } from '../../../../block-provider/SharedFilterProvider';
import { ActionContext } from '../../';
import { RecordProvider } from '../../../../record-provider';
import { isAssocField } from '../../../../filter-provider/utils';
import { diffObjects } from '../utitls';
import { loadMoreButton } from '../style';

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
  const field = useField();
  const fieldSchema = useFieldSchema();
  const eventSchema: Schema = fieldSchema.properties.cardViewer;

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
          <RecursionField basePath={field.address} schema={eventSchema} onlyRenderProperties />
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
  const { groupField, columns } = useProps();
  const {
    associateCollectionField,
    params: { appends },
  } = useKanbanV2BlockContext();
  const [columnData, setColumnData] = useState(cloneDeep(columns));
  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState<any>({});
  const isAssociationField = isAssocField(groupField);
  const { resource, service } = useBlockRequestContext();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const params = service?.params?.[0] || {};

  useEffect(() => {
    columnData.map((v, index) => {
      getColumnDatas(v, index, params, appends, 1);
    });
  }, [groupField, params, appends]);

  const getColumnDatas = React.useCallback(async (el, index, params, appends?, currentPage?) => {
    const filter = diffObjects(params.filter['$and'][0], service.params[0].filter['$and'][0]);
    const newState: any = [...columnData];
    const newColumn = columnData.find((v) => v.value === el.value) || { ...el };
    const page = currentPage || 1;
    const defaultfilter = isAssociationField
      ? {
          $and: [{ [groupField.name]: { [associateCollectionField[1]]: { $eq: el.value } } }],
        }
      : {
          $and: [{ [groupField.name]: { $eq: el.value } }],
        };

    resource
      .list({
        ...params,
        appends,
        page: page,
        filter:
          el.value !== '__unknown__'
            ? mergeFilter([defaultfilter, fieldSchema.parent['x-decorator-props']?.params?.filter, filter])
            : params.filter,
      })
      .then(({ data }) => {
        if (data) {
          if (page !== 1) {
            newColumn.cards = [...(newColumn?.cards || []), ...data.data];
            newColumn.meta = { ...(newColumn?.meta || {}), ...data.meta };
            newState[index] = newColumn;
            setColumnData(newState);
          } else {
            newColumn.cards = data.data;
            newColumn.meta = data.meta;
            newState[index] = newColumn;
            setColumnData(newState);
          }
        }
      });
  }, []);

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) {
      return;
    }
    const sInd = source.droppableId;
    const dInd = destination.droppableId;
    if (sInd === dInd) {
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
      setColumnData(newState);
      handleCardDragEndSave(
        { fromColumnId: source.droppableId, fromPosition: source.index },
        { toColumnId: destination.droppableId, toPosition: destination.index },
      );
    }
  };

  const handleCardDragEndSave = async ({ fromColumnId, fromPosition }, { toColumnId, toPosition }) => {
    const sourceColumn = columnData.find((column) => column.value === fromColumnId);
    const destinationColumn = columnData.find((column) => column.value === toColumnId);
    const sourceCard = sourceColumn?.cards?.[fromPosition];
    const targetCard = destinationColumn?.cards?.[toPosition];
    const values = {
      sourceId: sourceCard?.id,
      sortField:
        associateCollectionField.length > 1
          ? `${associateCollectionField[0]}_${associateCollectionField[1]}_sort`
          : `${groupField.name}_sort`,
    };
    values['targetId'] = targetCard?.id;
    associateCollectionField.length > 1
      ? (values['targetScope'] = {
          [`${associateCollectionField[0]}.${associateCollectionField[1]}`]: toColumnId !== '__unknown__' ? toColumnId : null,
        })
      : (values['targetScope'] = {
          state: toColumnId !== '__unknown__' ? toColumnId : null,
        });

    try {
      console.log(values);
      await resource.move(values);
      message.success(t('Saved successfully'));
    } catch (error) {}
  };
  const handleCardClick = React.useCallback((data) => {
    setVisible(true);
    setRecord(data);
  }, []);
  return (
    <div>
      <div style={{ display: 'flex', overflowX: 'auto' }}>
        <DragDropContext onDragEnd={onDragEnd}>
          {columnData.map((el, ind) => (
            <div
              key={`column_${ind}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 400,
                background: '#f9f9f9',
                marginRight: '10px',
              }}
            >
              <ColumnHeader {...el} />
              {el.cards && (
                <Column
                  // key={ind}
                  data={el}
                  ind={ind}
                  cards={el.cards}
                  onCardClick={handleCardClick}
                  getColumnDatas={getColumnDatas}
                />
              )}
              {el?.cards?.length < el?.meta?.count && (
                <a
                  className={cx(loadMoreButton)}
                  onClick={() => getColumnDatas(el, ind, params, appends, el?.meta?.page + 1)}
                >
                  {t('Load more')}
                </a>
              )}
            </div>
          ))}
          <KanbanRecordViewer visible={visible} setVisible={setVisible} record={record} />
        </DragDropContext>
      </div>
    </div>
  );
};
