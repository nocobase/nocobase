/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createStyles,
  Icon,
  useAPIClient,
  useApp,
  usePlugin,
  useRequest,
  useCollectionManager,
  useCompile,
} from '@nocobase/client';
import { Alert, Badge, Button, Empty, Modal, Popconfirm, Popover, Progress, Space, Table, Tag, Tooltip } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';

import { useCurrentAppInfo } from '@nocobase/client';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useT } from '../locale';
import { TASK_STATUS, TASK_STATUS_OPTIONS } from '../../common/constants';
import { TaskStatus } from '../../common/types';
import PluginAsyncTaskManagerClient from '..';

const useStyles = createStyles(({ token }) => {
  return {
    button: {
      // @ts-ignore
      color: token.colorTextHeaderMenu + ' !important',
    },
  };
});

// Configure dayjs
dayjs.extend(relativeTime);

const TaskResult = ({ record }) => {
  const t = useT();

  if (record.status !== TASK_STATUS.SUCCEEDED || !record.result?.message?.messageId) {
    return null;
  }

  const { messageId, messageValues } = record.result.message;

  return (
    <div style={{ marginLeft: 8 }}>
      <Tag color="success">{t(messageId, messageValues)}</Tag>
    </div>
  );
};

const AsyncTasksButton = (props) => {
  const { popoverVisible, setPopoverVisible, tasks, refresh, loading, hasProcessingTasks } = props;
  const api = useAPIClient();
  const t = useT();
  const { styles } = useStyles();
  const plugin = usePlugin<PluginAsyncTaskManagerClient>('async-task-manager');
  const cm = useCollectionManager();
  const compile = useCompile();
  const showTaskResult = (task) => {
    setPopoverVisible(false);
  };

  const columns = [
    {
      title: t('Created at'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (createdAt: string) => (
        <Tooltip title={dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss')}>{dayjs(createdAt).fromNow()}</Tooltip>
      ),
    },
    {
      title: t('Task'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: TaskStatus, record: any) => {
        const option = TASK_STATUS_OPTIONS[status] || ({} as (typeof TASK_STATUS_OPTIONS)[TaskStatus]);
        const { color, label } = option;

        const renderProgress = () => {
          const commonStyle = {
            width: 100,
            margin: 0,
          };

          switch (status) {
            case TASK_STATUS.PENDING:
              return <Alert showIcon={false} message={compile(label)} banner />;
            case TASK_STATUS.RUNNING:
              return (
                <Progress
                  type="line"
                  size="small"
                  strokeWidth={4}
                  percent={Number((((record.progressCurrent ?? 0) / (record.progressTotal ?? 1)) * 100).toFixed(2))}
                  status="active"
                  style={commonStyle}
                  format={(percent) => `${percent.toFixed(1)}%`}
                />
              );
            case TASK_STATUS.SUCCEEDED:
              return (
                <Progress
                  type="line"
                  size="small"
                  strokeWidth={4}
                  percent={100}
                  status="success"
                  style={commonStyle}
                  format={() => ''}
                />
              );
            case TASK_STATUS.FAILED:
              return (
                <Progress
                  type="line"
                  size="small"
                  strokeWidth={4}
                  percent={100}
                  status="exception"
                  style={commonStyle}
                  format={() => ''}
                />
              );
            default:
              return null;
          }
        };

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1 }}>{renderProgress()}</div>
            <Tag
              color={color}
              icon={option?.icon ? <Icon type={option.icon} /> : null}
              style={{ margin: 0, padding: '0 4px', height: 22, width: 22 }}
            />
            <TaskResult record={record} />
          </div>
        );
      },
    },
    {
      title: t('Actions'),
      key: 'actions',
      width: 180,
      render: (_, record: any) => {
        const actions = [];
        const stopping = false;
        const { Result, ResultButton } = plugin.taskOrigins.get(record.origin);

        if (record.cancelable && (record.status === TASK_STATUS.RUNNING || record.status === TASK_STATUS.PENDING)) {
          actions.push(
            <Popconfirm
              key="cancel"
              title={t('Confirm cancel')}
              description={t('Confirm cancel description')}
              onConfirm={async () => {
                await api.resource('asyncTasks').stop({
                  filterByTk: record.id,
                });
                refresh();
              }}
              okText={t('Confirm')}
              cancelText={t('Cancel')}
              disabled={stopping}
            >
              <Button
                type="link"
                size="small"
                icon={<Icon type={stopping ? 'LoadingOutlined' : 'StopOutlined'} />}
                disabled={stopping}
              >
                {stopping ? t('Stopping...') : t('Stop')}
              </Button>
            </Popconfirm>,
          );
        }

        if (record.status === TASK_STATUS.SUCCEEDED && record.result) {
          if (ResultButton) {
            actions.push(<ResultButton key="result-button" task={record} />);
          } else {
            actions.push(
              <Button
                key="view"
                type="link"
                size="small"
                icon={<Icon type="EyeOutlined" />}
                onClick={() => {
                  showTaskResult(record);
                  Modal.info({
                    title: t('Task result'),
                    content: Result ? (
                      <Result payload={record.result} task={record} />
                    ) : (
                      <div>{t(`No renderer available for this task type, payload: ${record.result}`)}</div>
                    ),
                  });
                }}
              >
                {t('View result')}
              </Button>,
            );
          }
        }

        if (record.status === TASK_STATUS.FAILED && record.result?.length > 0) {
          actions.push(
            <Button
              key="error"
              type="link"
              size="small"
              icon={<Icon type="ExclamationCircleOutlined" />}
              onClick={() => {
                setPopoverVisible(false);
                Modal.info({
                  title: t('Error Details'),
                  content: record.result?.map((error, index) => (
                    <div key={index} style={{ marginBottom: 16 }}>
                      <div style={{ color: '#ff4d4f', marginBottom: 8 }}>{error.message}</div>
                      {error.code && (
                        <div style={{ color: '#999', fontSize: 12 }}>
                          {t('Error code')}: {error.code}
                        </div>
                      )}
                    </div>
                  )),
                  closable: true,
                  width: 400,
                });
              }}
            >
              {t('Error details')}
            </Button>,
          );
        }

        return <Space size="middle">{actions}</Space>;
      },
    },
  ];

  const count = tasks.filter((item) => [TASK_STATUS.SUCCEEDED, TASK_STATUS.FAILED].includes(item.status)).length;

  const content = (
    <div style={{ maxHeight: '70vh', overflow: 'auto', width: tasks.length > 0 ? 800 : 200 }}>
      {tasks.length > 0 ? (
        <Table loading={loading} columns={columns} dataSource={tasks} size="small" pagination={false} rowKey="taskId" />
      ) : (
        <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
          <Empty description={t('No tasks')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      )}
    </div>
  );

  return (
    <>
      <Popover
        content={content}
        trigger="click"
        placement="bottom"
        open={popoverVisible}
        onOpenChange={setPopoverVisible}
      >
        <Button
          className={['sync-task-button', styles.button].join(' ')}
          onClick={() => setPopoverVisible(!popoverVisible)}
          icon={<Icon type={'SyncOutlined'} spin={tasks.some((task) => TASK_STATUS.RUNNING === task.status)} />}
        />
      </Popover>
    </>
  );
};

