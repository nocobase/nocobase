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
import { Task } from '../../types/public-types';
import useStyles from './style';

type TooltipPosition = {
  left: number;
  top: number;
};

type GetTooltipPositionOptions = {
  task: BarTask;
  arrowIndent: number;
  rtl: boolean;
  svgContainerHeight: number;
  svgContainerWidth: number;
  headerHeight: number;
  scrollX: number;
  scrollY: number;
  tooltipHeight: number;
  tooltipWidth: number;
};

const clamp = (value: number, min: number, max: number) => {
  if (max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
};

export const getTooltipPosition = ({
  task,
  arrowIndent,
  rtl,
  svgContainerHeight,
  svgContainerWidth,
  headerHeight,
  scrollX,
  scrollY,
  tooltipHeight,
  tooltipWidth,
}: GetTooltipPositionOptions): TooltipPosition => {
  const gap = Math.max(8, arrowIndent);
  const minLeft = 0;
  const maxLeft = Math.max(0, svgContainerWidth - tooltipWidth);
  const minTop = headerHeight;
  const maxTop = Math.max(minTop, svgContainerHeight - tooltipHeight);
  const barLeft = Math.min(task.x1, task.x2) - scrollX;
  const barRight = Math.max(task.x1, task.x2) - scrollX;
  const barTop = task.y - scrollY + headerHeight;
  const barBottom = barTop + task.height;
  const barCenterX = (barLeft + barRight) / 2;
  const barCenterY = barTop + task.height / 2;

  const centeredLeft = clamp(barCenterX - tooltipWidth / 2, minLeft, maxLeft);
  const aboveTop = barTop - tooltipHeight - gap;
  if (aboveTop >= minTop) {
    return { left: centeredLeft, top: aboveTop };
  }

  const belowTop = barBottom + gap;
  if (belowTop + tooltipHeight <= svgContainerHeight) {
    return { left: centeredLeft, top: belowTop };
  }

  const centeredTop = clamp(barCenterY - tooltipHeight / 2, minTop, maxTop);
  const preferredSideLeft = rtl ? barLeft - gap - tooltipWidth : barRight + gap;
  if (preferredSideLeft >= minLeft && preferredSideLeft <= maxLeft) {
    return { left: preferredSideLeft, top: centeredTop };
  }

  const fallbackSideLeft = rtl ? barRight + gap : barLeft - gap - tooltipWidth;
  if (fallbackSideLeft >= minLeft && fallbackSideLeft <= maxLeft) {
    return { left: fallbackSideLeft, top: centeredTop };
  }

  return {
    left: centeredLeft,
    top: clamp(barBottom + gap, minTop, maxTop),
  };
};

export type TooltipProps = {
  task: BarTask;
  arrowIndent: number;
  rtl: boolean;
  svgContainerHeight: number;
  svgContainerWidth: number;
  svgWidth: number;
  headerHeight: number;
  scrollX: number;
  scrollY: number;
  fontSize: string;
  fontFamily: string;
  TooltipContent: React.FC<{
    task: Task;
    fontSize: string;
    fontFamily: string;
  }>;
};
export const Tooltip: React.FC<TooltipProps> = ({
  task,
  rtl,
  svgContainerHeight,
  svgContainerWidth,
  scrollX,
  scrollY,
  arrowIndent,
  fontSize,
  fontFamily,
  headerHeight,
  TooltipContent,
}) => {
  const { styles } = useStyles();
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  useEffect(() => {
    if (tooltipRef.current) {
      const tooltipHeight = tooltipRef.current.offsetHeight;
      const tooltipWidth = tooltipRef.current.offsetWidth;
      setPosition(
        getTooltipPosition({
          task,
          arrowIndent,
          rtl,
          svgContainerHeight,
          svgContainerWidth,
          headerHeight,
          scrollX,
          scrollY,
          tooltipHeight,
          tooltipWidth,
        }),
      );
    }
  }, [tooltipRef, task, arrowIndent, scrollX, scrollY, headerHeight, svgContainerHeight, svgContainerWidth, rtl]);

  return (
    <div
      ref={tooltipRef}
      className={cx(
        position ? styles.tooltipDetailsContainer : styles.tooltipDetailsContainerHidden,
        styles.nbGridOther,
      )}
      style={position ? { left: position.left, top: position.top } : undefined}
    >
      <TooltipContent task={task} fontSize={fontSize} fontFamily={fontFamily} />
    </div>
  );
};

export const StandardTooltipContent: React.FC<{
  task: Task;
  fontSize: string;
  fontFamily: string;
}> = ({ task, fontSize, fontFamily }) => {
  const { styles } = useStyles();
  const t = useT();
  const duration =
    task.end?.getTime?.() - task.start?.getTime?.() !== 0
      ? Math.round(((task.end?.getTime?.() - task.start?.getTime?.()) / (1000 * 60 * 60 * 24)) * 10) / 10 || ''
      : null;

  const style = {
    fontSize,
    fontFamily,
  };
  return (
    <div className={cx(styles.nbGridOther, styles.tooltipDefaultContainer)} aria-label="nb-gantt-tooltip" style={style}>
      <b style={{ fontSize: fontSize }}>
        {t('Task date range', {
          name: task.name,
          start: getYmd(task.start),
          end: getYmd(task.end),
          interpolation: { escapeValue: false },
        })}
      </b>
      {duration !== null && (
        <p className="tooltipDefaultContainerParagraph">
          {t('Duration: {{value}} day(s)', { value: duration, interpolation: { escapeValue: false } })}
        </p>
      )}

      <p className="tooltipDefaultContainerParagraph">
        {!!task.progress && t('Progress: {{value}}%', { value: task.progress, interpolation: { escapeValue: false } })}
      </p>
    </div>
  );
};
