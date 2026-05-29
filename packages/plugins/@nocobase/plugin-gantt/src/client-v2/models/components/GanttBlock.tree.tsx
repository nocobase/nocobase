/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useMemo, useState } from 'react';
import { sortTasks } from '../../shared/helpers/other-helper';
import type { Task } from '../../shared/types/public-types';
import type { GanttBlockModel } from '../GanttBlockModel';

export const GANTT_TREE_CHILDREN_COLUMN = '__ganttChildren';

const getParentId = (task: Task) => {
  const parentId = (task as any).project;
  return parentId === undefined || parentId === null ? undefined : String(parentId);
};

export const getGanttTreeMeta = (tasks: Task[]) => {
  const taskMap = new Map<string, Task>();
  const childrenByParent = new Map<string, Task[]>();

  tasks.forEach((task) => {
    taskMap.set(String(task.id), task);
  });

  tasks.forEach((task) => {
    const parentId = getParentId(task);
    if (!parentId || !taskMap.has(parentId)) {
      return;
    }

    const children = childrenByParent.get(parentId) || [];
    children.push(task);
    childrenByParent.set(parentId, children);
  });

  const roots = tasks.filter((task) => {
    const parentId = getParentId(task);
    return !parentId || !taskMap.has(parentId);
  });

  const getDepth = (task: Task) => {
    let depth = 0;
    let parentId = getParentId(task);
    const visited = new Set<string>();

    while (parentId && !visited.has(parentId)) {
      visited.add(parentId);
      const parent = taskMap.get(parentId);
      if (!parent) {
        break;
      }
      depth += 1;
      parentId = getParentId(parent);
    }

    return depth;
  };

  return {
    childrenByParent,
    getDepth,
    roots,
  };
};

export const getVisibleGanttTasks = ({
  expandedRowKeySet,
  tasks,
  treeTableEnabled,
}: {
  expandedRowKeySet: Set<string>;
  tasks: Task[];
  treeTableEnabled: boolean;
}) => {
  if (!treeTableEnabled) {
    return tasks;
  }

  const { childrenByParent, roots } = getGanttTreeMeta(tasks);
  const visibleTasks: Task[] = [];

  const collect = (task: Task) => {
    visibleTasks.push(task);
    const children = childrenByParent.get(String(task.id)) || [];
    if (!children.length || !expandedRowKeySet.has(String(task.id))) {
      return;
    }
    children.forEach(collect);
  };

  roots.forEach(collect);
  return visibleTasks;
};

export const getExpandableGanttRowKeys = (tasks: Task[]) => {
  const { childrenByParent } = getGanttTreeMeta(tasks);
  return tasks
    .filter((task) => (childrenByParent.get(String(task.id)) || []).length > 0)
    .map((task) => String(task.id));
};

export const getOrderedGanttTasks = ({ tasks, treeTableEnabled }: { tasks: Task[]; treeTableEnabled: boolean }) => {
  if (treeTableEnabled) {
    return tasks;
  }

  return [...tasks].sort(sortTasks);
};

export const getGanttTableRecords = ({ tasks, treeTableEnabled }: { tasks: Task[]; treeTableEnabled: boolean }) => {
  const orderedTasks = getOrderedGanttTasks({ tasks, treeTableEnabled });
  const { childrenByParent, getDepth, roots } = getGanttTreeMeta(orderedTasks);
  let rowIndex = 0;

  const toRecord = (task: Task, index: number, parentPath?: string): Record<string, any> => {
    const children = childrenByParent.get(String(task.id)) || [];
    const rowPath = parentPath ? `${parentPath}.children.${index}` : `${index}`;
    const record: Record<string, any> = {
      ...(task as any).record,
      __index: rowPath,
      __ganttTaskId: task.id,
      __ganttTaskIndex: rowIndex++,
      __ganttTaskIndexPath: rowPath,
      __ganttTaskDepth: getDepth(task),
      __ganttHasChildren: children.length > 0,
    };

    if (treeTableEnabled && children.length) {
      record[GANTT_TREE_CHILDREN_COLUMN] = children.map((child, childIndex) => toRecord(child, childIndex, rowPath));
    }

    return record;
  };

  if (treeTableEnabled) {
    return roots.map((task, index) => toRecord(task, index));
  }

  return orderedTasks.map((task, index) => toRecord(task, index));
};

export const useGanttTree = ({
  model,
  tasks,
  tableColumns,
}: {
  model: GanttBlockModel;
  tasks: Task[];
  tableColumns: ColumnsType<any>;
}) => {
  const treeTableEnabled = model.isTreeTableEnabled();
  const defaultExpandAllRows = model.shouldDefaultExpandAllRows();
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const expandedRowKeySet = useMemo(() => new Set(expandedRowKeys.map((key) => String(key))), [expandedRowKeys]);
  const orderedTasks = useMemo(() => getOrderedGanttTasks({ tasks, treeTableEnabled }), [tasks, treeTableEnabled]);
  const expandableRowKeys = useMemo(() => getExpandableGanttRowKeys(orderedTasks), [orderedTasks]);

  const visibleTasks = useMemo(
    () => getVisibleGanttTasks({ expandedRowKeySet, tasks: orderedTasks, treeTableEnabled }),
    [expandedRowKeySet, orderedTasks, treeTableEnabled],
  );
  const tableRecords = useMemo(
    () => getGanttTableRecords({ tasks: orderedTasks, treeTableEnabled }),
    [orderedTasks, treeTableEnabled],
  );

  useEffect(() => {
    if (!treeTableEnabled) {
      setExpandedRowKeys([]);
      model.setTreeExpandFlag(false);
      return;
    }

    if (defaultExpandAllRows) {
      setExpandedRowKeys(expandableRowKeys);
    }
  }, [defaultExpandAllRows, expandableRowKeys, model, treeTableEnabled]);

  useEffect(() => {
    if (!treeTableEnabled) {
      return;
    }

    const handleExpandAll = () => {
      setExpandedRowKeys(expandableRowKeys);
    };
    const handleCollapseAll = () => {
      setExpandedRowKeys([]);
    };

    model.emitter.on('expandAllTreeRows', handleExpandAll);
    model.emitter.on('collapseAllTreeRows', handleCollapseAll);

    return () => {
      model.emitter.off('expandAllTreeRows', handleExpandAll);
      model.emitter.off('collapseAllTreeRows', handleCollapseAll);
    };
  }, [expandableRowKeys, model, treeTableEnabled]);

  useEffect(() => {
    const expandedRowKeySet = new Set(expandedRowKeys.map((key) => String(key)));
    const isExpanded =
      treeTableEnabled &&
      expandableRowKeys.length > 0 &&
      expandableRowKeys.every((key) => expandedRowKeySet.has(String(key)));
    model.setTreeExpandFlag(isExpanded);
  }, [expandableRowKeys, expandedRowKeys, model, treeTableEnabled]);

  const expandable = useMemo(() => {
    if (!treeTableEnabled) {
      return undefined;
    }

    return {
      expandedRowKeys,
      onExpand: (expanded: boolean, record: any) => {
        setExpandedRowKeys((prev) => {
          const key = String(record.__ganttTaskId);
          const next = new Set(prev.map((item) => String(item)));
          if (expanded) {
            next.add(key);
          } else {
            next.delete(key);
          }
          return Array.from(next);
        });
      },
    };
  }, [expandedRowKeys, treeTableEnabled]);

  return {
    treeTableEnabled,
    visibleTasks,
    tableRecords,
    resolvedTableColumns: tableColumns,
    expandable,
  };
};
