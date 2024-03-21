import { cx } from '@emotion/css';
import React from 'react';
import { getProgressPoint } from '../../../helpers/bar-helper';
import { TaskItemProps } from '../task-item';
import { BarDateHandle } from './bar-date-handle';
import { BarDisplay } from './bar-display';
import { BarProgressHandle } from './bar-progress-handle';
import { barWrapper } from './style';

export const Bar: React.FC<TaskItemProps> = ({
  task,
  isProgressChangeable,
  isDateChangeable,
  rtl,
  onEventStart,
  isSelected,
}) => {
  const progressPoint = getProgressPoint(+!rtl * task.progressWidth + task.progressX, task.y, task.height);
  const handleHeight = task.height - 2;
  return (
    <g className={cx(barWrapper)} aria-label="task-bar" tabIndex={0}>
      <BarDisplay
        x={task.x1}
        y={task.y}
        color={task.color}
        width={task.x2 - task.x1}
        height={task.height}
        progressX={task.progressX}
        progressWidth={task.progressWidth}
        barCornerRadius={task.barCornerRadius}
        styles={task.styles}
        isSelected={isSelected}
        onMouseDown={(e) => {
          isDateChangeable && onEventStart('move', task, e);
        }}
      />
      <g className="handleGroup">
        {isDateChangeable && (
          <g>
            {/* left */}
            <BarDateHandle
              x={task.x1 + 1}
              y={task.y + 1}
              width={task.handleWidth}
              height={handleHeight}
              barCornerRadius={task.barCornerRadius}
              onMouseDown={(e) => {
                onEventStart('start', task, e);
              }}
            />
            {/* right */}
            <BarDateHandle
              x={task.x2 - task.handleWidth - 1}
              y={task.y + 1}
              width={task.handleWidth}
              height={handleHeight}
              barCornerRadius={task.barCornerRadius}
              onMouseDown={(e) => {
                onEventStart('end', task, e);
              }}
            />
          </g>
        )}
        {isProgressChangeable && (
          <BarProgressHandle
            progressPoint={progressPoint}
            onMouseDown={(e) => {
              onEventStart('progress', task, e);
            }}
          />
        )}
      </g>
    </g>
  );
};
