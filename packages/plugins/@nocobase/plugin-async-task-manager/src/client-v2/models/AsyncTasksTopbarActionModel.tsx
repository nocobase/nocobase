/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ExclamationCircleOutlined, EyeOutlined, StopOutlined, SyncOutlined } from '@ant-design/icons';
import { Icon, TopbarActionModel, useApp, useMobileLayout } from '@nocobase/client-v2';
import { observer } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import {
  Alert,
  Button,
  Empty,
  Modal,
  Popconfirm,
  Popover,
  Progress,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TASK_STATUS, TASK_STATUS_OPTIONS } from '../../common/constants';
import type { TaskStatus } from '../../common/types';
import type { AsyncTaskRecord, PluginAsyncTaskManagerClientV2, TaskOrigin } from '../plugin';
import { tExpr, useT } from '../locale';

dayjs.extend(relativeTime);

type AsyncTasksListBody = {
  data?: AsyncTaskRecord[];
};

type StatusOption = {
  label: string;
  color?: string;
  icon?: string;
};

type TaskErrorResult = {
  message?: string;
  params?: Record<string, unknown>;
};

const statusOptions = TASK_STATUS_OPTIONS as Record<string, StatusOption>;

function getStatusOption(status: TaskStatus | undefined): StatusOption {
  const statusKey = String(status ?? TASK_STATUS.PENDING);
  return statusOptions[statusKey] ?? statusOptions[String(TASK_STATUS.PENDING)];
}

function isTaskErrorResult(value: unknown): value is TaskErrorResult {
  return !!value && typeof value === 'object';
}

function getTaskManagerPlugin(app: ReturnType<typeof useApp>): PluginAsyncTaskManagerClientV2 | undefined {
  const plugin = app.pm.get('async-task-manager') ?? app.pm.get('@nocobase/plugin-async-task-manager');
  return plugin as PluginAsyncTaskManagerClientV2 | undefined;
}

function getTaskOrigin(plugin: PluginAsyncTaskManagerClientV2 | undefined, origin?: string): TaskOrigin | undefined {
  if (!origin) {
    return undefined;
  }

  return plugin?.taskOrigins.get(origin);
}

function ErrorDetailsContent(props: { message: React.ReactNode }) {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        maxHeight: '60vh',
        overflow: 'auto',
        padding: `${token.paddingXS}px ${token.paddingSM}px`,
        borderRadius: token.borderRadius,
        background: token.colorFillAlter,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      <Typography.Text>{props.message}</Typography.Text>
    </div>
  );
}

