import React, { useRef, useEffect, forwardRef } from 'react';
import { cx } from '@emotion/css';
import { GridProps, Grid } from '../grid/grid';
import { CalendarProps, Calendar } from '../calendar/calendar';
import { TaskGanttContentProps, TaskGanttContent } from './task-gantt-content';
import { ganttVerticalContainer,horizontalContainer } from './style';


export type TaskGanttProps = {
  gridProps: GridProps;
  calendarProps: CalendarProps;
  barProps: TaskGanttContentProps;
  ganttHeight: number;
  scrollY: number;
  scrollX: number;
  ref:any
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
        >
          <Calendar {...calendarProps} />
        </svg>
        <div
          ref={horizontalContainerRef}
          className={cx(horizontalContainer)}
          style={ganttHeight ? { height: ganttHeight, width: gridProps.svgWidth } : { width: gridProps.svgWidth }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={gridProps.svgWidth}
            height={barProps.rowHeight * (barProps.tasks.length||3)}
            fontFamily={barProps.fontFamily}
            ref={ganttSVGRef}
          >
            <Grid {...gridProps} />
            <TaskGanttContent {...newBarProps} />
          </svg>
        </div>
      </div>
    );
  },
);
