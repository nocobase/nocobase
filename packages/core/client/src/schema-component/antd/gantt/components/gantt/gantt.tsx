import React, { useState, SyntheticEvent, useRef, useEffect, useMemo } from 'react';
import { useFieldSchema, Schema, RecursionField, ISchema } from '@formily/react';
import { ViewMode, GanttProps, Task } from '../../types/public-types';
import { GridProps } from '../grid/grid';
import { ganttDateRange, seedDates } from '../../helpers/date-helper';
import { CalendarProps } from '../calendar/calendar';
import { TaskGanttContentProps } from './task-gantt-content';
import { TaskListHeaderDefault } from '../task-list/task-list-header';
import { TaskListTableDefault } from '../task-list/task-list-table';
import { StandardTooltipContent, Tooltip } from '../other/tooltip';
import { VerticalScroll } from '../other/vertical-scroll';
import { TaskListProps, TaskList } from '../task-list/task-list';
import { TaskGantt } from './task-gantt';
import { BarTask } from '../../types/bar-task';
import { convertToBarTasks } from '../../helpers/bar-helper';
import { GanttEvent } from '../../types/gantt-task-actions';
import { DateSetup } from '../../types/date-setup';
import { HorizontalScroll } from '../other/horizontal-scroll';
import { removeHiddenTasks, sortTasks } from '../../helpers/other-helper';
import styles from './gantt.module.css';
import { GanttToolbarContext } from '../../context';
import { useDesignable } from '../../../../../schema-component';
import { TableBlockProvider, useGanttBlockContext } from '../../../../../block-provider';
import { useProps } from '../../../../hooks/useProps';

// export function getTestTasks() {
//   const currentDate = new Date();
//   const tasks: Task[] = [
// {
//   start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
//   end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
//   name: 'Some Project',
//   id: '6',
//   progress: 25,
//   type: 'project',
//   hideChildren: false,
//   displayOrder: 1,
// },
// {
//   start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
//   end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 2, 12, 28),
//   name: 'Idea',
//   id: 'Task 0',
//   progress: 45,
//   type: 'task',
//   project: '6',
//   displayOrder: 2,
// },
// {
//   start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 2),
//   end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 4, 0, 0),
//   name: 'Research',
//   id: 'Task 1',
//   progress: 25,
//   dependencies: ['Task 0'],
//   type: 'task',
//   project: '6',
//   displayOrder: 3,
// },
// {
//   start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 4),
//   end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8, 0, 0),
//   name: 'Discussion with team',
//   id: 'Task 2',
//   progress: 10,
//   dependencies: ['Task 1'],
//   type: 'task',
//   project: '6',
//   displayOrder: 4,
// },
// {
//   start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8),
//   end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 9, 0, 0),
//   name: 'Developing',
//   id: 'Task 3',
//   progress: 2,
//   dependencies: ['Task 2'],
//   type: 'task',
//   project: '6',
//   displayOrder: 5,
// },
// {
//   start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8),
//   end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10),
//   name: 'Review',
//   id: 'Task 4',
//   type: 'task',
//   progress: 70,
//   dependencies: ['Task 2'],
//   project: '6',
//   displayOrder: 6,
// },
// {
//   start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
//   end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
//   name: 'Release',
//   id: 'Task 6',
//   progress: currentDate.getMonth(),
//   type: 'milestone',
//   dependencies: ['Task 4'],
//   project: '6',
//   displayOrder: 7,
// },
//     {
//       // start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 18),
//       // end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 19),
//       // name: 'Party Time',
//       id: 'Task 9',
//       // progress: 0,
//       // isDisabled: true,
//       type: 'task',
//     },
//   ];
//   return tasks;
// }

