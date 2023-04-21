import { cx } from '@emotion/css';
import { RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { Tag, message } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { useTranslation } from 'react-i18next';
import { Column } from './Column';
import { useKanbanV2BlockContext, useBlockRequestContext } from '../../../../';
import { mergeFilter } from '../../../../block-provider/SharedFilterProvider';
import { ActionContext } from '../../';
import { RecordProvider } from '../../../../record-provider';
import { isAssocField } from '../../../../filter-provider/utils';
import { loadMoreButton } from '../style';
import { move, reorder } from '../utilt';
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

  const getColumnDatas = React.useCallback(async (el, index, params, appends?, currentPage?) => {
    const parseFilter = (value) => {
      if (value === '__unknown__') {
        const defaultFilter = isAssociationField
          ? {
              $and: [{ [groupField.name]: { id: { $notExists: true } } }],
            }
          : {
              $and: [{ [groupField.name]: { $empty: true } }],
            };
        return mergeFilter([defaultFilter, fieldSchema.parent['x-decorator-props']?.params?.filter, params.filter]);
      } else {
        const defaultfilter = isAssociationField
          ? {
              $and: [{ [groupField.name]: { [associateCollectionField[1]]: { $eq: value } } }],
            }
          : {
              $and: [{ [groupField.name]: { $eq: value } }],
            };
        return mergeFilter([defaultfilter, fieldSchema.parent['x-decorator-props']?.params?.filter, params.filter]);
      }
    };
    const filter = parseFilter(el.value);
    const newState: any = [...columnData];
    const newColumn = columnData.find((v) => v.value === el.value) || { ...el };
    const page = currentPage || 1;
    const result = resource.list({
      ...params,
      appends,
      page: page,
      filter,
    });
    result.then(({ data }) => {
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
    return result;
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
    if (targetCard) {
      values['targetId'] = targetCard?.id;
    }
    values['targetScope'] = toColumnId !== '__unknown__' ? toColumnId : null;
    try {
      await resource.move({
        values: values,
      });
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
              <Column
                data={el}
                ind={ind}
                cards={el?.cards}
                onCardClick={handleCardClick}
                getColumnDatas={getColumnDatas}
              />
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
