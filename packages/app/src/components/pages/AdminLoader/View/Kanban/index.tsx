import React, { useState } from 'react';
import { useRequest, useHistory } from 'umi';
import api from '@/api-client';
import { Descriptions, Popconfirm, Card, Button } from 'antd';
import Board, { moveCard } from '@lourenci/react-kanban';
import '@lourenci/react-kanban/dist/styles.css';
import { PlusOutlined, CloseOutlined, RightOutlined } from '@ant-design/icons';
import Drawer from '@/components/pages/AdminLoader/Drawer';
import { Actions, Create, Destroy } from '../../Actions';
import get from 'lodash/get';
import filter from 'lodash/filter';
import Field from '@/components/views/Field';
import { Details, DetailsPage } from '../Table';
import merge from 'lodash/merge';
import { Spin } from '@nocobase/client';
import './style.less';

export function Kanban(props: any) {
  const { defaultFilter, associatedKey, schema = {} } = props;
  const {
    filter: schemaFilter,
    sort,
    appends,
    groupField = {},
    resourceName,
    createViewName = 'form',
    disableCardDrag = false,
    // allowAddCard = false,
    // allowRemoveCard = false,
    labelField,
    actions = [],
    fields = [],
    detailsOpenMode,
    details = [],
    rowKey = 'id',
  } = schema;
  const { dataSource = [] } = groupField;
  console.log({ groupField, dataSource });

  const paginated = false;

  const history = useHistory();

  const { data, loading, mutate, refresh, run, params } = useRequest(
    (params = {}, ...args) => {
      const { current, pageSize, sorter, filter, ...restParams } = params;
      console.log('paramsparamsparamsparamsparams', params, args);
      return api
        .resource(resourceName)
        .list({
          associatedKey,
          page: paginated ? current : 1,
          perPage: paginated ? pageSize : -1,
          sorter,
          sort: [`${groupField.name}_sort`],
          'fields[appends]': appends,
          // filter,
          // ...actionDefaultParams,
          filter: {
            and: [
              defaultFilter,
              schemaFilter,
              filter,
              // __parent ? {
              //   collection_name: __parent,
              // } : null,
            ].filter(obj => obj && Object.keys(obj).length),
          },
          // ...args2,
        })
        .then(({ data = [], meta = {} }) => {
          return {
            data: {
              list: data,
              total: meta.count || data.length,
            },
          };
        });
    },
    {
      paginated,
    },
  );

  if (loading) {
    return <Spin />;
  }

  const columns = dataSource.map(group => {
    return {
      id: group.value,
      title: group.label,
      cards: filter(data?.list, item => {
        return get(item, groupField.name) === group.value;
      }),
    };
  });
  console.log({ columns });

  const bodyStyle: any = {};

  if (fields.length === 0) {
    bodyStyle.padding = 0;
  }

  const createAction = actions.find(action => {
    return action.type === 'create';
  });

  let allowAddCard = !!props.allowAddCard;

  if (createAction) {
    allowAddCard = true;
  }

  let allowRemoveCard = !!props.allowRemoveCard;
  const destroyAction = actions.find(action => {
    return action.type === 'destroy';
  });
  if (destroyAction) {
    allowRemoveCard = true;
  }

  return (
    <div className={'noco-kanban-view'}>
      <Actions
        associatedKey={associatedKey}
        style={{ marginBottom: 14 }}
        actions={actions.filter(
          action => !['create', 'destroy'].includes(action.type),
        )}
        onTrigger={{
          async filter(values) {
            const items = values.filter.and || values.filter.or;
            // @ts-ignore
            run({ ...params[0], filter: values.filter });
            // refresh();
          },
        }}
      />
      <Board
        allowRemoveLane
        allowRenameColumn
        allowRemoveCard={allowRemoveCard}
        disableColumnDrag
        disableCardDrag={disableCardDrag}
        onLaneRemove={console.log}
        renderCard={(data, { dragging, removeCard }) => {
          const openDetails = e => {
            if (!detailsOpenMode || !details.length) {
              return;
            }
            if (detailsOpenMode === 'window') {
              const paths = history.location.pathname.split('/');
              history.push(`/admin/${paths[2]}/${data[rowKey]}/0`);
            } else {
              Drawer.open({
                headerStyle:
                  details.length > 1
                    ? {
                        paddingBottom: 0,
                        borderBottom: 0,
                        // paddingTop: 16,
                        // marginBottom: -4,
                      }
                    : {},
                title: data[labelField],
                content: ({ resolve, closeWithConfirm }) => (
                  <div>
                    <Details
                      associatedKey={associatedKey}
                      resourceName={resourceName}
                      onFinish={async () => {
                        await refresh();
                        resolve();
                      }}
                      onValueChange={() => {
                        closeWithConfirm && closeWithConfirm(true);
                      }}
                      onDraft={async () => {
                        await refresh();
                        resolve();
                      }}
                      onReset={resolve}
                      onDataChange={async () => {
                        await refresh();
                      }}
                      data={data}
                      resolve={resolve}
                      items={details}
                    />
                  </div>
                ),
              });
            }
          };
          return (
            <Card
              hoverable
              size={'small'}
              style={{
                background: '#fff',
                minWidth: 250,
                maxWidth: 250,
                marginBottom: 12,
              }}
              bordered={false}
              title={<div onClick={openDetails}>{data[labelField]}</div>}
              bodyStyle={bodyStyle}
              extra={
                allowRemoveCard && (
                  <Destroy
                    schema={merge(destroyAction, {
                      title: null,
                      componentProps: {
                        danger: false,
                        type: 'text',
                        size: 'small',
                      },
                    })}
                    onFinish={async () => {
                      await api.resource(resourceName).destroy({
                        associatedKey,
                        filter: {
                          [`${rowKey}.in`]: [data[rowKey]],
                        },
                      });
                      await refresh();
                    }}
                  />
                )
              }
            >
              <div onClick={openDetails}>
                {fields.length > 0 && (
                  <Descriptions column={1} size={'small'} layout={'vertical'}>
                    {fields.map((field: any) => {
                      return (
                        <Descriptions.Item label={field.title || field.name}>
                          <Field
                            data={data}
                            viewType={'descriptions'}
                            schema={field}
                            value={get(data, field.name)}
                          />
                        </Descriptions.Item>
                      );
                    })}
                  </Descriptions>
                )}
              </div>
            </Card>
          );
        }}
        onCardDragEnd={async ({ columns }, card, source, destination) => {
          await api.resource(resourceName).update({
            associatedKey,
            resourceKey: card[rowKey],
            values: {
              [groupField.name]: destination.toColumnId,
            },
          });
          const destColumn = columns.find(
            column => column.id === destination.toColumnId,
          );
          const targetIndex = get(destColumn, [
            'cards',
            destination.toPosition + 1,
            rowKey,
          ]);
          console.log({ targetIndex, card, destination });
          await api.resource(resourceName).sort({
            associatedKey,
            resourceKey: card[rowKey],
            values: {
              field: `${groupField.name}_sort`,
              sticky: destination.toPosition === 0,
              target: {
                [rowKey]: targetIndex,
              },
            },
          });
        }}
        initialBoard={{ columns }}
        // allowAddCard={{ on: "bottom" }}
        allowAddCard={false}
        // onNewCardConfirm={draftCard => ({
        //   id: new Date().getTime(),
        //   ...draftCard
        // })}
        renderColumnHeader={({ title, id }, { addCard }) => {
          return (
            <>
              <div className="react-kanban-column-header">
                <span>{title}</span>
              </div>
              {allowAddCard && (
                <Create
                  onFinish={(values: any) => {
                    refresh();
                  }}
                  initialValues={{
                    [groupField.name]: id,
                  }}
                  schema={merge(createAction, {
                    title: null,
                    pageTitle: '新增',
                    componentProps: {
                      type: 'text',
                      block: true,
                      className: 'noco-card-adder-button',
                      style: {
                        marginBottom: 10,
                        border: 0,
                        background: '#fff',
                      },
                    },
                  })}
                />
              )}
            </>
          );
        }}
        onCardNew={console.log}
      />
    </div>
  );
}