const AsyncTasksButton = React.memo(
  (props: {
    popoverVisible: boolean;
    setPopoverVisible: (visible: boolean) => void;
    tasks: AsyncTaskRecord[];
    refresh: () => void;
    loading?: boolean;
  }) => {
    const { popoverVisible, setPopoverVisible, tasks, refresh, loading } = props;
    const app = useApp();
    const t = useT();
    const { token } = theme.useToken();
    const plugin = getTaskManagerPlugin(app);
    const taskResource = useMemo(() => app.apiClient.resource('asyncTasks'), [app.apiClient]);

    const columns = useMemo<ColumnsType<AsyncTaskRecord>>(
      () => [
        {
          title: t('Created at'),
          dataIndex: 'createdAt',
          key: 'createdAt',
          width: token.controlHeight * 5,
          render: (createdAt?: string) =>
            createdAt ? (
              <Tooltip title={dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss')}>{dayjs(createdAt).fromNow()}</Tooltip>
            ) : (
              '-'
            ),
        },
        {
          title: t('Task'),
          dataIndex: 'title',
          key: 'title',
          ellipsis: true,
        },
        {
          title: t('Status'),
          dataIndex: 'status',
          key: 'status',
          width: token.controlHeight * 5,
          render: (status: TaskStatus, record) => {
            const option = getStatusOption(status);

            const renderProgress = () => {
              const commonStyle = {
                width: token.controlHeight * 3,
                margin: 0,
              };

              switch (status) {
                case TASK_STATUS.PENDING:
                case TASK_STATUS.CANCELED:
                  return <Alert showIcon={false} message={t(option.label)} banner />;
                case TASK_STATUS.RUNNING:
                  return (
                    <Progress
                      type="line"
                      size="small"
                      strokeWidth={token.lineWidthBold}
                      percent={Number((((record.progressCurrent ?? 0) / (record.progressTotal ?? 1)) * 100).toFixed(2))}
                      status="active"
                      style={commonStyle}
                      format={(percent) => `${(percent ?? 0).toFixed(1)}%`}
                    />
                  );
                case TASK_STATUS.SUCCEEDED:
                  return (
                    <Progress
                      type="line"
                      size="small"
                      strokeWidth={token.lineWidthBold}
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
                      strokeWidth={token.lineWidthBold}
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
              <Space align="center" size={token.marginXS}>
                <span>{renderProgress()}</span>
                <Tag
                  color={option.color}
                  icon={option.icon ? <Icon type={option.icon} /> : null}
                  style={{
                    margin: 0,
                    paddingInline: token.paddingXXS,
                    height: token.controlHeightSM,
                    width: token.controlHeightSM,
                  }}
                />
              </Space>
            );
          },
        },
        {
          title: t('Actions'),
          dataIndex: 'result',
          key: 'actions',
          width: token.controlHeight * 6,
          render: (result: unknown, record) => {
            const actions: React.ReactNode[] = [];
            const taskOrigin = getTaskOrigin(plugin, record.origin);
            const ResultComponent = taskOrigin?.Result;
            const ResultButton = taskOrigin?.ResultButton;

            if (record.cancelable && (record.status === TASK_STATUS.RUNNING || record.status === TASK_STATUS.PENDING)) {
              actions.push(
                <Popconfirm
                  key="cancel"
                  title={t('Confirm cancel')}
                  description={t('Confirm to cancel this task?')}
                  onConfirm={async () => {
                    await taskResource.stop({
                      filterByTk: record.id,
                    });
                    refresh();
                  }}
                  okText={t('Confirm')}
                  cancelText={t('Cancel')}
                >
                  <Button type="link" size="small" icon={<StopOutlined />}>
                    {t('Stop')}
                  </Button>
                </Popconfirm>,
              );
            }

            if (record.status === TASK_STATUS.SUCCEEDED && result) {
              if (ResultButton) {
                actions.push(<ResultButton key="result-button" task={record} />);
              } else {
                actions.push(
                  <Button
                    key="view"
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setPopoverVisible(false);
                      Modal.info({
                        title: t('Task result'),
                        content: ResultComponent ? (
                          <ResultComponent payload={result} task={record} />
                        ) : (
                          <div>
                            {t('No renderer available for this task type, payload: {{payload}}', {
                              payload: String(result),
                            })}
                          </div>
                        ),
                      });
                    }}
                  >
                    {t('View result')}
                  </Button>,
                );
              }
            }

            if (record.status === TASK_STATUS.FAILED && isTaskErrorResult(result)) {
              actions.push(
                <Button
                  key="error"
                  type="link"
                  size="small"
                  icon={<ExclamationCircleOutlined />}
                  onClick={() => {
                    setPopoverVisible(false);
                    const namespace = taskOrigin?.namespace ?? 'client';
                    Modal.info({
                      title: t('Error Details'),
                      content: (
                        <ErrorDetailsContent message={t(result.message ?? '', { ...result.params, ns: namespace })} />
                      ),
                      closable: true,
                      width: token.screenMD,
                    });
                  }}
                >
                  {t('Error details')}
                </Button>,
              );
            }

            return <Space size={token.marginSM}>{actions}</Space>;
          },
        },
      ],
      [plugin, refresh, setPopoverVisible, t, taskResource, token],
    );

    const content = (
      <div
        style={{
          maxHeight: '70vh',
          overflow: 'auto',
          width: tasks.length > 0 ? token.screenLG : token.controlHeight * 6,
        }}
      >
        {tasks.length > 0 ? (
          <Table<AsyncTaskRecord>
            loading={loading}
            columns={columns}
            dataSource={tasks}
            size="small"
            pagination={false}
            rowKey="id"
          />
        ) : (
          <div style={{ paddingBlock: token.paddingLG, display: 'flex', justifyContent: 'center' }}>
            <Empty description={t('No tasks')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        )}
      </div>
    );

    return (
      <Popover
        content={content}
        trigger="click"
        placement="bottom"
        open={popoverVisible}
        onOpenChange={setPopoverVisible}
      >
        <Button
          type="text"
          onClick={() => {
            setPopoverVisible(!popoverVisible);
            if (!popoverVisible) {
              refresh();
            }
          }}
          icon={<SyncOutlined spin={tasks.some((task) => TASK_STATUS.RUNNING === task.status)} />}
          data-testid="async-tasks-button"
        />
      </Popover>
    );
  },
);

AsyncTasksButton.displayName = 'AsyncTasksButton';

const AsyncTasksTopbarAction = observer(
  () => {
    const app = useApp();
    const { isMobileLayout } = useMobileLayout();
    const { data, refresh, loading } = useRequest(async (): Promise<AsyncTasksListBody> => {
      const response = await app.apiClient.resource('asyncTasks').list({
        sort: '-createdAt',
      });
      return (response?.data ?? { data: [] }) as AsyncTasksListBody;
    });

    const [tasks, setTasks] = useState<AsyncTaskRecord[]>([]);
    const [popoverVisible, setPopoverVisible] = useState(false);

    useEffect(() => {
      setTasks(Array.isArray(data?.data) ? data.data : []);
    }, [data]);

    const handleTaskCreated = useCallback(() => {
      setPopoverVisible(true);
      refresh();
    }, [refresh]);

    const handleTaskProgress = useCallback((event: Event) => {
      const detail = (event as CustomEvent<AsyncTaskRecord>).detail;
      if (!detail?.id) {
        return;
      }

      setTasks((prevTasks) => {
        const nextTasks = [...prevTasks];
        const index = nextTasks.findIndex((task) => task.id === detail.id);
        if (index === -1) {
          nextTasks.unshift(detail);
          return nextTasks;
        }

        nextTasks.splice(index, 1, detail);
        return nextTasks;
      });
    }, []);

    const handleTaskStatus = useCallback(() => {
      refresh();
    }, [refresh]);

    const handleTaskDeleted = useCallback(() => {
      refresh();
    }, [refresh]);

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
    }, [app.eventBus, handleTaskCreated, handleTaskDeleted, handleTaskProgress, handleTaskStatus]);

    if (isMobileLayout || tasks.length === 0) {
      return null;
    }

    return (
      <AsyncTasksButton
        tasks={tasks}
        refresh={refresh}
        loading={loading}
        popoverVisible={popoverVisible}
        setPopoverVisible={setPopoverVisible}
      />
    );
  },
  { displayName: 'AsyncTasksTopbarAction' },
);

export class AsyncTasksTopbarActionModel extends TopbarActionModel {
  sort = 300;
  actionId = 'async-tasks';
  testId = 'async-tasks-button';
  tooltip = tExpr('Async tasks');

  render() {
    return <AsyncTasksTopbarAction />;
  }
}

export default AsyncTasksTopbarActionModel;
