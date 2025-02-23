/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DeleteOutlined, LeftOutlined, PlusOutlined } from '@ant-design/icons';
import { FormLayout } from '@formily/antd-v5';
import { createForm } from '@formily/core';
import { observer } from '@formily/react';

import {
  css,
  SchemaComponent,
  useEventFlowByRouteKey,
  useEventFlowManager,
  useFlowActionsByGroup,
  useFlowEventsByGroup,
  useToken,
} from '@nocobase/client';
import { Button, Card, Drawer, Dropdown, Input, Popconfirm, Space, Switch, Tag, Typography } from 'antd';
import React, { useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventFlowContext, useGetContainer } from './EventFlowProvider';

export const EventFlowConfig = observer((props) => {
  const { token } = useToken();
  const navigate = useNavigate();
  const eventFlow = useEventFlowByRouteKey();
  const eventFlowManager = useEventFlowManager();

  return (
    <div>
      <Card
        title={
          <Space size={8}>
            <LeftOutlined
              onClick={() => {
                navigate('/');
              }}
            />
            <Typography.Title level={5} style={{ margin: '8px 0' }}>
              <Input
                value={eventFlow.get('title')}
                placeholder="Untitled"
                onChange={(e) => {
                  eventFlow.set('title', e.target.value);
                  const flow = eventFlowManager.addFlow(eventFlow);
                  flow.save();
                }}
                className={css`
                  border-color: #fff;
                  font-weight: 500;
                  width: 300px;
                  background-color: rgba(0, 0, 0, 0.04);
                `}
              />
            </Typography.Title>
          </Space>
        }
        bordered={false}
        headStyle={{ paddingLeft: 0, paddingRight: 0 }}
        style={{
          position: 'inherit',
          boxShadow: 'none',
          marginLeft: token.marginBlock,
          marginRight: token.marginBlock,
        }}
        bodyStyle={{
          paddingTop: '3em',
        }}
        extra={
          <Space>
            <Switch />
            <DeleteOutlined
              style={{ marginLeft: 8 }}
              onClick={() => {
                eventFlow.remove();
                navigate('/');
              }}
            />
          </Space>
        }
      >
        {eventFlow.isNew || !eventFlow.on?.event ? <AddTriggerButton eventFlow={eventFlow} /> : <EditFlow />}
      </Card>
    </div>
  );
});

const AddTriggerButton = observer((props: any) => {
  const eventFlow = props.eventFlow;
  const items = useFlowEventsByGroup();
  const eventFlowManager = useEventFlowManager();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<any>({});
  const navigate = useNavigate();
  const currentEvent = useMemo(() => {
    return eventFlowManager.getEvent(data.event);
  }, [data.event, eventFlowManager]);

  return (
    <>
      <Dropdown
        menu={{
          items,
          onClick: async (info) => {
            eventFlow.set('on', {
              event: info.key,
              title: info.key,
            });
            const flow = eventFlowManager.addFlow(eventFlow);
            await flow.save();
            navigate(`/eventflow/${flow.key}`);
          },
        }}
      >
        <Card
          className={css`
            width: 200px;
            margin: 0 auto;
            border: 1px dashed #ffadd2;
            background: #fff0f6;
            position: relative;
            z-index: 2;
            text-align: center;
            cursor: pointer;
          `}
        >
          <span>
            <PlusOutlined /> Add event
          </span>
        </Card>
      </Dropdown>
    </>
  );
});

const EditFlow = observer(() => {
  const eventFlow = useEventFlowByRouteKey();
  return (
    <>
      <TriggerCard />
      {eventFlow.eachStep((step) => {
        return <ActionCard step={step} key={step.options.key} />;
      })}
      <AddActionButton showArrow={false} />
      <EndButton />
    </>
  );
});

