/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cx } from '@emotion/css';
import React, { useEffect, useRef, useState } from 'react';
import { useT } from '../../../locale';
import { getYmd } from '../../helpers/other-helper';
import { BarTask } from '../../types/bar-task';
import { GanttContentMoveAction } from '../../types/gantt-task-actions';
import { Bar } from './bar/bar';
import { BarSmall } from './bar/bar-small';
import { Milestone } from './milestone/milestone';
import { Project } from './project/project';
import useStyles from './style';

export type TaskItemProps = {
  task: BarTask;
  arrowIndent: number;
  taskHeight: number;
  isProgressChangeable: boolean;
  isDateChangeable: boolean;
  isDelete: boolean;
  isSelected: boolean;
  rtl: boolean;
  onEventStart: (
    action: GanttContentMoveAction,
    selectedTask: BarTask,
    event?: React.MouseEvent | React.KeyboardEvent,
  ) => any;
};

export const TaskItem: React.FC<TaskItemProps> = (props) => {
  const { styles } = useStyles();
  const t = useT();
  const { task, arrowIndent, isDelete, taskHeight, rtl, onEventStart } = {
    ...props,
  };
  const textRef = useRef<SVGTextElement>(null);
  const [textWidth, setTextWidth] = useState(0);
  const isProjectBar = task.typeInternal === 'project';
  const textY = isProjectBar ? task.y - 8 : task.y + taskHeight * 0.5;
  const label =
    isProjectBar && getYmd(task.start) && getYmd(task.end)
      ? t('Task date range', {
          name: task.name,
          start: getYmd(task.start),
          end: getYmd(task.end),
          interpolation: { escapeValue: false },
        })
      : task.name;
  const isTextInside = textWidth < task.x2 - task.x1;

  const renderTaskItem = () => {
    switch (task.typeInternal) {
      case 'milestone':
        return <Milestone {...props} />;
      case 'project':
        return <Project {...props} />;
      case 'smalltask':
        return <BarSmall {...props} />;
      default:
        return <Bar {...props} />;
    }
  };

  useEffect(() => {
    if (textRef.current) {
      const nextTextWidth = textRef.current.getBBox().width;
      setTextWidth((prevTextWidth) => (prevTextWidth === nextTextWidth ? prevTextWidth : nextTextWidth));
    }
  }, [label, task.x1, task.x2]);

  const getX = () => {
    const width = task.x2 - task.x1;
    const hasChild = task.barChildren.length > 0;
    if (isTextInside) {
      return task.x1 + width * 0.5;
    }
    if (rtl) {
      return task.x1 - textWidth - arrowIndent * +hasChild - arrowIndent * 0.2;
    } else {
      return task.x1 + width + arrowIndent * +hasChild + arrowIndent * 0.2;
    }
  };
  return (
    <g
      className={cx(styles.nbganttTaskitem)}
      onKeyDown={(e) => {
        switch (e.key) {
          case 'Delete': {
            if (isDelete) onEventStart('delete', task, e);
            break;
          }
        }
        e.stopPropagation();
      }}
      onMouseEnter={(e) => {
        onEventStart('mouseenter', task, e);
      }}
      onMouseLeave={(e) => {
        onEventStart('mouseleave', task, e);
      }}
      onDoubleClick={(e) => {
        onEventStart('dblclick', task, e);
      }}
      onClick={(e) => {
        onEventStart('click', task, e);
      }}
      onFocus={() => {
        onEventStart('select', task);
      }}
    >
      {renderTaskItem()}
      <text
        x={isProjectBar ? task.x1 : getX()}
        y={textY}
        className={isProjectBar ? cx('projectLabel') : isTextInside ? cx('barLabel') : cx('barLabelOutside')}
        textAnchor={isProjectBar ? 'start' : isTextInside ? 'middle' : 'start'}
        dominantBaseline="central"
        ref={textRef}
      >
        {label}
      </text>
    </g>
  );
};