export const AsyncTasks = () => {
  const app = useApp();
  const { data, refresh, loading } = useRequest<any>({
    resource: 'asyncTasks',
    action: 'list',
    params: {
      sort: '-createdAt',
    },
  });

  const [tasks, setTasks] = useState(data?.data || []);
  const [popoverVisible, setPopoverVisible] = useState(false);

  useEffect(() => {
    setTasks(data?.data || []);
  }, [data]);

  const handleTaskCreated = useCallback(async () => {
    setPopoverVisible(true);
    refresh();
    console.log('handleTaskCreated');
  }, []);
  const handleTaskProgress = useCallback((event) => {
    const { detail } = event;
    setTasks((prevTasks) => {
      const index = prevTasks.findIndex((task) => task.id === detail.id);
      if (index === -1) {
        prevTasks.unshift(detail);
      } else {
        prevTasks.splice(index, 1, detail);
      }
      return [...prevTasks];
    });
  }, []);
  const handleTaskStatus = useCallback(() => {
    refresh();
    console.log('handleTaskStatus');
  }, []);
  const handleTaskDeleted = useCallback(() => {
    refresh();
    console.log('handleTaskDeleted');
  }, []);

  useEffect(() => {
    app.eventBus.addEventListener('ws:message:async-tasks:created', handleTaskCreated);
    app.eventBus.addEventListener('ws:message:async-tasks:progress', handleTaskProgress);
    app.eventBus.addEventListener('ws:message:async-tasks:status', handleTaskStatus);
    app.eventBus.addEventListener('ws:message:async-tasks:deleted', handleTaskDeleted);

    return () => {
      app.eventBus.removeEventListener('ws:message:async-tasks:created', handleTaskCreated);
      app.eventBus.removeEventListener('ws:message:async-tasks:progress', handleTaskProgress);
      app.eventBus.removeEventListener('ws:message:async-tasks:status', handleTaskStatus);
      app.eventBus.removeEventListener('ws:message:async-tasks:deleted', handleTaskDeleted);
    };
  }, [app, handleTaskDeleted, handleTaskCreated, handleTaskProgress, handleTaskStatus]);

  return tasks?.length > 0 && <AsyncTasksButton {...{ tasks, refresh, popoverVisible, setPopoverVisible }} />;
};
