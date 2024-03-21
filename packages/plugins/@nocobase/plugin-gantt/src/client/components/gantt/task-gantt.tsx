import React, { forwardRef, useEffect, useRef } from 'react';
import { Calendar, CalendarProps } from '../calendar/calendar';
import { Grid, GridProps } from '../grid/grid';
import { TaskGanttContent, TaskGanttContentProps } from './task-gantt-content';
import useStyles from './style';

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
    const { styles } = useStyles();

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
      <div className={styles.ganttverticalcontainer} ref={ref} dir="ltr">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={gridProps.svgWidth}
          height={calendarProps.headerHeight}
          fontFamily={barProps.fontFamily}
          className="ganttHeader"
        >
          <Calendar {...calendarProps} />
        </svg>
        <div
          ref={horizontalContainerRef}
          className={styles.horizontalcontainer}
          style={ganttHeight ? { maxHeight: ganttHeight, width: gridProps.svgWidth } : { width: gridProps.svgWidth }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={gridProps.svgWidth}
            height={barProps.rowHeight * (barProps.tasks.length || 3)}
            fontFamily={barProps.fontFamily}
            ref={ganttSVGRef}
            className="ganttBody"
          >
            <Grid {...gridProps} />
            <TaskGanttContent {...newBarProps} />
          </svg>
        </div>
      </div>
    );
  },
);
TaskGantt.displayName = 'TaskGantt';
