/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EventOption } from '../../types/public-types';
import { BarTask } from '../../types/bar-task';
import { Arrow } from '../other/arrow';
import { handleTaskBySVGMouseEvent } from '../../helpers/bar-helper';
import { isKeyboardEvent } from '../../helpers/other-helper';
import { TaskItem } from '../task-item/task-item';
import { BarMoveAction, GanttContentMoveAction, GanttEvent } from '../../types/gantt-task-actions';

export type TaskGanttContentProps = {
  tasks: BarTask[];
  dates: Date[];
  ganttEvent: GanttEvent;
  selectedTask: BarTask | undefined;
  rowHeight: number;
  columnWidth: number;
  timeStep: number;
  svg?: React.RefObject<SVGSVGElement>;
  svgWidth: number;
  taskHeight: number;
  arrowColor: string;
  arrowIndent: number;
  fontSize: string;
  fontFamily: string;
  rtl: boolean;
  setGanttEvent: (value: GanttEvent) => void;
  setFailedTask: (value: BarTask | null) => void;
  setSelectedTask: (taskId: string) => void;
  loading?: boolean;
  enableDragToReschedule?: boolean;
} & EventOption;

export const TaskGanttContent: React.FC<TaskGanttContentProps> = ({
  tasks,
  dates,
  ganttEvent,
  selectedTask,
  rowHeight,
  columnWidth,
  timeStep,
  svg,
  taskHeight,
  arrowColor,
  arrowIndent,
  fontFamily,
  fontSize,
  rtl,
  setGanttEvent,
  setFailedTask,
  setSelectedTask,
  onDateChange,
  onProgressChange,
  onDoubleClick,
  onClick,
  onDelete,
  enableDragToReschedule = true,
}) => {
  const [xStep, setXStep] = useState(0);
  const [initEventX1Delta, setInitEventX1Delta] = useState(0);
  const ganttEventRef = useRef(ganttEvent);
  const xStepRef = useRef(xStep);
  const initEventX1DeltaRef = useRef(initEventX1Delta);
  const rtlRef = useRef(rtl);
  const mouseLeaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClickListenerRef = useRef<((event: MouseEvent) => void) | null>(null);
  const suppressClickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  ganttEventRef.current = ganttEvent;
  xStepRef.current = xStep;
  initEventX1DeltaRef.current = initEventX1Delta;
  rtlRef.current = rtl;
  const taskById = useMemo(() => new Map(tasks.map((task) => [String(task.id), task])), [tasks]);
  const hasChangedTask = !!ganttEvent.changedTask;

  useEffect(() => {
    const clearSuppressedClick = () => {
      if (suppressClickListenerRef.current) {
        window.removeEventListener('click', suppressClickListenerRef.current, true);
        suppressClickListenerRef.current = null;
      }
      if (suppressClickTimeoutRef.current) {
        clearTimeout(suppressClickTimeoutRef.current);
        suppressClickTimeoutRef.current = null;
      }
    };

    return () => {
      if (mouseLeaveTimeoutRef.current) {
        clearTimeout(mouseLeaveTimeoutRef.current);
      }
      clearSuppressedClick();
    };
  }, []);

  const clearSuppressedClick = useCallback(() => {
    if (suppressClickListenerRef.current) {
      window.removeEventListener('click', suppressClickListenerRef.current, true);
      suppressClickListenerRef.current = null;
    }
    if (suppressClickTimeoutRef.current) {
      clearTimeout(suppressClickTimeoutRef.current);
      suppressClickTimeoutRef.current = null;
    }
  }, []);

  const suppressUpcomingClick = useCallback(() => {
    clearSuppressedClick();

    const handleSuppressedClick = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      clearSuppressedClick();
    };

    suppressClickListenerRef.current = handleSuppressedClick;
    window.addEventListener('click', handleSuppressedClick, true);
    suppressClickTimeoutRef.current = setTimeout(() => {
      clearSuppressedClick();
    }, 0);
  }, [clearSuppressedClick]);

  // create xStep
  useEffect(() => {
    const dateDelta =
      dates[1]?.getTime() -
      dates[0]?.getTime() -
      dates[1]?.getTimezoneOffset() * 60 * 1000 +
      dates[0]?.getTimezoneOffset() * 60 * 1000;
    const newXStep = (timeStep * columnWidth) / dateDelta;
    setXStep(newXStep);
  }, [columnWidth, dates, timeStep]);

  const getSvgCursorX = useCallback(
    (event: Pick<MouseEvent | React.MouseEvent, 'clientX'>, svgElement = svg?.current) => {
      const screenCTM = svgElement?.getScreenCTM();
      if (!svgElement || !screenCTM) {
        return null;
      }

      const point = svgElement.createSVGPoint();
      point.x = event.clientX;
      return point.matrixTransform(screenCTM.inverse()).x;
    },
    [svg],
  );

  useEffect(() => {
    const svgElement = svg?.current;
    const handleMouseMove = async (event: MouseEvent) => {
      const currentEvent = ganttEventRef.current;
      if (!currentEvent.changedTask || !svgElement) return;
      event.preventDefault();

      const cursorX = getSvgCursorX(event, svgElement);
      if (cursorX === null) {
        return;
      }

      const { isChanged, changedTask } = handleTaskBySVGMouseEvent(
        cursorX,
        currentEvent.action as BarMoveAction,
        currentEvent.changedTask,
        xStepRef.current,
        timeStep,
        initEventX1DeltaRef.current,
        rtlRef.current,
      );
      if (isChanged) {
        setGanttEvent({
          ...currentEvent,
          changedTask,
        });
      }
    };

    const handleMouseUp = async (event: MouseEvent) => {
      const { action, originalSelectedTask, changedTask } = ganttEventRef.current;
      if (!changedTask || !svgElement || !originalSelectedTask) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        setGanttEvent({ action: '' });
        return;
      }
      event.preventDefault();

      const cursorX = getSvgCursorX(event, svgElement);
      if (cursorX === null) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        setGanttEvent({ action: '' });
        return;
      }

      const { changedTask: newChangedTask } = handleTaskBySVGMouseEvent(
        cursorX,
        action as BarMoveAction,
        changedTask,
        xStepRef.current,
        timeStep,
        initEventX1DeltaRef.current,
        rtlRef.current,
      );

      const isNotLikeOriginal =
        originalSelectedTask.start !== newChangedTask.start ||
        originalSelectedTask.end !== newChangedTask.end ||
        originalSelectedTask.progress !== newChangedTask.progress;
      const shouldSuppressClick = action === 'start' || action === 'end' || action === 'progress' || isNotLikeOriginal;

      // remove listeners
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setGanttEvent({ action: '' });
      if (shouldSuppressClick) {
        suppressUpcomingClick();
      }

      // custom operation start
      let operationSuccess: any = true;
      if ((action === 'move' || action === 'end' || action === 'start') && onDateChange && isNotLikeOriginal) {
        try {
          const result = await onDateChange(newChangedTask, newChangedTask.barChildren);
          if (result !== undefined) {
            operationSuccess = result;
          }
        } catch (error) {
          operationSuccess = false;
        }
      } else if (onProgressChange && isNotLikeOriginal) {
        try {
          const result = await onProgressChange(newChangedTask, newChangedTask.barChildren);
          if (result !== undefined) {
            operationSuccess = result;
          }
        } catch (error) {
          operationSuccess = false;
        }
      }

      // If operation is failed - return old state
      if (!operationSuccess) {
        setFailedTask(originalSelectedTask);
      }
    };

    if (
      (ganttEvent.action === 'move' ||
        ganttEvent.action === 'end' ||
        ganttEvent.action === 'start' ||
        ganttEvent.action === 'progress') &&
      hasChangedTask &&
      svgElement
    ) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    ganttEvent.action,
    hasChangedTask,
    onProgressChange,
    timeStep,
    onDateChange,
    svg,
    getSvgCursorX,
    suppressUpcomingClick,
    setFailedTask,
    setGanttEvent,
  ]);

  /**
   * Method is Start point of task change
   */
  const handleBarEventStart = async (
    action: GanttContentMoveAction,
    task: BarTask,
    event?: React.MouseEvent | React.KeyboardEvent,
  ) => {
    if (!event) {
      if (action === 'select') {
        setSelectedTask(task.id);
      }
    }
    // Keyboard events
    else if (isKeyboardEvent(event)) {
      if (action === 'delete') {
        if (onDelete) {
          try {
            const result = await onDelete(task);
            if (result !== undefined && result) {
              setGanttEvent({ action, changedTask: task });
            }
          } catch (error) {
            console.error('Error on Delete. ' + error);
          }
        }
      }
    }
    // Mouse Events
    else if (action === 'mouseenter') {
      if (mouseLeaveTimeoutRef.current) {
        clearTimeout(mouseLeaveTimeoutRef.current);
        mouseLeaveTimeoutRef.current = null;
      }

      const currentEvent = ganttEventRef.current;
      if (!currentEvent.action || currentEvent.action === 'mouseenter') {
        setGanttEvent({
          action,
          changedTask: task,
          originalSelectedTask: task,
        });
      }
    } else if (action === 'mouseleave') {
      const leavingTaskId = task.id;
      if (ganttEventRef.current.action === 'mouseenter') {
        if (mouseLeaveTimeoutRef.current) {
          clearTimeout(mouseLeaveTimeoutRef.current);
        }

        mouseLeaveTimeoutRef.current = setTimeout(() => {
          const currentEvent = ganttEventRef.current;
          if (currentEvent.action === 'mouseenter' && currentEvent.changedTask?.id === leavingTaskId) {
            setGanttEvent({ action: '' });
          }
          mouseLeaveTimeoutRef.current = null;
        }, 300);
      }
    } else if (action === 'dblclick') {
      !!onDoubleClick && onDoubleClick(task);
    } else if (action === 'click') {
      setGanttEvent({ action: '' });
      !!onClick && onClick(task);
    }
    // Change task event start
    else if (action === 'move') {
      const cursorX = getSvgCursorX(event);
      if (cursorX === null) return;
      setInitEventX1Delta(cursorX - task.x1);
      setGanttEvent({
        action,
        changedTask: task,
        originalSelectedTask: task,
      });
    } else {
      setGanttEvent({
        action,
        changedTask: task,
        originalSelectedTask: task,
      });
    }
  };

  const handleBarEvent = (action, task, event) => {
    handleBarEventStart(action, task, event);
  };
  return (
    <g className="content">
      <g className="arrows" fill={arrowColor} stroke={arrowColor}>
        {tasks.map((task) => {
          return task.barChildren.map((child) => {
            const taskTo = taskById.get(String(child.id));
            if (!taskTo) {
              return null;
            }

            return (
              <Arrow
                key={`Arrow from ${task.id} to ${child.id}`}
                taskFrom={task}
                taskTo={taskTo}
                rowHeight={rowHeight}
                taskHeight={taskHeight}
                arrowIndent={arrowIndent}
                rtl={rtl}
              />
            );
          });
        })}
      </g>
      <g className="bar" fontFamily={fontFamily} fontSize={fontSize}>
        {tasks.map((task) => {
          return (
            <TaskItem
              task={task}
              arrowIndent={arrowIndent}
              taskHeight={taskHeight}
              isProgressChangeable={!!onProgressChange && !task.isDisabled}
              isDateChangeable={enableDragToReschedule && !!onDateChange && !task.isDisabled}
              isDelete={!task.isDisabled}
              onEventStart={handleBarEvent}
              key={task.id}
              isSelected={!!selectedTask && task.id === selectedTask.id}
              rtl={rtl}
            />
          );
        })}
      </g>
    </g>
  );
};
