/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MultiRecordResource, observer } from '@nocobase/flow-engine';
import { Pagination, Table, theme } from 'antd';
import { debounce } from 'lodash';
import React, { SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { convertToBarTasks } from '../../shared/helpers/bar-helper';
import { ganttDateRange, seedDates } from '../../shared/helpers/date-helper';
import { BarTask } from '../../shared/types/bar-task';
import { DateSetup } from '../../shared/types/date-setup';
import { GanttEvent } from '../../shared/types/gantt-task-actions';
import { Task } from '../../shared/types/public-types';
import { CalendarProps } from '../../shared/components/calendar/calendar';
import { GridProps } from '../../shared/components/grid/grid';
import { HorizontalScroll } from '../../shared/components/other/horizontal-scroll';
import { StandardTooltipContent, Tooltip } from '../../shared/components/other/tooltip';
import { VerticalScroll } from '../../shared/components/other/vertical-scroll';
import { TaskGantt } from '../../shared/components/gantt/task-gantt';
import { TaskGanttContentProps } from '../../shared/components/gantt/task-gantt-content';
import type { GanttBlockModel } from '../GanttBlockModel';
import {
  clampHorizontalScrollLeft,
  getColumnWidth,
  getDateIndex,
  getGanttRowKey,
  getMaxHorizontalScrollLeft,
  mapHorizontalScrollLeft,
  measureMaxElementHeight,
  getRowNumber,
  measureElementHeight,
  ROW_SELECTION_COLUMN_WIDTH,
} from './GanttBlock.helpers';
import { createGanttBlockClassNames } from './GanttBlock.styles';
import { GANTT_TREE_CHILDREN_COLUMN, useGanttTree } from './GanttBlock.tree';

type ScrollToDatePayload = Date | { date: Date; behavior?: ScrollBehavior };

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
      todayColor = token.colorPrimaryBg,
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
    const [tableClientWidth, setTableClientWidth] = useState(0);
    const [svgContainerWidth, setSvgContainerWidth] = useState(0);
    const [chartScrollWidth, setChartScrollWidth] = useState(0);
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
    const scrolledToTodayOnFirstRenderRef = useRef(false);
    const scrollYRef = useRef(0);
    const scrollXRef = useRef(-1);
    const setScrollYValue = useCallback((nextScrollY: number) => {
      scrollYRef.current = nextScrollY;
      setScrollY(nextScrollY);
    }, []);
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
    const displayBarTasks = useMemo(() => {
      const { action, changedTask } = ganttEvent;
      if (!changedTask || (action !== 'move' && action !== 'end' && action !== 'start' && action !== 'progress')) {
        return barTasks;
      }

      let replaced = false;
      const nextTasks = barTasks.map((task) => {
        if (task.id !== changedTask.id) {
          return task;
        }

        replaced = true;
        return changedTask;
      });

      return replaced ? nextTasks : barTasks;
    }, [barTasks, ganttEvent]);
    const ganttFullHeight = displayBarTasks.length * rowHeight;
    const bodyHeight = ganttHeight ? Math.min(ganttHeight, ganttFullHeight) : undefined;
    const hasVerticalScroll = !!bodyHeight && ganttFullHeight > bodyHeight;
    const loading = model.resource.loading;
    const resourceData = model.resource.getData();
    const fieldNamesProp = model.props?.fieldNames;
    const dragEnabled = model.props?.enableDragToReschedule;
    const showTable = model.props?.showTable !== false;
    const scrollToTodayOnFirstRender = model.shouldScrollToTodayOnFirstRender();
    const showRowNumbers = model.shouldShowRowNumbers();
    const tableColumns = model.getColumns().filter((column: any) => column?.key !== 'empty');
    const showActionsTable = showTable && tableColumns.length > 0;
    const treeTableEnabled = model.isTreeTableEnabled();
    const tableContentWidth = model.getAutoTableWidth();
    const tableWidth = model.getTableWidth();
    const tableVisibleWidth = tableClientWidth || tableWidth;
    const hasHorizontalTableScroll = tableContentWidth > tableVisibleWidth + 1;
    const chartVisibleWidth = svgContainerWidth || chartRef.current?.offsetWidth || 0;
    const hasHorizontalGanttScroll = chartVisibleWidth > 0 && svgWidth > chartVisibleWidth + 1;
    const tableScroll = bodyHeight
      ? { y: bodyHeight, ...(hasHorizontalTableScroll ? { x: tableContentWidth } : {}) }
      : hasHorizontalTableScroll
        ? { x: tableContentWidth }
        : undefined;
    const { tableClass, contentClass, actionsColumnClass, actionsTableClass, chartClass, paginationClass } =
      createGanttBlockClassNames({
        token,
        tableWidth,
        hasVerticalScroll,
        hasHorizontalScroll: hasHorizontalGanttScroll,
        hasHorizontalTableScroll,
        rowHeight,
      });
    const { visibleTasks, tableRecords, resolvedTableColumns, expandable } = useGanttTree({
      model,
      tasks,
      tableColumns,
    });
    const selectedRowKeys = model.resource.getSelectedRows().map((row) => getGanttRowKey(model, row));
    const pagination = model.pagination();

    const getChartMaxScrollLeft = useCallback(() => {
      const chartContainer = verticalGanttContainerRef.current;
      if (chartContainer) {
        return getMaxHorizontalScrollLeft(chartContainer.scrollWidth, chartContainer.clientWidth);
      }
      return getMaxHorizontalScrollLeft(svgWidth, chartVisibleWidth);
    }, [chartVisibleWidth, svgWidth]);

    const getScrollbarMaxScrollLeft = useCallback(() => {
      const scrollContainer = horizontalScrollRef.current;
      if (scrollContainer) {
        return getMaxHorizontalScrollLeft(scrollContainer.scrollWidth, scrollContainer.clientWidth);
      }
      return getMaxHorizontalScrollLeft(svgWidth, chartVisibleWidth);
    }, [chartVisibleWidth, svgWidth]);

    const syncHorizontalScroll = useCallback(
      (nextScrollX: number, source?: 'chart' | 'scrollbar', behavior: ScrollBehavior = 'auto') => {
        const chartContainer = verticalGanttContainerRef.current;
        const scrollContainer = horizontalScrollRef.current;
        const chartMaxScrollLeft = getChartMaxScrollLeft();
        const scrollbarMaxScrollLeft = getScrollbarMaxScrollLeft();

        const chartScrollLeft =
          source === 'scrollbar'
            ? mapHorizontalScrollLeft({
                scrollLeft: nextScrollX,
                fromMaxScrollLeft: scrollbarMaxScrollLeft,
                toMaxScrollLeft: chartMaxScrollLeft,
              })
            : clampHorizontalScrollLeft(nextScrollX, chartMaxScrollLeft);

        const scrollbarScrollLeft =
          source === 'chart'
            ? mapHorizontalScrollLeft({
                scrollLeft: nextScrollX,
                fromMaxScrollLeft: chartMaxScrollLeft,
                toMaxScrollLeft: scrollbarMaxScrollLeft,
              })
            : source === 'scrollbar'
              ? clampHorizontalScrollLeft(nextScrollX, scrollbarMaxScrollLeft)
              : mapHorizontalScrollLeft({
                  scrollLeft: chartScrollLeft,
                  fromMaxScrollLeft: chartMaxScrollLeft,
                  toMaxScrollLeft: scrollbarMaxScrollLeft,
                });

        const normalizedChartScrollLeft =
          Math.abs(chartMaxScrollLeft - chartScrollLeft) <= 1 ? chartMaxScrollLeft : chartScrollLeft;
        const normalizedScrollbarScrollLeft =
          Math.abs(scrollbarMaxScrollLeft - scrollbarScrollLeft) <= 1 ? scrollbarMaxScrollLeft : scrollbarScrollLeft;

        scrollXRef.current = normalizedChartScrollLeft;

        if (
          source !== 'chart' &&
          chartContainer &&
          Math.abs(chartContainer.scrollLeft - normalizedChartScrollLeft) > 1
        ) {
          if (behavior === 'smooth' && typeof chartContainer.scrollTo === 'function') {
            chartContainer.scrollTo({ left: normalizedChartScrollLeft, behavior });
          } else {
            chartContainer.scrollLeft = normalizedChartScrollLeft;
          }
        }
        if (
          source !== 'scrollbar' &&
          scrollContainer &&
          Math.abs(scrollContainer.scrollLeft - normalizedScrollbarScrollLeft) > 1
        ) {
          if (behavior === 'smooth' && typeof scrollContainer.scrollTo === 'function') {
            scrollContainer.scrollTo({ left: normalizedScrollbarScrollLeft, behavior });
          } else {
            scrollContainer.scrollLeft = normalizedScrollbarScrollLeft;
          }
        }
      },
      [getChartMaxScrollLeft, getScrollbarMaxScrollLeft],
    );

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
    const scrollToDate = useCallback(
      (date: Date, behavior: ScrollBehavior = 'auto') => {
        const index = getDateIndex(date, dateSetup.dates);
        if (index === -1) {
          return false;
        }
        syncHorizontalScroll(columnWidth * index, undefined, behavior);
        return true;
      },
      [columnWidth, dateSetup.dates, syncHorizontalScroll],
    );

    useEffect(() => {
      setTasks(model.getTasks());
    }, [model, resourceData, fieldNamesProp, dragEnabled]);

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
      const getTableHeaderElement = () =>
        actionsTable.querySelector('.ant-table-thead > tr:not(.ant-table-measure-row)') ||
        actionsTable.querySelector('.ant-table-thead > tr') ||
        actionsTable.querySelector('.ant-table-thead');
      const getTableRowElement = () =>
        actionsTable.querySelector('.ant-table-tbody > tr.ant-table-row') ||
        actionsTable.querySelector('.ant-table-tbody > tr:not(.ant-table-measure-row)') ||
        actionsTable.querySelector('.ant-table-row');
      const getTableRowElements = () =>
        Array.from(actionsTable.querySelectorAll('.ant-table-tbody > tr:not(.ant-table-measure-row)'));
      const measureNaturalRowHeight = () => {
        const rows = getTableRowElements();
        const previousStyles = rows.map((row) => {
          const rowElement = row as HTMLElement;
          const cells = Array.from(row.children).filter((child) => child.tagName === 'TD') as HTMLElement[];
          const rowHeight = rowElement.style.height;
          const cellHeights = cells.map((cell) => cell.style.height);
          rowElement.style.height = 'auto';
          cells.forEach((cell) => {
            cell.style.height = 'auto';
          });
          return { row: rowElement, rowHeight, cells, cellHeights };
        });

        const nextRowHeight = measureMaxElementHeight(rows);

        previousStyles.forEach(({ row, rowHeight, cells, cellHeights }) => {
          row.style.height = rowHeight;
          cells.forEach((cell, index) => {
            cell.style.height = cellHeights[index];
          });
        });

        return nextRowHeight;
      };

      const measureTableMetrics = () => {
        cancelAnimationFrame(frameId);
        frameId = requestAnimationFrame(() => {
          const nextHeaderHeight = measureElementHeight(getTableHeaderElement());
          const nextRowHeight = measureNaturalRowHeight() || measureElementHeight(getTableRowElement());
          setTableClientWidth(actionsTable.clientWidth);

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
        .querySelectorAll(
          '.ant-table-thead, .ant-table-tbody, .ant-table-thead > tr, .ant-table-tbody > tr, .ant-table-row, .ant-table-body, .ant-table-content',
        )
        .forEach((element) => resizeObserver.observe(element));

      return () => {
        cancelAnimationFrame(frameId);
        resizeObserver.disconnect();
      };
    }, [bodyHeight, hasHorizontalTableScroll, tableColumns.length, tableRecords.length]);

    useEffect(() => {
      const filteredTasks = visibleTasks;
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
      visibleTasks,
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
      treeTableEnabled,
      syncHorizontalScroll,
    ]);

    useEffect(() => {
      if (!scrollToTodayOnFirstRender || scrolledToTodayOnFirstRenderRef.current || loading) {
        return;
      }

      if (scrollToDate(new Date())) {
        scrolledToTodayOnFirstRenderRef.current = true;
      }
    }, [dateSetup.viewMode, loading, scrollToDate, scrollToTodayOnFirstRender]);

    useEffect(() => {
      if (
        viewMode === dateSetup.viewMode &&
        ((viewDate && !currentViewDate) || (viewDate && currentViewDate?.valueOf() !== viewDate.valueOf()))
      ) {
        if (!scrollToDate(viewDate)) {
          return;
        }
        setCurrentViewDate(viewDate);
      }
    }, [viewDate, dateSetup.viewMode, viewMode, currentViewDate, setCurrentViewDate, scrollToDate]);

    useEffect(() => {
      const handleScrollToDate = (payload: ScrollToDatePayload) => {
        if (payload instanceof Date) {
          scrollToDate(payload);
          return;
        }

        if (payload?.date instanceof Date) {
          scrollToDate(payload.date, payload.behavior);
        }
      };

      model.emitter.on('scrollToDate', handleScrollToDate);
      return () => {
        model.emitter.off('scrollToDate', handleScrollToDate);
      };
    }, [model, scrollToDate]);

    useEffect(() => {
      const { changedTask, action } = ganttEvent;
      if (changedTask && action === 'delete') {
        setGanttEvent({ action: '' });
        setBarTasks((prevBarTasks) => prevBarTasks.filter((task) => task.id !== changedTask.id));
      }
    }, [ganttEvent]);

    useEffect(() => {
      if (failedTask) {
        setBarTasks((prevBarTasks) => prevBarTasks.map((task) => (task.id !== failedTask.id ? task : failedTask)));
        setFailedTask(null);
      }
    }, [failedTask]);

    useEffect(() => {
      if (wrapperRef.current) {
        setSvgContainerWidth(chartRef.current?.offsetWidth || wrapperRef.current.offsetWidth);
      }
    }, [wrapperRef, tableWidth]);

    useEffect(() => {
      const chartContainer = verticalGanttContainerRef.current;
      if (!chartContainer) {
        return;
      }

      const updateChartScrollMetrics = () => {
        setChartScrollWidth(chartContainer.scrollWidth);
      };

      updateChartScrollMetrics();
      const resizeObserver = new ResizeObserver(updateChartScrollMetrics);
      resizeObserver.observe(chartContainer);
      Array.from(chartContainer.children).forEach((child) => resizeObserver.observe(child));

      return () => {
        resizeObserver.disconnect();
      };
    }, [svgWidth, bodyHeight, headerHeight, displayBarTasks.length]);

    useEffect(() => {
      if (ganttHeight) {
        setSvgContainerHeight((bodyHeight || 0) + headerHeight);
      } else {
        setSvgContainerHeight(ganttFullHeight + headerHeight);
      }
    }, [bodyHeight, ganttHeight, ganttFullHeight, headerHeight]);

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
        if (tableBody.scrollTop !== scrollYRef.current) {
          setScrollYValue(tableBody.scrollTop);
        }
      };

      tableBody.addEventListener('scroll', handleActionsTableScroll);
      return () => {
        tableBody.removeEventListener('scroll', handleActionsTableScroll);
      };
    }, [bodyHeight, hasHorizontalTableScroll, setScrollYValue, showActionsTable, tableRecords.length]);

    useEffect(() => {
      const wrapperNode = wrapperRef.current;
      const handleWheel = (event: WheelEvent) => {
        if (event.shiftKey || event.deltaX) {
          const scrollMove = event.deltaX ? event.deltaX : event.deltaY;
          const newScrollX = clampHorizontalScrollLeft(scrollXRef.current + scrollMove, getChartMaxScrollLeft());
          syncHorizontalScroll(newScrollX);
          event.preventDefault();
        } else if (ganttHeight) {
          const currentScrollY = scrollYRef.current;
          let newScrollY = currentScrollY + event.deltaY;
          if (newScrollY < 0) {
            newScrollY = 0;
          } else if (newScrollY > ganttFullHeight - ganttHeight) {
            newScrollY = ganttFullHeight - ganttHeight;
          }
          if (newScrollY !== currentScrollY) {
            setScrollYValue(newScrollY);
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
    }, [wrapperRef, ganttHeight, ganttFullHeight, syncHorizontalScroll, getChartMaxScrollLeft, setScrollYValue]);

    const handleScrollY = (event: SyntheticEvent<HTMLDivElement>) => {
      if (syncingScrollRef.current) {
        return;
      }
      if (scrollYRef.current !== event.currentTarget.scrollTop) {
        setScrollYValue(event.currentTarget.scrollTop);
      }
    };

    const handleScrollX = (event: SyntheticEvent<HTMLDivElement>) => {
      syncHorizontalScroll(event.currentTarget.scrollLeft, 'scrollbar');
    };

    const handlePaginationChange = useCallback(
      async (page: number, pageSize: number) => {
        const nextPageSize = model.normalizePageSize(pageSize);
        if (model.resource.getPageSize() !== nextPageSize) {
          model.resource.setPage(1);
        } else {
          model.resource.setPage(page);
        }
        model.resource.loading = true;
        model.resource.setPageSize(nextPageSize);
        await model.resource.refresh();
        setScrollYValue(0);
      },
      [model, setScrollYValue],
    );

    const renderSelectionCell = useCallback(
      (checked: boolean, record: any, index: number, originNode: React.ReactNode) => {
        if (!showRowNumbers) {
          return originNode;
        }

        const rowIndex = Number.isFinite(Number(record.__ganttTaskIndex)) ? Number(record.__ganttTaskIndex) : index;
        const rowNumber = getRowNumber({
          page: model.resource.getPage(),
          pageSize: model.resource.getPageSize(),
          rowIndex,
          rowPath: record.__ganttTaskIndexPath,
        });

        return (
          <div
            role="button"
            aria-label={`table-index-${rowNumber}`}
            className={`nb-gantt-row-selection${checked ? ' checked' : ''}`}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 16,
              paddingRight: 0,
            }}
          >
            <div
              className="nb-gantt-table-index"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              {rowNumber}
            </div>
            <div
              className={`nb-gantt-origin-node${checked ? ' checked' : ''}`}
              style={{
                position: 'absolute',
                right: '50%',
                transform: 'translateX(50%)',
              }}
            >
              {originNode}
            </div>
          </div>
        );
      },
      [model.resource, showRowNumbers],
    );

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      let newScrollY = scrollYRef.current;
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
        newScrollX = clampHorizontalScrollLeft(newScrollX, getChartMaxScrollLeft());
        syncHorizontalScroll(newScrollX);
      } else {
        if (newScrollY < 0) {
          newScrollY = 0;
        } else if (newScrollY > ganttFullHeight - ganttHeight) {
          newScrollY = ganttFullHeight - ganttHeight;
        }
        setScrollYValue(newScrollY);
      }
    };

    const handleSelectedTask = (taskId: string) => {
      setSelectedTask(displayBarTasks.find((t) => t.id === taskId));
    };
    const handleTaskClick = async (task: Task) => {
      handleSelectedTask(task.id);
      await model.openEvent((task as any).record);
    };

    const commitChangedTask = (task: Task) => {
      const taskId = String(task.id);
      setTasks((prevTasks) => prevTasks.map((prevTask) => (String(prevTask.id) === taskId ? task : prevTask)));
      setBarTasks((prevBarTasks) =>
        prevBarTasks.map((prevTask) =>
          String(prevTask.id) === taskId ? ({ ...prevTask, ...task } as BarTask) : prevTask,
        ),
      );
    };

    const handleProgressChange = async (task: Task) => {
      commitChangedTask(task);
      await debounceHandleProcessChange(task);
    };
    const handleTaskChange = async (task: Task) => {
      commitChangedTask(task);
      await debounceHandleTaskChange(task);
    };

    const gridProps: GridProps = {
      columnWidth,
      svgWidth,
      tasks: displayBarTasks,
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
      tasks: displayBarTasks,
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

    return (
      <div className={tableClass} ref={ganttRef}>
        <div onKeyDown={handleKeyDown} tabIndex={0} ref={wrapperRef}>
          <div className={contentClass}>
            {showActionsTable && (
              <div className={actionsColumnClass} ref={actionsTableRef}>
                <Table
                  className={actionsTableClass}
                  columns={resolvedTableColumns}
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
                    renderCell: renderSelectionCell,
                  }}
                  scroll={tableScroll}
                  expandable={expandable}
                  childrenColumnName={GANTT_TREE_CHILDREN_COLUMN}
                  indentSize={15}
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
                ganttFullHeight={ganttFullHeight}
                scrollY={scrollY}
                onHorizontalScroll={handleHorizontalScroll}
                showLeftBorder={showActionsTable}
                ref={verticalGanttContainerRef}
              />
              {ganttEvent.changedTask && (
                <Tooltip
                  arrowIndent={arrowIndent}
                  svgContainerHeight={svgContainerHeight}
                  svgContainerWidth={svgContainerWidth}
                  fontFamily={fontFamily}
                  fontSize={fontSize}
                  scrollX={scrollXRef.current}
                  scrollY={scrollY}
                  task={ganttEvent.changedTask}
                  headerHeight={headerHeight}
                  TooltipContent={TooltipContent}
                  rtl={rtl}
                  svgWidth={svgWidth}
                />
              )}
              {hasVerticalScroll && (
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
                scrollWidth={chartScrollWidth || svgWidth}
                rtl={rtl}
                onScroll={handleScrollX}
                ref={setHorizontalScrollRef}
              />
            </div>
          </div>
          <div className={paginationClass}>
            <Pagination {...pagination} onChange={handlePaginationChange} />
          </div>
        </div>
      </div>
    );
  },
  { displayName: 'GanttBlock' },
);