const TriggerCard = observer(() => {
  const [open, setOpen] = useState(false);
  const getContainer = useGetContainer();
  const eventFlow = useEventFlowByRouteKey();
  const eventFlowManager = useEventFlowManager();
  const currentEvent = useMemo(() => {
    return eventFlowManager.getEvent(eventFlow.on.event);
  }, [eventFlow.on.event, eventFlowManager]);
  const form = useMemo(
    () =>
      createForm({
        initialValues: eventFlow.on,
      }),
    [eventFlow.on],
  );
  return (
    <>
      <Card
        onClick={() => {
          setOpen(true);
        }}
        className={css`
          cursor: pointer;
          width: 200px;
          margin: 0 auto;
          border: 1px solid #ffadd2;
          background: #fff0f6;
          position: relative;
          z-index: 2;
          &:hover {
            .anticon-delete {
              display: block;
            }
          }
        `}
      >
        <Popconfirm
          getPopupContainer={getContainer}
          getTooltipContainer={getContainer}
          title="Delete the event"
          description="Are you sure to delete this event?"
          // onConfirm={confirm}
          // onCancel={cancel}
          okText="Yes"
          cancelText="No"
          onPopupClick={(e) => e.stopPropagation()}
        >
          <DeleteOutlined
            onClick={(e) => e.stopPropagation()}
            className={css`
              display: none;
              position: absolute;
              right: 16px;
              cursor: pointer;
            `}
          />
        </Popconfirm>
        <Space direction="vertical" size={'middle'}>
          <Tag color="magenta">{eventFlow.on.event}</Tag>
          <Input
            onClick={(e) => {
              e.stopPropagation();
            }}
            value={eventFlow.get('on.title')}
            onChange={(e) => {
              eventFlow.set('on.title', e.target.value);
            }}
            placeholder="Filled"
            className={css`
              border-color: transparent;
              background-color: rgba(0, 0, 0, 0.04);
              font-weight: 500;
            `}
            width={'auto'}
          />
        </Space>
      </Card>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        getContainer={false}
        placement="bottom"
        height={'90vh'}
        styles={{
          header: {
            padding: `0 16px`,
          },
        }}
        extra={
          <Button
            type="primary"
            onClick={async () => {
              eventFlow.set('on', form.values);
              setOpen(false);
            }}
          >
            Save
          </Button>
        }
        title={
          <Typography.Title level={5} style={{ margin: '8px 0' }}>
            <Input
              placeholder="Untitled"
              className={css`
                border-color: #fff;
                font-weight: 500;
                width: 300px;
                background-color: rgba(0, 0, 0, 0.04);
              `}
              value={eventFlow.get('on.title')}
              onChange={(e) => {
                eventFlow.set('on.title', e.target.value);
              }}
            />
          </Typography.Title>
        }
      >
        <SchemaComponent
          components={{ FormLayout }}
          schema={{
            name: eventFlow.key,
            type: 'void',
            'x-component': 'FormV2',
            'x-component-props': {
              form,
            },
            properties: {
              layout: {
                type: 'void',
                'x-component': 'FormLayout',
                'x-component-props': {
                  layout: 'vertical',
                },
                properties: currentEvent?.uiSchema,
              },
            },
          }}
        />
      </Drawer>
    </>
  );
});

