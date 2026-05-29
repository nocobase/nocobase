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
  ganttHeight?: number;
  ganttFullHeight?: number;
  scrollY: number;
  ref: any;
  onHorizontalScroll?: (scrollLeft: number) => void;
  showLeftBorder?: boolean;
};
export const TaskGantt: React.FC<TaskGanttProps> = forwardRef(
  (
    {
      gridProps,
      calendarProps,
      barProps,
      ganttHeight,
      ganttFullHeight,
      scrollY,
      onHorizontalScroll,
      showLeftBorder = true,
    },
    ref: any,
  ) => {
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
      const container = ref.current;
      if (!container || !onHorizontalScroll) {
        return;
      }

      const handleScroll = () => {
        onHorizontalScroll(container.scrollLeft);
      };

      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }, [onHorizontalScroll, ref]);
    return (
      <div
        className={styles.ganttverticalcontainer}
        ref={ref}
        dir="ltr"
        style={{ borderLeft: showLeftBorder ? undefined : 'none' }}
      >
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
              height={ganttFullHeight ?? barProps.rowHeight * barProps.tasks.length}
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
