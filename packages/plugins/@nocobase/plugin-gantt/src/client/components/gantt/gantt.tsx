import { css, cx } from '@emotion/css';
import { RecursionField, Schema, useFieldSchema } from '@formily/react';
import {
  ActionContextProvider,
  RecordProvider,
  useAPIClient,
  useBlockRequestContext,
  useCurrentAppInfo,
  useCollectionParentRecordData,
  useTableBlockContext,
  useToken,
  withDynamicSchemaProps,
  useProps,
} from '@nocobase/client';
import { message } from 'antd';
import { debounce } from 'lodash';
import React, { SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGanttBlockContext } from '../../GanttBlockProvider';
import { convertToBarTasks } from '../../helpers/bar-helper';
import { ganttDateRange, seedDates } from '../../helpers/date-helper';
import { removeHiddenTasks, sortTasks } from '../../helpers/other-helper';
import { BarTask } from '../../types/bar-task';
import { DateSetup } from '../../types/date-setup';
import { GanttEvent } from '../../types/gantt-task-actions';
import { Task } from '../../types/public-types';
import { CalendarProps } from '../calendar/calendar';
import { GridProps } from '../grid/grid';
import { HorizontalScroll } from '../other/horizontal-scroll';
import { StandardTooltipContent, Tooltip } from '../other/tooltip';
import { VerticalScroll } from '../other/vertical-scroll';
import useStyles from './style';
import { TaskGantt } from './task-gantt';
import { TaskGanttContentProps } from './task-gantt-content';

const getColumnWidth = (dataSetLength: any, clientWidth: any) => {
  const columnWidth = clientWidth / dataSetLength > 50 ? Math.floor(clientWidth / dataSetLength) + 20 : 50;
  return columnWidth;
};
export const DeleteEventContext = React.createContext({
  close: () => {},
});
const GanttRecordViewer = (props) => {
  const { visible, setVisible, record } = props;
  const parentRecordData = useCollectionParentRecordData();
  const fieldSchema = useFieldSchema();
  const eventSchema: Schema = fieldSchema.properties.detail;
  const close = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    eventSchema && (
      <DeleteEventContext.Provider value={{ close }}>
        <ActionContextProvider value={{ visible, setVisible }}>
          <RecordProvider record={record} parent={parentRecordData}>
            <RecursionField schema={eventSchema} name={eventSchema.name} />
          </RecordProvider>
        </ActionContextProvider>
      </DeleteEventContext.Provider>
    )
  );
};
const debounceHandleTaskChange = debounce(async (task: Task, resource, fieldNames, service, t) => {
  await resource.update({
    filterByTk: task.id,
    values: {
      [fieldNames.start]: task.start,
      [fieldNames.end]: task.end,
    },
  });
  message.success(t('Saved successfully'));
  await service?.refresh();
}, 300);

const debounceHandleProcessChange = debounce(async (task: Task, resource, fieldNames, service, t) => {
  await resource.update({
    filterByTk: task.id,
    values: {
      [fieldNames.progress]: task.progress / 100,
    },
  });
  message.success(t('Saved successfully'));
  await service?.refresh();
}, 300);