const ActionCard = observer((props: any) => {
  const { step } = props;
  const getContainer = useGetContainer();
  const eventFlow = useEventFlowByRouteKey();
  const eventFlowManager = useEventFlowManager();
  const [open, setOpen] = useState(false);
  const currentAction = useMemo(() => {
    return eventFlowManager.getAction(step.action);
  }, [step, eventFlowManager]);
  const form = useMemo(
    () =>
      createForm({
        initialValues: step.options,
      }),
    [step],
  );
  return (
    <>
      <AddActionButton />
      <Card
        onClick={() => {
          setOpen(true);
        }}
        className={css`
          cursor: pointer;
          width: 200px;
          margin: 0 auto;
          border: 1px solid #87e8de;
          background: #e6fffb;
          position: relative;
          z-index: 2;
          &:hover {
            .anticon-delete {
              display: block;
            }
          }
        `}
      >
        <Popconfirm
          getPopupContainer={getContainer}
          getTooltipContainer={getContainer}
          title="Delete the action"
          description="Are you sure to delete this action?"
          // onConfirm={confirm}
          // onCancel={cancel}
          okText="Yes"
          cancelText="No"
          onPopupClick={(e) => {
            e.stopPropagation();
            eventFlow.removeStep(step.key);
          }}
        >
          <DeleteOutlined
            onClick={(e) => {
              e.stopPropagation();
            }}
            className={css`
              display: none;
              position: absolute;
              right: 16px;
              cursor: pointer;
            `}
          />
        </Popconfirm>
        <Space direction="vertical" size={'middle'}>
          <Tag color="cyan">{currentAction.title}</Tag>
          <Input
            value={step.title}
            placeholder="Filled"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className={css`
              border-color: transparent;
              background-color: rgba(0, 0, 0, 0.04);
              font-weight: 500;
            `}
            width={'auto'}
            onChange={(e) => {
              step.set('title', e.target.value);
            }}
          />
        </Space>
      </Card>
      <Drawer
        open={open}
        onClose={async () => {
          setOpen(false);
        }}
        getContainer={false}
        placement="bottom"
        height={'90vh'}
        styles={{
          header: {
            padding: `0 16px`,
          },
        }}
        extra={
          <Button
            type="primary"
            onClick={async () => {
              await form.submit();
              step.set(form.values);
              step.save();
              setOpen(false);
            }}
          >
            Save
          </Button>
        }
        title={
          <Typography.Title level={5} style={{ margin: '8px 0' }}>
            <Input
              placeholder="Untitled"
              className={css`
                border-color: #fff;
                font-weight: 500;
                width: 300px;
                background-color: rgba(0, 0, 0, 0.04);
              `}
              value={step.title}
              onChange={(e) => {
                step.set('title', e.target.value);
              }}
            />
          </Typography.Title>
        }
      >
        <SchemaComponent
          components={{ FormLayout }}
          schema={{
            type: 'void',
            name: 'form',
            'x-component': 'FormV2',
            'x-component-props': {
              form,
            },
            properties: {
              layout: {
                type: 'void',
                'x-component': 'FormLayout',
                'x-component-props': {
                  layout: 'vertical',
                },
                properties: currentAction?.uiSchema,
              },
            },
          }}
        />
      </Drawer>
    </>
  );
});

function EndButton() {
  return (
    <div
      className={css`
        width: 4em;
        height: 4em;
        line-height: 4em;
        border-radius: 50%;
        background: #000;
        color: #fff;
        text-align: center;
        margin: 0 auto;
      `}
    >
      End
    </div>
  );
}

const AddActionButton = observer((props: any) => {
  const { showArrow } = props;
  const items = useFlowActionsByGroup();
  const eventFlow = useEventFlowByRouteKey();
  const eventFlowManager = useEventFlowManager();
  const [open, setOpen] = useState(false);
  const { currentRef } = useContext(EventFlowContext);

  return (
    <div
      className={css`
        padding: 1em;
        position: relative;
        z-index: 2;
      `}
    >
      <div
        className={
          showArrow !== false
            ? css`
                &:before {
                  content: '';
                  position: absolute;
                  top: 0;
                  bottom: 0;
                  width: 1px;
                  background-color: #d9d9d9;
                  left: 50%;
                  margin-left: -1px;
                  z-index: 0;
                }
                &:after {
                  content: '';
                  display: block;
                  position: absolute;
                  bottom: 0.1em;
                  left: calc(50% - 0.25em);
                  width: 0.5em;
                  height: 0.5em;
                  border: 1px solid #d9d9d9;
                  border-width: 0 1px 1px 0;
                  -webkit-transform: rotate(45deg);
                  -moz-transform: rotate(45deg);
                  -ms-transform: rotate(45deg);
                  transform: rotate(45deg);
                }
              `
            : css`
                &:before {
                  content: '';
                  position: absolute;
                  top: 0;
                  bottom: 0;
                  width: 1px;
                  background-color: #d9d9d9;
                  left: 50%;
                  margin-left: -1px;
                  z-index: 0;
                }
              `
        }
      ></div>
      <Dropdown
        placement={'bottomRight'}
        menu={{
          items,
          onClick: (info) => {
            eventFlow.addStep({
              action: info.key,
              title: info.key,
            });
          },
        }}
      >
        <PlusOutlined
          className={css`
            cursor: pointer;
            position: relative;
            z-index: 2;
            margin: 0 auto;
            display: block;
            background: #fafafa;
            width: 20px;
            height: 20px;
            line-height: 22px;
            padding: 0;
            border-radius: 100%;
            border: 1px solid #d9d9d9;
          `}
        />
      </Dropdown>
    </div>
  );
});
