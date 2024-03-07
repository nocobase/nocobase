import { useField } from '@formily/react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  useACLRoleContext,
  useCollection_deprecated,
  BlockProvider,
  useBlockRequestContext,
  TableBlockProvider,
} from '@nocobase/client';

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
) => {
  data.forEach((item: any) => {
    const disable = checkPermassion(item);
    const percent = parseFloat((item[fieldNames.progress] * 100).toFixed(2));
    if (item.children && item.children.length) {
      tasks.push({
        start: new Date(item[fieldNames.start] ?? undefined),
        end: new Date(item[fieldNames.end] ?? undefined),
        name: item[fieldNames.title],
        id: item[primaryKey] + '',
        type: 'project',
        progress: percent > 100 ? 100 : percent || 0,
        hideChildren: hideChildren,
        project: projectId,
        color: item.color,
        isDisabled: disable,
      });
      formatData(item.children, fieldNames, tasks, item.id + '', hideChildren, checkPermassion);
    } else {
      tasks.push({
        start: item[fieldNames.start] ? new Date(item[fieldNames.start]) : undefined,
        end: new Date(item[fieldNames.end] || item[fieldNames.start]),
        name: item[fieldNames.title],
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
  const params = { filter: props.params.filter, paginate: false, sort: props.fieldNames.start };
  const collection = useCollection_deprecated();

  if (collection?.tree) {
    params['tree'] = true;
  }
  return (
    <div aria-label="block-item-gantt" role="button">
      <BlockProvider name="gantt" {...props} params={params}>
        <TableBlockProvider {...props} params={params}>
          <InternalGanttBlockProvider {...props} />
        </TableBlockProvider>
      </BlockProvider>
    </div>
  );
};

export const useGanttBlockContext = () => {
  return useContext(GanttBlockContext);
};

export const useGanttBlockProps = () => {
  const ctx = useGanttBlockContext();
  const [tasks, setTasks] = useState<any>([]);
  const { getPrimaryKey, name, template, writableView } = useCollection_deprecated();
  const { parseAction } = useACLRoleContext();
  const primaryKey = getPrimaryKey();
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
    const data = formatData(ctx.service.data?.data, ctx.fieldNames, [], undefined, flag, checkPermission, primaryKey);
    setTasks(data);
    ctx.field.data = data;
  };
  useEffect(() => {
    if (!ctx?.service?.loading) {
      const data = formatData(
        ctx.service.data?.data,
        ctx.fieldNames,
        [],
        undefined,
        false,
        checkPermission,
        primaryKey,
      );
      setTasks(data);
      ctx.field.data = data;
    }
  }, [ctx?.service?.loading]);
  return {
    fieldNames: ctx.fieldNames,
    timeRange: ctx.timeRange,
    onExpanderClick,
    expandAndCollapseAll,
    tasks,
  };
};