const formatData = (data = [], fieldNames) => {
  const tasks: any[] = [];
  data.forEach((v) => {
    tasks.push({
      start: new Date(v[fieldNames.start]),
      end: new Date(v[fieldNames.end]),
      name: v[fieldNames.title],
      id: v.id + '',
      type: 'task',
      progress: v[fieldNames.progress],
    });
  });
  return tasks;
};
function Toolbar(props) {
  const fieldSchema = useFieldSchema();
  const toolBarSchema: Schema = useMemo(
    () =>
      fieldSchema.reduceProperties((buf, current) => {
        if (current['x-component'].endsWith('.ActionBar')) {
          return current;
        }
        return buf;
      }, null),
    [],
  );
  return (
    <GanttToolbarContext.Provider value={props}>
      <RecursionField name={toolBarSchema.name} schema={toolBarSchema} />
    </GanttToolbarContext.Provider>
  );
}
export const Gantt: any = (props) => {
  const { designable } = useDesignable();

  const {
    headerHeight = designable ? 65 : 55,
    columnWidth = 60,
    listCellWidth = '155px',
    rowHeight = 55,
    ganttHeight = 0,
    preStepsCount = 1,
    locale = 'en-GB',
    barFill = 60,
    barCornerRadius = 3,
    barProgressColor = '#a3a3ff',
    barProgressSelectedColor = '#8282f5',
    barBackgroundColor = '#b8c2cc',
    barBackgroundSelectedColor = '#aeb8c2',
    projectProgressColor = '#7db59a',
    projectProgressSelectedColor = '#59a985',
    projectBackgroundColor = '#fac465',
    projectBackgroundSelectedColor = '#f7bb53',
    milestoneBackgroundColor = '#f1c453',
    milestoneBackgroundSelectedColor = '#f29e4c',
    rtl = false,
    handleWidth = 8,
    timeStep = 300000,
    arrowColor = 'grey',
    fontFamily = 'Arial, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue',
    fontSize = '14px',
    arrowIndent = 20,
    todayColor = 'rgba(252, 248, 227, 0.5)',
    viewDate,
    TooltipContent = StandardTooltipContent,
    TaskListHeader = TaskListHeaderDefault,
    TaskListTable = TaskListTableDefault,
    onDateChange,
    onProgressChange,
    onDoubleClick,
    onClick,
    onDelete,
    onSelect,
    onExpanderClick,
  } = props;
  const fieldSchema = useFieldSchema();
  const { fieldNames, dataSource } = useProps(props);
  const { range: viewMode } = fieldNames || { range: 'day' };
  const tasks = formatData(dataSource, fieldNames) || [];
  const wrapperRef = useRef<HTMLDivElement>(null);
  const taskListRef = useRef<HTMLDivElement>(null);
  const [dateSetup, setDateSetup] = useState<DateSetup>(() => {
    const [startDate, endDate] = ganttDateRange(tasks, viewMode, preStepsCount);
    return { viewMode, dates: seedDates(startDate, endDate, viewMode) };
  });
  const [currentViewDate, setCurrentViewDate] = useState<Date | undefined>(undefined);
  const [taskListWidth, setTaskListWidth] = useState(0);
  const [svgContainerWidth, setSvgContainerWidth] = useState(0);
  const [svgContainerHeight, setSvgContainerHeight] = useState(ganttHeight);
  const [barTasks, setBarTasks] = useState<BarTask[]>([]);
  const [ganttEvent, setGanttEvent] = useState<GanttEvent>({
    action: '',
  });
  const taskHeight = useMemo(() => (rowHeight * barFill) / 100, [rowHeight, barFill]);
  const [selectedTask, setSelectedTask] = useState<BarTask>();
  const [failedTask, setFailedTask] = useState<BarTask | null>(null);
  const ctx = useGanttBlockContext();
  const svgWidth = dateSetup.dates.length * columnWidth;
  const ganttFullHeight = barTasks.length * rowHeight;

  const [scrollY, setScrollY] = useState(0);
  const [scrollX, setScrollX] = useState(-1);
  const [ignoreScrollEvent, setIgnoreScrollEvent] = useState(false);
  // task change events
  useEffect(() => {
    let filteredTasks: Task[];
    if (onExpanderClick) {
      filteredTasks = removeHiddenTasks(tasks);
    } else {
      filteredTasks = tasks;
    }
    filteredTasks = filteredTasks.sort(sortTasks);
    const [startDate, endDate] = ganttDateRange(filteredTasks, viewMode, preStepsCount);
    let newDates = seedDates(startDate, endDate, viewMode);
    if (rtl) {
      newDates = newDates.reverse();
      if (scrollX === -1) {
        setScrollX(newDates.length * columnWidth);
      }
    }
    setDateSetup({ dates: newDates, viewMode });
    setBarTasks(
      convertToBarTasks(
        filteredTasks,
        newDates,
        columnWidth,
        rowHeight,
        taskHeight,
        barCornerRadius,
        handleWidth,
        rtl,
        barProgressColor,
        barProgressSelectedColor,
        barBackgroundColor,
        barBackgroundSelectedColor,
        projectProgressColor,
        projectProgressSelectedColor,
        projectBackgroundColor,
        projectBackgroundSelectedColor,
        milestoneBackgroundColor,
        milestoneBackgroundSelectedColor,
      ),
    );
  }, [
    dataSource,
    viewMode,
    preStepsCount,
    rowHeight,
    barCornerRadius,
    columnWidth,
    taskHeight,
    handleWidth,
    barProgressColor,
    barProgressSelectedColor,
    barBackgroundColor,
    barBackgroundSelectedColor,
    projectProgressColor,
    projectProgressSelectedColor,
    projectBackgroundColor,
    projectBackgroundSelectedColor,
    milestoneBackgroundColor,
    milestoneBackgroundSelectedColor,
    rtl,
    scrollX,
    onExpanderClick,
  ]);

  useEffect(() => {
    if (
      viewMode === dateSetup.viewMode &&
      ((viewDate && !currentViewDate) || (viewDate && currentViewDate?.valueOf() !== viewDate.valueOf()))
    ) {
      const dates = dateSetup.dates;
      const index = dates.findIndex(
        (d, i) =>
          viewDate.valueOf() >= d.valueOf() && i + 1 !== dates.length && viewDate.valueOf() < dates[i + 1].valueOf(),
      );
      if (index === -1) {
        return;
      }
      setCurrentViewDate(viewDate);
      setScrollX(columnWidth * index);
    }
  }, [viewDate, columnWidth, dateSetup.dates, dateSetup.viewMode, viewMode, currentViewDate, setCurrentViewDate]);

  useEffect(() => {
    const { changedTask, action } = ganttEvent;
    if (changedTask) {
      if (action === 'delete') {
        setGanttEvent({ action: '' });
        setBarTasks(barTasks.filter((t) => t.id !== changedTask.id));
      } else if (action === 'move' || action === 'end' || action === 'start' || action === 'progress') {
        const prevStateTask = barTasks.find((t) => t.id === changedTask.id);
        if (
          prevStateTask &&
          (prevStateTask.start.getTime() !== changedTask.start.getTime() ||
            prevStateTask.end.getTime() !== changedTask.end.getTime() ||
            prevStateTask.progress !== changedTask.progress)
        ) {
          // actions for change
          const newTaskList = barTasks.map((t) => (t.id === changedTask.id ? changedTask : t));
          setBarTasks(newTaskList);
        }
      }
    }
  }, [ganttEvent, barTasks]);

  useEffect(() => {
    if (failedTask) {
      setBarTasks(barTasks.map((t) => (t.id !== failedTask.id ? t : failedTask)));
      setFailedTask(null);
    }
  }, [failedTask, barTasks]);

  useEffect(() => {
    if (!listCellWidth) {
      setTaskListWidth(0);
    }
    if (taskListRef.current) {
      setTaskListWidth(taskListRef.current.offsetWidth);
    }
  }, [taskListRef, listCellWidth]);

  useEffect(() => {
    if (wrapperRef.current) {
      setSvgContainerWidth(wrapperRef.current.offsetWidth - taskListWidth);
    }
  }, [wrapperRef, taskListWidth]);

  useEffect(() => {
    if (ganttHeight) {
      setSvgContainerHeight(ganttHeight + headerHeight);
    } else {
      setSvgContainerHeight(tasks.length * rowHeight + headerHeight);
    }
  }, [ganttHeight, tasks, headerHeight, rowHeight]);

  // scroll events
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (event.shiftKey || event.deltaX) {
        const scrollMove = event.deltaX ? event.deltaX : event.deltaY;
        let newScrollX = scrollX + scrollMove;
        if (newScrollX < 0) {
          newScrollX = 0;
        } else if (newScrollX > svgWidth) {
          newScrollX = svgWidth;
        }
        setScrollX(newScrollX);
        event.preventDefault();
      } else if (ganttHeight) {
        let newScrollY = scrollY + event.deltaY;
        if (newScrollY < 0) {
          newScrollY = 0;
        } else if (newScrollY > ganttFullHeight - ganttHeight) {
          newScrollY = ganttFullHeight - ganttHeight;
        }
        if (newScrollY !== scrollY) {
          setScrollY(newScrollY);
          event.preventDefault();
        }
      }

      setIgnoreScrollEvent(true);
    };

    // subscribe if scroll is necessary
    wrapperRef.current?.addEventListener('wheel', handleWheel, {
      passive: false,
    });
    return () => {
      wrapperRef.current?.removeEventListener('wheel', handleWheel);
    };
  }, [wrapperRef, scrollY, scrollX, ganttHeight, svgWidth, rtl, ganttFullHeight]);

  const handleScrollY = (event: SyntheticEvent<HTMLDivElement>) => {
    if (scrollY !== event.currentTarget.scrollTop && !ignoreScrollEvent) {
      setScrollY(event.currentTarget.scrollTop);
      setIgnoreScrollEvent(true);
    } else {
      setIgnoreScrollEvent(false);
    }
  };

  const handleScrollX = (event: SyntheticEvent<HTMLDivElement>) => {
    if (scrollX !== event.currentTarget.scrollLeft && !ignoreScrollEvent) {
      setScrollX(event.currentTarget.scrollLeft);
      setIgnoreScrollEvent(true);
    } else {
      setIgnoreScrollEvent(false);
    }
  };

  /**
   * Handles arrow keys events and transform it to new scroll
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    let newScrollY = scrollY;
    let newScrollX = scrollX;
    let isX = true;
    switch (event.key) {
      case 'Down': // IE/Edge specific value
      case 'ArrowDown':
        newScrollY += rowHeight;
        isX = false;
        break;
      case 'Up': // IE/Edge specific value
      case 'ArrowUp':
        newScrollY -= rowHeight;
        isX = false;
        break;
      case 'Left':
      case 'ArrowLeft':
        newScrollX -= columnWidth;
        break;
      case 'Right': // IE/Edge specific value
      case 'ArrowRight':
        newScrollX += columnWidth;
        break;
    }
    if (isX) {
      if (newScrollX < 0) {
        newScrollX = 0;
      } else if (newScrollX > svgWidth) {
        newScrollX = svgWidth;
      }
      setScrollX(newScrollX);
    } else {
      if (newScrollY < 0) {
        newScrollY = 0;
      } else if (newScrollY > ganttFullHeight - ganttHeight) {
        newScrollY = ganttFullHeight - ganttHeight;
      }
      setScrollY(newScrollY);
    }
    setIgnoreScrollEvent(true);
  };

  /**
   * Task select event
   */
  const handleSelectedTask = (taskId: string) => {
    const newSelectedTask = barTasks.find((t) => t.id === taskId);
    const oldSelectedTask = barTasks.find((t) => !!selectedTask && t.id === selectedTask.id);
    if (onSelect) {
      if (oldSelectedTask) {
        onSelect(oldSelectedTask, false);
      }
      if (newSelectedTask) {
        onSelect(newSelectedTask, true);
      }
    }
    setSelectedTask(newSelectedTask);
  };
  const handleExpanderClick = (task: Task) => {
    if (onExpanderClick && task.hideChildren !== undefined) {
      onExpanderClick({ ...task, hideChildren: !task.hideChildren });
    }
  };
  const gridProps: GridProps = {
    columnWidth,
    svgWidth,
    tasks: tasks,
    rowHeight,
    dates: dateSetup.dates,
    todayColor,
    rtl,
  };
  const calendarProps: CalendarProps = {
    dateSetup,
    locale,
    viewMode,
    headerHeight,
    columnWidth,
    fontFamily,
    fontSize,
    rtl,
  };
  const barProps: TaskGanttContentProps = {
    tasks: barTasks,
    dates: dateSetup.dates,
    ganttEvent,
    selectedTask,
    rowHeight,
    taskHeight,
    columnWidth,
    arrowColor,
    timeStep,
    fontFamily,
    fontSize,
    arrowIndent,
    svgWidth,
    rtl,
    setGanttEvent,
    setFailedTask,
    setSelectedTask: handleSelectedTask,
    onDateChange,
    onProgressChange,
    onDoubleClick,
    onClick,
    onDelete,
  };

  // const tableProps: TaskListProps = {
  //   rowHeight,
  //   rowWidth: listCellWidth,
  //   fontFamily,
  //   fontSize,
  //   tasks: barTasks,
  //   locale,
  //   headerHeight,
  //   scrollY,
  //   ganttHeight,
  //   horizontalContainerClass: styles.horizontalContainer,
  //   selectedTask,
  //   taskListRef,
  //   setSelectedTask: handleSelectedTask,
  //   onExpanderClick: handleExpanderClick,
  //   TaskListHeader,
  //   TaskListTable,
  // };

  return (
    <div>
      <Toolbar />
      <div className={styles.wrapper} onKeyDown={handleKeyDown} tabIndex={0} ref={wrapperRef}>
        <TableBlockProvider
          service={ctx.service}
          {...ctx}
          params={{
            paginate: false,
          }}
        >
          <RecursionField name={'table'} schema={fieldSchema.properties.table} />
        </TableBlockProvider>
        {
          <TaskGantt
            gridProps={gridProps}
            calendarProps={calendarProps}
            barProps={barProps}
            ganttHeight={ganttHeight}
            scrollY={scrollY}
            scrollX={scrollX}
          />
        }
        {ganttEvent.changedTask && (
          <Tooltip
            arrowIndent={arrowIndent}
            rowHeight={rowHeight}
            svgContainerHeight={svgContainerHeight}
            svgContainerWidth={svgContainerWidth}
            fontFamily={fontFamily}
            fontSize={fontSize}
            scrollX={scrollX}
            scrollY={scrollY}
            task={ganttEvent.changedTask}
            headerHeight={headerHeight}
            taskListWidth={taskListWidth}
            TooltipContent={TooltipContent}
            rtl={rtl}
            svgWidth={svgWidth}
          />
        )}
        <VerticalScroll
          ganttFullHeight={ganttFullHeight}
          ganttHeight={ganttHeight}
          headerHeight={headerHeight}
          scroll={scrollY}
          onScroll={handleScrollY}
          rtl={rtl}
        />
      </div>
      <HorizontalScroll
        svgWidth={svgWidth}
        taskListWidth={taskListWidth}
        scroll={scrollX}
        rtl={rtl}
        onScroll={handleScrollX}
      />
    </div>
  );
};
