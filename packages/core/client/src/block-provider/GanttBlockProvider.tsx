import { useField } from '@formily/react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { TableBlockProvider } from './TableBlockProvider';

export const GanttBlockContext = createContext<any>({});

export function mockTasks() {
  const tasks: any[] = [
    {
      phone: '1767676334',
      examiner: 'chao',
      personInCharge: 'shery',
      end: '2023-09-01T07:29:41.703Z',
      start: '2023-01-01T07:33:20.747Z',
      title: 'project1',
      id: 1,
      children: [
        {
          phone: '1767676334',
          examiner: 'katherine',
          personInCharge: 'lucy',
          end: '2023-01-14T07:33:28.108Z',
          start: '2023-01-01T07:33:20.747Z',
          title: '需求调研',
          id: 11,
        },
        {
          examiner: 'zhou',
          personInCharge: 'bery',
          end: '2023-04-28T07:26:14.103Z',
          start: '2023-02-15T07:26:02.830Z',
          phone: '18767646573',
          title: '功能设计',
          id: 12,
        },
        {
          examiner: 'lin',
          personInCharge: 'katy',
          phone: '18787834575',
          end: '2023-07-31T07:27:18.187Z',
          start: '2023-04-29T07:27:07.136Z',
          title: '功能开发',
          id: 13,
        },
        {
          examiner: 'hong',
          personInCharge: 'lily',
          phone: '18767676773',
          end: '2023-08-29T07:28:29.740Z',
          start: '2023-07-31T07:28:04.313Z',
          title: '功能测试',
          id: 14,
        },
        {
          examiner: 'zhuo',
          personInCharge: 'katy',
          phone: '176572345',
          end: '2023-09-01T07:29:41.703Z',
          start: '2023-08-30T07:29:34.178Z',
          title: '功能验收',
          id: 15,
        },
      ],
    },
    {
      examiner: null,
      personInCharge: 'all',
      phone: null,
      end: '2023-11-09T07:30:40.449Z',
      start: '2023-11-01T07:30:30.893Z',
      title: '团建',
    },
  ];
  return tasks;
}

const formatData = (data = [], fieldNames, tasks: any[] = [], projectId: any = undefined) => {
  data.forEach((item: any) => {
    if (item.children && item.children.length) {
      tasks.push({
        start: new Date(item[fieldNames.start]),
        end: new Date(item[fieldNames.end]),
        name: item[fieldNames.title],
        id: item.id + '',
        type: 'project',
        progress: item[fieldNames.progress] * 100 || 0,
        hideChildren: true,
      });
      formatData(item.children, fieldNames, tasks, item.id + '');
    } else {
      tasks.push({
        start: item[fieldNames.start]?new Date(item[fieldNames.start]):undefined,
        end: new Date(item[fieldNames.end] || item[fieldNames.start]),
        name: item[fieldNames.title],
        id: item.id + '',
        type: fieldNames.end ? 'task' : 'milestone',
        progress: item[fieldNames.progress] * 100 || 0,
        project: projectId,
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
  return (
    <BlockProvider {...props} params={{ ...props.params, paginate: false }}>
      <TableBlockProvider {...props} params={{ ...props.params, paginate: false }}>
        <InternalGanttBlockProvider {...props} />
      </TableBlockProvider>
    </BlockProvider>
  );
};

export const useGanttBlockContext = () => {
  return useContext(GanttBlockContext);
};

export const useGanttBlockProps = () => {
  const ctx = useGanttBlockContext();
  const [tasks, setTasks] = useState<any>([]);
  const onExpanderClick = (task: any) => {
    setTasks(tasks.map((t: any) => (t.id === task.id ? task : t)));
  };
  useEffect(() => {
    if (!ctx?.service?.loading) {
      setTasks(formatData(ctx.service.data?.data, ctx.fieldNames));
    }
  }, [ctx?.service?.loading]);
  console.log(tasks)
  return {
    fieldNames: ctx.fieldNames,
    timeRange: ctx.timeRange,
    onExpanderClick,
    tasks,
  };
};
