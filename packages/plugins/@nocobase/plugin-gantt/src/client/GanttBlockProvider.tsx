/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField } from '@formily/react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  useACLRoleContext,
  useCollection_deprecated,
  useBlockRequestContext,
  TableBlockProvider,
  useTableBlockContext,
  getLabelFormatValue,
  useCollection,
  useCollectionManager_deprecated,
} from '@nocobase/client';
import _ from 'lodash';
export const GanttBlockContext = createContext<any>({});
GanttBlockContext.displayName = 'GanttBlockContext';

const formatData = (
  data = [],
  fieldNames,
  tasks: any[] = [],
  projectId: any = undefined,
  hideChildren = false,
  checkPermassion?: (any) => boolean,
  primaryKey?: string,
  labelUiSchema?: any,
) => {
  data.forEach((item: any) => {
    const disable = checkPermassion(item);
    const percent = parseFloat((item[fieldNames.progress] * 100).toFixed(2));
    const title = getLabelFormatValue(labelUiSchema, item[fieldNames.title]);

    if (item.children && item.children.length) {
      tasks.push({
        start: new Date(item[fieldNames.start] ?? undefined),
        end: new Date(item[fieldNames.end] ?? undefined),
        name: title,
        id: item[primaryKey] + '',
        type: 'project',
        progress: percent > 100 ? 100 : percent || 0,
        hideChildren: hideChildren,
        project: projectId,
        color: item.color,
        isDisabled: disable,
      });
      formatData(
        item.children,
        fieldNames,
        tasks,
        item.id + '',
        hideChildren,
        checkPermassion,
        primaryKey,
        labelUiSchema,
      );
    } else {
      tasks.push({
        start: item[fieldNames.start] ? new Date(item[fieldNames.start]) : undefined,
        end: new Date(item[fieldNames.end] || item[fieldNames.start]),
        name: title,
        id: item[primaryKey] + '',
        type: fieldNames.end ? 'task' : 'milestone',
        progress: percent > 100 ? 100 : percent || 0,
        project: projectId,
        color: item.color,
        isDisabled: disable,
      });
    }
  });
  return tasks;
};
const InternalGanttBlockProvider = (props) => {
  const { fieldNames, timeRange, resource } = props;
  const field = useField();
  const { service } = useBlockRequestContext();
  // if (service.loading) {
  //   return <Spin />;
  // }
  return (
    <GanttBlockContext.Provider
      value={{
        field,
        service,
        resource,
        fieldNames,
        timeRange,
      }}
    >
      {props.children}
    </GanttBlockContext.Provider>
  );
};

export const GanttBlockProvider = (props) => {
  const cm = useCollectionManager_deprecated(props.dataSource);
  const collection = cm.getCollection(props.collection, props.dataSource);
  const params = { filter: props.params?.filter, paginate: false, sort: [collection?.primaryKey || 'id'] };

  return (
    <div aria-label="block-item-gantt" role="button">
      <TableBlockProvider {...props} params={params}>
        <InternalGanttBlockProvider {...props} />
      </TableBlockProvider>
    </div>
  );
};

export const useGanttBlockContext = () => {
  return useContext(GanttBlockContext);
};

export const useGanttBlockProps = () => {
  const ctx = useGanttBlockContext();
  const { fieldNames } = ctx;
  const [tasks, setTasks] = useState<any>([]);
  const { getPrimaryKey, name, template, writableView } = useCollection_deprecated();
  const { parseAction } = useACLRoleContext();
  const ctxBlock = useTableBlockContext();
  const [loading, setLoading] = useState(false);
  const primaryKey = getPrimaryKey();
  const { fields } = useCollection();
  const labelUiSchema = fields.find((v) => v.name === fieldNames?.title)?.uiSchema;
  const checkPermission = (record) => {
    const actionPath = `${name}:update`;
    const schema = {};
    const recordPkValue = record?.[primaryKey];
    const params = parseAction(actionPath, { schema, recordPkValue });
    return (template === 'view' && !writableView) || !params;
  };

  const onExpanderClick = (task: any) => {
    const data = ctx.field.data;
    const tasksData = data.map((t: any) => (t.id === task.id ? task : t));
    setTasks(tasksData);
    ctx.field.data = tasksData;
  };
  const expandAndCollapseAll = (flag) => {
    const data = formatData(
      ctx.service.data?.data,
      ctx.fieldNames,
      [],
      undefined,
      flag,
      checkPermission,
      primaryKey,
      labelUiSchema,
    );
    setTasks(data);
    ctx.field.data = data;
  };
  useEffect(() => {
    setLoading(true);
    if (!ctx?.service?.loading) {
      const data = formatData(
        ctx.service.data?.data,
        ctx.fieldNames,
        [],
        undefined,
        false,
        checkPermission,
        primaryKey,
        labelUiSchema,
      );
      setTasks(data);
      setLoading(false);
      ctx.field.data = data;
      if (tasks.length > 0) {
        ctxBlock.setExpandFlag(true);
      }
    }
  }, [ctx?.service?.loading]);
  return {
    fieldNames: ctx.fieldNames,
    timeRange: ctx.timeRange,
    onExpanderClick,
    expandAndCollapseAll,
    tasks,
    loading,
  };
};
