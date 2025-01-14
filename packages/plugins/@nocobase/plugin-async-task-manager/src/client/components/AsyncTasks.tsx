import React, { useEffect } from 'react';
import { Button, Popover, Table, Tag, Progress, Space, Tooltip, Popconfirm, Modal, Empty } from 'antd';
import { createStyles, Icon, useApp, usePlugin } from '@nocobase/client';

import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useT } from '../locale';
import { useAsyncTask } from '../AsyncTaskManagerProvider';
import { useCurrentAppInfo } from '@nocobase/client';
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

export const AsyncTasks = () => {
  const {
    tasks,
    popoverVisible,
    setPopoverVisible,
    hasProcessingTasks,
    cancellingTasks,
    modalVisible,
    setModalVisible,
    currentError,
    setCurrentError,
    resultModalVisible,
    setResultModalVisible,
    currentTask,
    setCurrentTask,
    handleCancelTask,
  } = useAsyncTask();

  const plugin = usePlugin<any>('async-task-manager');
  const app = useApp();
  const appInfo = useCurrentAppInfo();
  const t = useT();
  const { styles } = useStyles();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverVisible) {
        const popoverElements = document.querySelectorAll('.ant-popover');
        const buttonElement = document.querySelector('.sync-task-button');
        let clickedInside = false;

        popoverElements.forEach((element) => {
          if (element.contains(event.target as Node)) {
            clickedInside = true;
          }
        });

        if (buttonElement?.contains(event.target as Node)) {
          clickedInside = true;
        }

        if (!clickedInside) {
          setPopoverVisible(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [popoverVisible, setPopoverVisible]);

  const showTaskResult = (task) => {
    setCurrentTask(task);
    setResultModalVisible(true);
    setPopoverVisible(false);
  };

  const renderTaskResultModal = () => {
    if (!currentTask) {
      return;
    }

    const { payload } = currentTask.status;
    const renderer = plugin.taskResultRendererManager.get(currentTask.title.actionType);

    return (
      <Modal
        title={t('Task result')}
        open={resultModalVisible}
        footer={[
          <Button key="close" onClick={() => setResultModalVisible(false)}>
            {t('Close')}
          </Button>,
        ]}
        onCancel={() => setResultModalVisible(false)}
      >
        {renderer ? (
          React.createElement(renderer, { payload, task: currentTask })
        ) : (
          <div>{t(`No renderer available for this task type, payload: ${payload}`)}</div>
        )}
      </Modal>
    );
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

        const taskTemplate = taskTypeMap[title.actionType] || `${actionText} ${title.collection} ${t('Data')}`;
        return taskTemplate.replace('{collection}', title.collection);
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
              return (
                <Progress
                  type="line"
                  size="small"
                  strokeWidth={4}
                  percent={100}
                  status="active"
                  showInfo={false}
                  style={commonStyle}
                />
              );
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
        const isTaskCancelling = cancellingTasks.has(record.taskId);

        if (record.status.type === 'running' || record.status.type === 'pending') {
          actions.push(
            <Popconfirm
              key="cancel"
              title={t('Confirm cancel')}
              description={t('Confirm cancel description')}
              onConfirm={() => handleCancelTask(record.taskId)}
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
                  const url = app.getApiUrl(
                    `asyncTasks:fetchFile/${record.taskId}?token=${token}&__appName=${appInfo?.data?.name || app.name}`,
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
                onClick={() => showTaskResult(record)}
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
                setCurrentError(record.status.errors);
                setModalVisible(true);
                setPopoverVisible(false);
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
    <div style={{ width: tasks.length > 0 ? 800 : 200 }}>
      {tasks.length > 0 ? (
        <Table columns={columns} dataSource={tasks} size="small" pagination={false} rowKey="taskId" />
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
      {renderTaskResultModal()}

      <Modal
        title={t('Error Details')}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setModalVisible(false)}>
            {t('OK')}
          </Button>,
        ]}
        width={400}
      >
        {currentError?.map((error, index) => (
          <div key={index} style={{ marginBottom: 16 }}>
            <div style={{ color: '#ff4d4f', marginBottom: 8 }}>{error.message}</div>
            {error.code && (
              <div style={{ color: '#999', fontSize: 12 }}>
                {t('Error code')}: {error.code}
              </div>
            )}
          </div>
        ))}
      </Modal>
    </>
  );
};
