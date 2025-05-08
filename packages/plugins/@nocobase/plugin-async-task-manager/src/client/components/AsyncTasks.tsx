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
import { Alert, Button, Empty, Modal, Popconfirm, Popover, Progress, Space, Table, Tag, Tooltip } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';

import { useCurrentAppInfo } from '@nocobase/client';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useT } from '../locale';

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

const renderTaskResult = (status, t) => {
  if (status.type !== 'success' || !status.payload?.message?.messageId) {
    return null;
  }

  const { messageId, messageValues } = status.payload.message;

  return (
    <div style={{ marginLeft: 8 }}>
      <Tag color="success">{t(messageId, messageValues)}</Tag>
    </div>
  );
};

const useAsyncTask = () => {
  const { data, refreshAsync, loading } = useRequest<any>({
    url: 'asyncTasks:list',
  });
  return { loading, tasks: data?.data || [], refresh: refreshAsync };
};

const AsyncTasksButton = (props) => {
  const { popoverVisible, setPopoverVisible, tasks, refresh, loading, hasProcessingTasks } = props;
  const app = useApp();
  const api = useAPIClient();
  const appInfo = useCurrentAppInfo();
  const t = useT();
  const { styles } = useStyles();
  const plugin = usePlugin<any>('async-task-manager');
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
      render: (_, record: any) => {
        const title = record.title;
        if (!title) {
          return '-';
        }
        const collection = cm.getCollection(title.collection);
        const actionTypeMap = {
          export: t('Export'),
          import: t('Import'),
          'export-attachments': t('Export attachments'),
        };

        const actionText = actionTypeMap[title.actionType] || title.actionType;

        const taskTypeMap = {
          'export-attachments': t('Export {collection} attachments'),
          export: t('Export {collection} data'),
          import: t('Import {collection} data'),
        };

        const taskTemplate = taskTypeMap[title.actionType] || `${actionText}`;
        return taskTemplate.replace('{collection}', compile(collection?.title || title.collection));
      },
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: any, record: any) => {
        const statusMap = {
          pending: {
            color: 'default',
            text: t('Waiting'),
            icon: 'ClockCircleOutlined',
          },
          running: {
            color: 'processing',
            text: t('Processing'),
            icon: 'LoadingOutlined',
          },
          success: {
            color: 'success',
            text: t('Completed'),
            icon: 'CheckCircleOutlined',
          },
          failed: {
            color: 'error',
            text: t('Failed'),
            icon: 'CloseCircleOutlined',
          },
          cancelled: {
            color: 'warning',
            text: t('Cancelled'),
            icon: 'StopOutlined',
          },
        };

        const { color, text } = statusMap[status.type] || {};

        const renderProgress = () => {
          const commonStyle = {
            width: 100,
            margin: 0,
          };

          switch (status.indicator) {
            case 'spinner':
              return <Alert showIcon={false} message={text} banner />;
            case 'progress':
              return (
                <Progress
                  type="line"
                  size="small"
                  strokeWidth={4}
                  percent={Number(((record.progress?.current / record.progress?.total) * 100).toFixed(2))}
                  status="active"
                  style={commonStyle}
                  format={(percent) => `${percent.toFixed(1)}%`}
                />
              );
            case 'success':
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
            case 'error':
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
              icon={statusMap[status.type]?.icon ? <Icon type={statusMap[status.type].icon} /> : null}
              style={{ margin: 0, padding: '0 4px', height: 22, width: 22 }}
            />
            {renderTaskResult(status, t)}
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
        const isTaskCancelling = false;

        if ((record.status.type === 'running' || record.status.type === 'pending') && record.cancelable) {
          actions.push(
            <Popconfirm
              key="cancel"
              title={t('Confirm cancel')}
              description={t('Confirm cancel description')}
              onConfirm={async () => {
                await api.request({
                  url: 'asyncTasks:cancel',
                  params: {
                    filterByTk: record.taskId,
                  },
                });
                refresh();
              }}
              okText={t('Confirm')}
              cancelText={t('Cancel')}
              disabled={isTaskCancelling}
            >
              <Button
                type="link"
                size="small"
                icon={<Icon type={isTaskCancelling ? 'LoadingOutlined' : 'StopOutlined'} />}
                disabled={isTaskCancelling}
              >
                {isTaskCancelling ? t('Cancelling') : t('Cancel')}
              </Button>
            </Popconfirm>,
          );
        }

        if (record.status.type === 'success') {
          if (record.status.resultType === 'file') {
            actions.push(
              <Button
                key="download"
                type="link"
                size="small"
                icon={<Icon type="DownloadOutlined" />}
                onClick={() => {
                  const token = app.apiClient.auth.token;
                  const collection = cm.getCollection(record.title.collection);
                  const compiledTitle = compile(collection?.title);
                  const suffix = record?.title?.actionType === 'export-attachments' ? '-attachments.zip' : '.xlsx';
                  const fileText = `${compiledTitle}${suffix}`;
                  const filename =
                    record?.title?.actionType !== 'create migration' ? encodeURIComponent(fileText) : null;
                  const url = app.getApiUrl(
                    `asyncTasks:fetchFile/${record.taskId}?token=${token}&__appName=${encodeURIComponent(
                      appInfo?.data?.name || app.name,
                    )}${filename ? `&filename=${filename}` : ''}`,
                  );
                  window.open(url);
                }}
              >
                {t('Download')}
              </Button>,
            );
          } else if (record.status.payload) {
            actions.push(
              <Button
                key="view"
                type="link"
                size="small"
                icon={<Icon type="EyeOutlined" />}
                onClick={() => {
                  showTaskResult(record);
                  const { payload } = record.status;
                  const renderer = plugin.taskResultRendererManager.get(record.title.actionType);
                  Modal.info({
                    title: t('Task result'),
                    content: renderer ? (
                      React.createElement(renderer, { payload, task: record })
                    ) : (
                      <div>{t(`No renderer available for this task type, payload: ${payload}`)}</div>
                    ),
                  });
                }}
              >
                {t('View result')}
              </Button>,
            );
          }
        }

        if (record.status.type === 'failed') {
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
                  content: record.status.errors?.map((error, index) => (
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
        trigger="hover"
        placement="bottom"
        open={popoverVisible}
        onOpenChange={setPopoverVisible}
      >
        <Button
          className={['sync-task-button', styles.button].join(' ')}
          icon={<Icon type={'SyncOutlined'} spin={hasProcessingTasks} />}
          onClick={() => setPopoverVisible(!popoverVisible)}
        />
      </Popover>
    </>
  );
};

export const AsyncTasks = () => {
  const { tasks, refresh, ...others } = useAsyncTask();
  const app = useApp();
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [hasProcessingTasks, setHasProcessingTasks] = useState(false);

  useEffect(() => {
    setHasProcessingTasks(tasks.some((task) => task.status.type !== 'success' && task.status.type !== 'failed'));
  }, [tasks]);

  const handleTaskCreated = useCallback(async () => {
    setPopoverVisible(true);
  }, []);
  const handleTaskProgress = useCallback(() => {
    refresh();
    console.log('handleTaskProgress');
  }, []);
  const handleTaskStatus = useCallback(() => {
    refresh();
    console.log('handleTaskStatus');
  }, []);
  const handleTaskCancelled = useCallback(() => {
    refresh();
    console.log('handleTaskCancelled');
  }, []);

  useEffect(() => {
    app.eventBus.addEventListener('ws:message:async-tasks:created', handleTaskCreated);
    app.eventBus.addEventListener('ws:message:async-tasks:progress', handleTaskProgress);
    app.eventBus.addEventListener('ws:message:async-tasks:status', handleTaskStatus);
    app.eventBus.addEventListener('ws:message:async-tasks:cancelled', handleTaskCancelled);

    return () => {
      app.eventBus.removeEventListener('ws:message:async-tasks:created', handleTaskCreated);
      app.eventBus.removeEventListener('ws:message:async-tasks:progress', handleTaskProgress);
      app.eventBus.removeEventListener('ws:message:async-tasks:status', handleTaskStatus);
      app.eventBus.removeEventListener('ws:message:async-tasks:cancelled', handleTaskCancelled);
    };
  }, [app, handleTaskCancelled, handleTaskCreated, handleTaskProgress, handleTaskStatus]);

  return (
    tasks?.length > 0 && (
      <AsyncTasksButton {...{ tasks, refresh, popoverVisible, setPopoverVisible, hasProcessingTasks, ...others }} />
    )
  );
};
