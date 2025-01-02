import { PinnedPluginListProvider, SchemaComponentOptions, useApp } from '@nocobase/client';
import { AsyncTasks } from './components/AsyncTasks';
import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { message } from 'antd';
import { useT } from './locale';

export const AsyncTaskContext = createContext<any>(null);

export const useAsyncTask = () => {
  const context = useContext(AsyncTaskContext);
  if (!context) {
    throw new Error('useAsyncTask must be used within AsyncTaskManagerProvider');
  }
  return context;
};

export const AsyncTaskManagerProvider = (props) => {
  const app = useApp();
  const t = useT();
  const [tasks, setTasks] = useState<any[]>([]);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [hasProcessingTasks, setHasProcessingTasks] = useState(false);
  const [cancellingTasks, setCancellingTasks] = useState<Set<string>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [currentError, setCurrentError] = useState<any>(null);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [wsAuthorized, setWsAuthorized] = useState(() => app.isWsAuthorized);

  useEffect(() => {
    setHasProcessingTasks(tasks.some((task) => task.status.type !== 'success' && task.status.type !== 'failed'));
  }, [tasks]);

  const handleTaskMessage = useCallback((event: CustomEvent) => {
    const tasks = event.detail;
    setTasks(tasks ? tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []);
  }, []);

  const handleTaskCreated = useCallback((event: CustomEvent) => {
    const taskData = event.detail;
    setTasks((prev) => {
      const newTasks = [taskData, ...prev];
      return newTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
    setPopoverVisible(true);
  }, []);

  const handleTaskProgress = useCallback((event: CustomEvent) => {
    const { taskId, progress } = event.detail;
    setTasks((prev) => prev.map((task) => (task.taskId === taskId ? { ...task, progress } : task)));
  }, []);

  const handleTaskStatus = useCallback((event: CustomEvent) => {
    const { taskId, status } = event.detail;
    if (status.type === 'cancelled') {
      setTasks((prev) => prev.filter((task) => task.taskId !== taskId));
    } else {
      setTasks((prev) => {
        const newTasks = prev.map((task) => {
          if (task.taskId === taskId) {
            if (status.type === 'success' && task.status.type !== 'success') {
              message.success(t('Task completed'));
            }
            if (status.type === 'failed' && task.status.type !== 'failed') {
              message.error(t('Task failed'));
            }
            return { ...task, status };
          }
          return task;
        });
        return newTasks;
      });
    }
  }, []);

  const handleWsAuthorized = useCallback(() => {
    setWsAuthorized(true);
  }, []);

  const handleTaskCancelled = useCallback((event: CustomEvent) => {
    const { taskId } = event.detail;
    setCancellingTasks((prev) => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
    message.success(t('Task cancelled'));
  }, []);

  useEffect(() => {
    app.eventBus.addEventListener('ws:message:async-tasks', handleTaskMessage);
    app.eventBus.addEventListener('ws:message:async-tasks:created', handleTaskCreated);
    app.eventBus.addEventListener('ws:message:async-tasks:progress', handleTaskProgress);
    app.eventBus.addEventListener('ws:message:async-tasks:status', handleTaskStatus);
    app.eventBus.addEventListener('ws:message:authorized', handleWsAuthorized);
    app.eventBus.addEventListener('ws:message:async-tasks:cancelled', handleTaskCancelled);

    if (wsAuthorized) {
      app.ws.send(
        JSON.stringify({
          type: 'request:async-tasks:list',
        }),
      );
    }

    return () => {
      app.eventBus.removeEventListener('ws:message:async-tasks', handleTaskMessage);
      app.eventBus.removeEventListener('ws:message:async-tasks:created', handleTaskCreated);
      app.eventBus.removeEventListener('ws:message:async-tasks:progress', handleTaskProgress);
      app.eventBus.removeEventListener('ws:message:async-tasks:status', handleTaskStatus);
      app.eventBus.removeEventListener('ws:message:authorized', handleWsAuthorized);
      app.eventBus.removeEventListener('ws:message:async-tasks:cancelled', handleTaskCancelled);
    };
  }, [
    app,
    handleTaskMessage,
    handleTaskCreated,
    handleTaskProgress,
    handleTaskStatus,
    handleWsAuthorized,
    handleTaskCancelled,
    wsAuthorized,
  ]);

  const handleCancelTask = async (taskId: string) => {
    setCancellingTasks((prev) => new Set(prev).add(taskId));
    try {
      app.ws.send(
        JSON.stringify({
          type: 'request:async-tasks:cancel',
          payload: { taskId },
        }),
      );
    } catch (error) {
      console.error('Failed to cancel task:', error);
      setCancellingTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const contextValue = {
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
  };

  return (
    <AsyncTaskContext.Provider value={contextValue}>
      <PinnedPluginListProvider
        items={
          tasks.length > 0
            ? {
                asyncTasks: { order: 300, component: 'AsyncTasks', pin: true, snippet: '*' },
              }
            : {}
        }
      >
        <SchemaComponentOptions components={{ AsyncTasks }}>{props.children}</SchemaComponentOptions>
      </PinnedPluginListProvider>
    </AsyncTaskContext.Provider>
  );
};
