import { cx } from '@emotion/css';
import React, { forwardRef, useEffect, useRef } from 'react';
import { Calendar, CalendarProps } from '../calendar/calendar';
import { Grid, GridProps } from '../grid/grid';
import { ganttVerticalContainer, horizontalContainer } from './style';
import { TaskGanttContent, TaskGanttContentProps } from './task-gantt-content';

export type TaskGanttProps = {
  gridProps: GridProps;
  calendarProps: CalendarProps;
  barProps: TaskGanttContentProps;
  ganttHeight: number;
  scrollY: number;
  scrollX: number;
  ref: any;
};
export const TaskGantt: React.FC<TaskGanttProps> = forwardRef(
  ({ gridProps, calendarProps, barProps, ganttHeight, scrollY, scrollX }, ref: any) => {
    const ganttSVGRef = useRef<SVGSVGElement>(null);
    const horizontalContainerRef = useRef<HTMLDivElement>(null);
    const newBarProps = { ...barProps, svg: ganttSVGRef };
    useEffect(() => {
      if (horizontalContainerRef.current) {
        horizontalContainerRef.current.scrollTop = scrollY;
      }
    }, [scrollY]);

    useEffect(() => {
      if (ref.current) {
        ref.current.scrollLeft = scrollX;
      }
    }, [scrollX]);

    return (
      <div className={cx(ganttVerticalContainer)} ref={ref} dir="ltr">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={gridProps.svgWidth}
          height={calendarProps.headerHeight}
          fontFamily={barProps.fontFamily}
          style={{ borderBottom: '1px solid #f0f0f0', fontWeight: 700 }}
        >
          <Calendar {...calendarProps} />
        </svg>
        <div
          ref={horizontalContainerRef}
          className={cx(horizontalContainer)}
          style={ganttHeight ? { maxHeight: ganttHeight, width: gridProps.svgWidth } : { width: gridProps.svgWidth }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={gridProps.svgWidth}
            height={barProps.rowHeight * (barProps.tasks.length || 3)}
            fontFamily={barProps.fontFamily}
            ref={ganttSVGRef}
            style={{ borderBottom: '1px solid #f0f0f0' }}
          >
            <Grid {...gridProps} />
            <TaskGanttContent {...newBarProps} defaultStart={calendarProps.dateSetup.dates[0]} />
          </svg>
        </div>
      </div>
    );
  },
);