export const Gantt: any = withDynamicSchemaProps((props: any) => {
  const { styles } = useStyles();
  const { token } = useToken();
  const api = useAPIClient();
  const currentTheme = api.auth.getOption('theme');
  const tableRowHeight = currentTheme === 'compact' ? 45 : 55.56;
  const {
    headerHeight = document.querySelector('.ant-table-thead')?.clientHeight || 0, // 与 antd 表格头部高度一致
    listCellWidth = '155px',
    rowHeight = tableRowHeight,
    ganttHeight = 0,
    preStepsCount = 1,
    barFill = 60,
    barCornerRadius = token.borderRadiusXS,
    barProgressColor = token.colorPrimary,
    barProgressSelectedColor = token.colorPrimary,
    barBackgroundColor = token.colorPrimary,
    barBackgroundSelectedColor = token.colorPrimary,
    projectProgressColor = token.colorPrimary,
    projectProgressSelectedColor = token.colorPrimary,
    projectBackgroundColor = token.colorPrimary,
    projectBackgroundSelectedColor = token.colorPrimary,
    milestoneBackgroundColor = '#f1c453',
    milestoneBackgroundSelectedColor = '#f29e4c',
    rtl = false,
    handleWidth = 8,
    timeStep = 300000,
    arrowColor = 'grey',
    fontFamily = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`,
    fontSize = token.fontSize,
    arrowIndent = 20,
    todayColor = 'rgba(252, 248, 227, 0.5)',
    viewDate,
    TooltipContent = StandardTooltipContent,
    onDoubleClick,
    onDelete,
    onSelect,
    onExpanderClick,
    tasks,
    expandAndCollapseAll,
    fieldNames,
  } = useProps(props); // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
  const ctx = useGanttBlockContext();
  const appInfo = useCurrentAppInfo();
  const { t } = useTranslation();
  const locale = appInfo.data?.lang;
  const tableCtx = useTableBlockContext();
  const { resource, service } = useBlockRequestContext();
  const fieldSchema = useFieldSchema();
  const viewMode = fieldNames.range || 'day';
  const wrapperRef = useRef<HTMLDivElement>(null);
  const taskListRef = useRef<HTMLDivElement>(null);
  const verticalGanttContainerRef = useRef<HTMLDivElement>(null);
  const [dateSetup, setDateSetup] = useState<DateSetup>(() => {
    const [startDate, endDate] = ganttDateRange(tasks, viewMode, preStepsCount);
    return { viewMode, dates: seedDates(startDate, endDate, viewMode) };
  });
  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState<any>({});
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
  const [scrollY, setScrollY] = useState(0);
  const [scrollX, setScrollX] = useState(-1);
  const [ignoreScrollEvent, setIgnoreScrollEvent] = useState(false);
  const columnWidth: number = getColumnWidth(dateSetup.dates.length, verticalGanttContainerRef.current?.clientWidth);
  const svgWidth = dateSetup.dates.length * columnWidth;
  const ganttFullHeight = barTasks.length * rowHeight;
  const { expandFlag } = tableCtx;
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
    tableCtx.field.onExpandClick = handleTableExpanderClick;
    tableCtx.field.onRowSelect = handleRowSelect;
  }, []);
  useEffect(() => {
    expandAndCollapseAll?.(!expandFlag);
  }, [expandFlag]);
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
    tasks,
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
          prevStateTask.start &&
          prevStateTask.end &&
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
  const handleTableExpanderClick = (expanded: boolean, record: any) => {
    const task = ctx?.field?.data.find((v: any) => v.id === record.id + '');
    if (onExpanderClick && record.children.length) {
      onExpanderClick({ ...task, hideChildren: !expanded });
    }
  };

  const handleRowSelect = (keys) => {
    setSelectedRowKeys(keys);
  };
  const handleProgressChange = async (task: Task) => {
    debounceHandleProcessChange(task, resource, fieldNames, service, t);
  };
  const handleTaskChange = async (task: Task) => {
    debounceHandleTaskChange(task, resource, fieldNames, service, t);
  };
  const handleBarClick = (data) => {
    const flattenTree = (treeData) => {
      return treeData.reduce((acc, node) => {
        if (node.children) {
          return acc.concat([node, ...flattenTree(node.children)]);
        } else {
          return acc.concat(node);
        }
      }, []);
    };
    const flattenedData = flattenTree(service?.data?.data);
    const recordData = flattenedData?.find((item) => item.id === +data.id);
    if (!recordData) {
      return;
    }
    setRecord(recordData);
    setVisible(true);
  };
  const gridProps: GridProps = {
    columnWidth,
    svgWidth,
    tasks: tasks,
    rowHeight,
    dates: dateSetup.dates,
    todayColor,
    rtl,
    selectedRowKeys,
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
    onDateChange: handleTaskChange,
    onProgressChange: fieldNames.progress && handleProgressChange,
    onDoubleClick,
    onClick: handleBarClick,
    onDelete,
  };

  return (
    <div
      className={cx(css`
        .ant-table-container::after {
          box-shadow: none !important;
        }
        .ant-table-row {
          height: ${tableRowHeight}px;
        }
      `)}
    >
      <GanttRecordViewer visible={visible} setVisible={setVisible} record={record} />
      <RecursionField name={'anctionBar'} schema={fieldSchema.properties.toolBar} />
      <RecursionField name={'table'} schema={fieldSchema.properties.table} />
      <div className={styles.wrapper} onKeyDown={handleKeyDown} tabIndex={0} ref={wrapperRef}>
        <TaskGantt
          gridProps={gridProps}
          calendarProps={calendarProps}
          barProps={barProps}
          ganttHeight={ganttHeight}
          scrollY={scrollY}
          scrollX={scrollX}
          ref={verticalGanttContainerRef}
        />
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
        <HorizontalScroll
          svgWidth={svgWidth}
          taskListWidth={taskListWidth}
          scroll={scrollX}
          rtl={rtl}
          onScroll={handleScrollX}
        />
      </div>
    </div>
  );
});
