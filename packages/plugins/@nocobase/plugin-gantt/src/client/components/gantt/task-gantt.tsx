/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { forwardRef, useEffect, useRef } from 'react';
import { Spin } from 'antd';
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
        <Spin spinning={barProps?.loading}>
          <div
            ref={horizontalContainerRef}
            className={styles.horizontalcontainer}
            style={ganttHeight ? { maxHeight: ganttHeight, width: gridProps.svgWidth } : { width: gridProps.svgWidth }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={gridProps.svgWidth}
              height={barProps.rowHeight * barProps.tasks.length || 166}
              fontFamily={barProps.fontFamily}
              ref={ganttSVGRef}
              className="ganttBody"
            >
              <Grid {...gridProps} />
              <TaskGanttContent {...newBarProps} />
            </svg>
          </div>
        </Spin>
      </div>
    );
  },
);
TaskGantt.displayName = 'TaskGantt';
