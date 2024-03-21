import { cx } from '@emotion/css';
import React from 'react';
import { TaskItemProps } from '../task-item';
import { projectBackground, projectWrapper } from './style';

export const Project: React.FC<TaskItemProps> = ({ task, isSelected }) => {
  const barColor = isSelected ? task.styles.backgroundSelectedColor : task.styles.backgroundColor;
  const processColor = isSelected ? task.styles.progressSelectedColor : task.styles.progressColor;
  const projectWith = task.x2 - task.x1;

  return (
    <g tabIndex={0} className={cx(projectWrapper)}>
      <rect
        fill={task.color || barColor}
        x={task.x1}
        width={projectWith}
        y={task.y}
        height={task.height}
        rx={task.barCornerRadius}
        ry={task.barCornerRadius}
        className={cx(projectBackground)}
      />
      <rect
        x={task.progressX}
        width={task.progressWidth}
        y={task.y}
        height={task.height}
        ry={task.barCornerRadius}
        rx={task.barCornerRadius}
        fill={task.color || processColor}
      />
    </g>
  );
};
