/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import { MultiRecordResource, observer } from '@nocobase/flow-engine';
import { Table, theme } from 'antd';
import { debounce } from 'lodash';
import React, { SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { convertToBarTasks } from '../../../shared/helpers/bar-helper';
import { ganttDateRange, seedDates } from '../../../shared/helpers/date-helper';
import { removeHiddenTasks, sortTasks } from '../../../shared/helpers/other-helper';
import { BarTask } from '../../../shared/types/bar-task';
import { DateSetup } from '../../../shared/types/date-setup';
import { GanttEvent } from '../../../shared/types/gantt-task-actions';
import { Task } from '../../../shared/types/public-types';
import { CalendarProps } from '../../../shared/components/calendar/calendar';
import { GridProps } from '../../../shared/components/grid/grid';
import { HorizontalScroll } from '../../../shared/components/other/horizontal-scroll';
import { StandardTooltipContent, Tooltip } from '../../../shared/components/other/tooltip';
import { VerticalScroll } from '../../../shared/components/other/vertical-scroll';
import { TaskGantt } from '../../../shared/components/gantt/task-gantt';
import { TaskGanttContentProps } from '../../../shared/components/gantt/task-gantt-content';
import type { GanttBlockModel } from '../GanttBlockModel';

const getColumnWidth = (dataSetLength: any, clientWidth: any) => {
  return clientWidth / dataSetLength > 50 ? Math.floor(clientWidth / dataSetLength) + 20 : 60;
};

const ROW_SELECTION_COLUMN_WIDTH = 50;

const getGanttRowKey = (model: GanttBlockModel, record: any) => {
  const filterByTk = model.collection?.getFilterByTK?.(record);
  if (filterByTk !== undefined && filterByTk !== null) {
    return typeof filterByTk === 'object' ? JSON.stringify(filterByTk) : String(filterByTk);
  }
  return String(record?.id);
};

const measureElementHeight = (element: Element | null) => {
  return element?.getBoundingClientRect().height || 0;
};

export const GanttBlock = observer(
  ({ model }: { model: GanttBlockModel }) => {
    const { token } = theme.useToken();
    const {
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
      milestoneBackgroundColor = token.colorWarning,
      milestoneBackgroundSelectedColor = token.colorWarningActive,
      rtl = false,
      handleWidth = token.sizeXXS,
      timeStep = 300000,
      arrowColor = token.colorTextSecondary,
      fontFamily = token.fontFamily,
      fontSize = token.fontSize,
      arrowIndent = token.margin,
      todayColor = token.colorFillQuaternary,
      viewDate,
      TooltipContent = StandardTooltipContent,
      enableDragToReschedule = true,
    } = model.props || {};
    const fallbackHeaderHeight = token.controlHeight + token.paddingSM;
    const fallbackRowHeight = token.controlHeightLG + token.marginLG;
    const viewMode = model.getFieldNames().range || 'day';
    const wrapperRef = useRef<HTMLDivElement>(null);
    const verticalGanttContainerRef = useRef<HTMLDivElement>(null);
    const horizontalScrollRef = useRef<HTMLDivElement>(null);
    const ganttRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<HTMLDivElement>(null);
    const actionsTableRef = useRef<HTMLDivElement>(null);
    const [tableMetrics, setTableMetrics] = useState({
      headerHeight: fallbackHeaderHeight,
      rowHeight: fallbackRowHeight,
    });
    const [tasks, setTasks] = useState<Task[]>(() => model.getTasks());
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
    const { headerHeight, rowHeight } = tableMetrics;
    const taskHeight = useMemo(() => (rowHeight * barFill) / 100, [rowHeight, barFill]);
    const [selectedTask, setSelectedTask] = useState<BarTask>();
    const [failedTask, setFailedTask] = useState<BarTask | null>(null);
    const [scrollY, setScrollY] = useState(0);
    const syncingScrollRef = useRef(false);
    const scrollXRef = useRef(-1);
    const debounceHandleTaskChange = useMemo(
      () =>
        debounce(async (task: Task) => {
          const fieldNames = model.getFieldNames();
          const resource = model.resource as MultiRecordResource;
          await resource.update(model.getRecordFilterByTk((task as any).record, task.id), {
            [fieldNames.start]: task.start,
            [fieldNames.end]: task.end,
          });
          model.context.message?.success(model.context.t('Saved successfully'));
        }, 300),
      [model],
    );
    const debounceHandleProcessChange = useMemo(
      () =>
        debounce(async (task: Task) => {
          const fieldNames = model.getFieldNames();
          const resource = model.resource as MultiRecordResource;
          await resource.update(model.getRecordFilterByTk((task as any).record, task.id), {
            [fieldNames.progress]: task.progress / 100,
          });
          model.context.message?.success(model.context.t('Saved successfully'));
        }, 300),
      [model],
    );
    const columnWidth: number = getColumnWidth(dateSetup.dates.length, verticalGanttContainerRef.current?.clientWidth);
    const svgWidth = dateSetup.dates.length * columnWidth;
    const ganttFullHeight = barTasks.length * rowHeight;
    const bodyHeight = ganttHeight ? Math.min(ganttHeight, ganttFullHeight) : undefined;
    const selectedRowKeys = [];
    const loading = model.resource.loading;
    const resourceData = model.resource.getData();
    const fieldNamesProp = model.props?.fieldNames;
    const hideChildren = model.props?.hideChildren;
    const dragEnabled = model.props?.enableDragToReschedule;
    const showTable = model.props?.showTable !== false;
    const tableColumns = model.getColumns().filter((column: any) => column?.key !== 'empty');
    const showActionsTable = showTable && tableColumns.length > 0;
    const tableRecords = barTasks.map((task, index) => ({
      ...(task as any).record,
      __ganttTaskId: task.id,
      __ganttTaskIndex: index,
    }));
    const dataColumnWidth = tableColumns.reduce(
      (total, column: any) => total + (typeof column?.width === 'number' ? column.width : 0),
      0,
    );
    const tableWidth = (dataColumnWidth || 150) + ROW_SELECTION_COLUMN_WIDTH;

    const syncHorizontalScroll = useCallback((nextScrollX: number, source?: 'chart' | 'scrollbar') => {
      const normalizedScrollX = Math.max(0, nextScrollX);
      if (Math.abs(scrollXRef.current - normalizedScrollX) <= 1) {
        return;
      }

      scrollXRef.current = normalizedScrollX;
      const chartContainer = verticalGanttContainerRef.current;
      const scrollContainer = horizontalScrollRef.current;

      if (source !== 'chart' && chartContainer && Math.abs(chartContainer.scrollLeft - normalizedScrollX) > 1) {
        chartContainer.scrollLeft = normalizedScrollX;
      }
      if (source !== 'scrollbar' && scrollContainer && Math.abs(scrollContainer.scrollLeft - normalizedScrollX) > 1) {
        scrollContainer.scrollLeft = normalizedScrollX;
      }
    }, []);

    const setHorizontalScrollRef = useCallback(
      (element: HTMLDivElement | null) => {
        horizontalScrollRef.current = element;
        if (element && scrollXRef.current >= 0) {
          syncHorizontalScroll(scrollXRef.current);
        }
      },
      [syncHorizontalScroll],
    );

    const handleHorizontalScroll = useCallback(
      (nextScrollX: number) => {
        syncHorizontalScroll(nextScrollX, 'chart');
      },
      [syncHorizontalScroll],
    );

    useEffect(() => {
      setTasks(model.getTasks());
    }, [model, model.resource.loading, resourceData, fieldNamesProp, hideChildren, dragEnabled]);

    useEffect(() => {
      return () => {
        debounceHandleTaskChange.cancel();
        debounceHandleProcessChange.cancel();
      };
    }, [debounceHandleProcessChange, debounceHandleTaskChange]);

    useEffect(() => {
      const actionsTable = actionsTableRef.current;
      if (!actionsTable) {
        return;
      }

      let frameId = 0;
      const measureTableMetrics = () => {
        cancelAnimationFrame(frameId);
        frameId = requestAnimationFrame(() => {
          const nextHeaderHeight =
            measureElementHeight(actionsTable.querySelector('.ant-table-thead > tr')) ||
            measureElementHeight(actionsTable.querySelector('.ant-table-thead'));
          const nextRowHeight = measureElementHeight(actionsTable.querySelector('.ant-table-tbody > tr'));

          setTableMetrics((prev) => {
            const measuredHeaderHeight = nextHeaderHeight || prev.headerHeight;
            const measuredRowHeight = nextRowHeight || prev.rowHeight;

            if (prev.headerHeight === measuredHeaderHeight && prev.rowHeight === measuredRowHeight) {
              return prev;
            }

            return {
              headerHeight: measuredHeaderHeight,
              rowHeight: measuredRowHeight,
            };
          });
        });
      };

      measureTableMetrics();

      const resizeObserver = new ResizeObserver(measureTableMetrics);
      resizeObserver.observe(actionsTable);
      actionsTable
        .querySelectorAll('.ant-table-thead, .ant-table-tbody, .ant-table-thead > tr, .ant-table-tbody > tr')
        .forEach((element) => resizeObserver.observe(element));

      return () => {
        cancelAnimationFrame(frameId);
        resizeObserver.disconnect();
      };
    }, [tableColumns.length, tableRecords.length]);

    useEffect(() => {
      let filteredTasks: Task[];
      if (model.props?.hideChildren) {
        filteredTasks = removeHiddenTasks(tasks);
      } else {
        filteredTasks = tasks;
      }
      filteredTasks = [...filteredTasks].sort(sortTasks);
      const [startDate, endDate] = ganttDateRange(filteredTasks, viewMode, preStepsCount);
      let newDates = seedDates(startDate, endDate, viewMode);
      if (rtl) {
        newDates = newDates.reverse();
        if (scrollXRef.current === -1) {
          syncHorizontalScroll(newDates.length * columnWidth);
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
      model.props?.hideChildren,
      syncHorizontalScroll,
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
        syncHorizontalScroll(columnWidth * index);
      }
    }, [
      viewDate,
      columnWidth,
      dateSetup.dates,
      dateSetup.viewMode,
      viewMode,
      currentViewDate,
      setCurrentViewDate,
      syncHorizontalScroll,
    ]);

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
            setBarTasks(barTasks.map((t) => (t.id === changedTask.id ? changedTask : t)));
            setTasks((prevTasks) => prevTasks.map((task) => (task.id === changedTask.id ? changedTask : task)));
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
      setTaskListWidth(0);
    }, []);

    useEffect(() => {
      if (wrapperRef.current) {
        setSvgContainerWidth(chartRef.current?.offsetWidth || wrapperRef.current.offsetWidth - taskListWidth);
      }
    }, [wrapperRef, taskListWidth, tableWidth]);

    useEffect(() => {
      if (ganttHeight) {
        setSvgContainerHeight((bodyHeight || 0) + headerHeight);
      } else {
        setSvgContainerHeight(tasks.length * rowHeight + headerHeight);
      }
    }, [bodyHeight, ganttHeight, tasks, headerHeight, rowHeight]);

    useEffect(() => {
      const tableBody = actionsTableRef.current?.querySelector('.ant-table-body') as HTMLDivElement | null;
      if (tableBody && tableBody.scrollTop !== scrollY) {
        syncingScrollRef.current = true;
        tableBody.scrollTop = scrollY;
        requestAnimationFrame(() => {
          syncingScrollRef.current = false;
        });
      }
    }, [scrollY]);

    useEffect(() => {
      const tableBody = actionsTableRef.current?.querySelector('.ant-table-body') as HTMLDivElement | null;
      if (!tableBody) {
        return;
      }

      const handleActionsTableScroll = () => {
        if (syncingScrollRef.current) {
          return;
        }
        if (tableBody.scrollTop !== scrollY) {
          setScrollY(tableBody.scrollTop);
        }
      };

      tableBody.addEventListener('scroll', handleActionsTableScroll);
      return () => {
        tableBody.removeEventListener('scroll', handleActionsTableScroll);
      };
    }, [scrollY]);

    useEffect(() => {
      const wrapperNode = wrapperRef.current;
      const handleWheel = (event: WheelEvent) => {
        if (event.shiftKey || event.deltaX) {
          const scrollMove = event.deltaX ? event.deltaX : event.deltaY;
          let newScrollX = scrollXRef.current + scrollMove;
          if (newScrollX < 0) {
            newScrollX = 0;
          } else if (newScrollX > svgWidth) {
            newScrollX = svgWidth;
          }
          syncHorizontalScroll(newScrollX);
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
      };

      wrapperNode?.addEventListener('wheel', handleWheel, {
        passive: false,
      });
      return () => {
        wrapperNode?.removeEventListener('wheel', handleWheel);
      };
    }, [wrapperRef, scrollY, ganttHeight, svgWidth, rtl, ganttFullHeight, syncHorizontalScroll]);

    const handleScrollY = (event: SyntheticEvent<HTMLDivElement>) => {
      if (syncingScrollRef.current) {
        return;
      }
      if (scrollY !== event.currentTarget.scrollTop) {
        setScrollY(event.currentTarget.scrollTop);
      }
    };

    const handleScrollX = (event: SyntheticEvent<HTMLDivElement>) => {
      syncHorizontalScroll(event.currentTarget.scrollLeft, 'scrollbar');
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      let newScrollY = scrollY;
      let newScrollX = scrollXRef.current;
      let isX = true;
      switch (event.key) {
        case 'Down':
        case 'ArrowDown':
          newScrollY += rowHeight;
          isX = false;
          break;
        case 'Up':
        case 'ArrowUp':
          newScrollY -= rowHeight;
          isX = false;
          break;
        case 'Left':
        case 'ArrowLeft':
          newScrollX -= columnWidth;
          break;
        case 'Right':
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
        syncHorizontalScroll(newScrollX);
      } else {
        if (newScrollY < 0) {
          newScrollY = 0;
        } else if (newScrollY > ganttFullHeight - ganttHeight) {
          newScrollY = ganttFullHeight - ganttHeight;
        }
        setScrollY(newScrollY);
      }
    };

    const handleSelectedTask = (taskId: string) => {
      setSelectedTask(barTasks.find((t) => t.id === taskId));
    };
    const handleTaskClick = (task: Task) => {
      handleSelectedTask(task.id);
      void model.openEvent((task as any).record);
    };

    const handleProgressChange = async (task: Task) => {
      await debounceHandleProcessChange(task);
    };
    const handleTaskChange = async (task: Task) => {
      await debounceHandleTaskChange(task);
    };

    const gridProps: GridProps = {
      columnWidth,
      svgWidth,
      tasks: barTasks,
      rowHeight,
      dates: dateSetup.dates,
      todayColor,
      rtl,
      selectedRowKeys,
    };
    const calendarProps: CalendarProps = {
      dateSetup,
      locale: model.context.locale || 'en-US',
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
      onProgressChange: model.getFieldNames().progress && handleProgressChange,
      onClick: handleTaskClick,
      enableDragToReschedule,
      loading,
    };

    const tableClass = cx(css`
      .ant-table-container::after {
        box-shadow: none !important;
      }
    `);
    const contentClass = cx(css`
      position: relative;
      display: flex;
      align-items: stretch;
      width: 100%;
      overflow: hidden;
      border: 1px solid ${token.colorBorderSecondary};
      border-radius: ${token.borderRadius}px;
    `);
    const actionsColumnClass = cx(css`
      flex: 0 0 min(${tableWidth}px, 45%);
      width: min(${tableWidth}px, 45%);
      max-width: 45%;
      min-width: ${Math.min(tableWidth, 150)}px;
      background: ${token.colorBgContainer};
      border-inline-end: 1px solid ${token.colorBorderSecondary};
      overflow: hidden;
    `);
    const actionsTableClass = cx(css`
      .ant-table {
        background: ${token.colorBgContainer};
      }
      .ant-table-cell {
        border-color: ${token.colorSplit};
      }
    `);
    const chartClass = cx(css`
      flex: 1 1 auto;
      min-width: 0;
      position: relative;
    `);

    return (
      <div className={tableClass} ref={ganttRef}>
        <div onKeyDown={handleKeyDown} tabIndex={0} ref={wrapperRef}>
          <div className={contentClass}>
            {showActionsTable && (
              <div className={actionsColumnClass} ref={actionsTableRef}>
                <Table
                  className={actionsTableClass}
                  columns={tableColumns}
                  dataSource={tableRecords}
                  pagination={false}
                  rowKey={(record) => record.__ganttTaskId}
                  rowSelection={{
                    columnWidth: ROW_SELECTION_COLUMN_WIDTH,
                    type: 'checkbox',
                    selectedRowKeys: model.resource.getSelectedRows().map((row) => getGanttRowKey(model, row)),
                    onChange: (_selectedRowKeys, selectedRows) => {
                      model.resource.setSelectedRows(selectedRows);
                    },
                  }}
                  scroll={bodyHeight ? { y: bodyHeight } : undefined}
                  showSorterTooltip={false}
                />
              </div>
            )}
            <div className={chartClass} ref={chartRef}>
              <TaskGantt
                gridProps={gridProps}
                calendarProps={calendarProps}
                barProps={barProps}
                ganttHeight={bodyHeight}
                scrollY={scrollY}
                onHorizontalScroll={handleHorizontalScroll}
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
                  scrollX={scrollXRef.current}
                  scrollY={scrollY}
                  task={ganttEvent.changedTask}
                  headerHeight={headerHeight}
                  taskListWidth={taskListWidth}
                  TooltipContent={TooltipContent}
                  rtl={rtl}
                  svgWidth={svgWidth}
                />
              )}
              {bodyHeight && ganttFullHeight > bodyHeight && (
                <VerticalScroll
                  ganttFullHeight={ganttFullHeight}
                  ganttHeight={bodyHeight}
                  headerHeight={headerHeight}
                  scroll={scrollY}
                  onScroll={handleScrollY}
                  rtl={rtl}
                />
              )}
              <HorizontalScroll
                svgWidth={svgWidth}
                taskListWidth={taskListWidth}
                rtl={rtl}
                onScroll={handleScrollX}
                ref={setHorizontalScrollRef}
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
  { displayName: 'GanttBlock' },
);
