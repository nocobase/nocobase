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
  rowHeight: number;
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
  rowHeight,
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
  const [relatedY, setRelatedY] = useState(0);
  const [relatedX, setRelatedX] = useState(0);
  useEffect(() => {
    if (tooltipRef.current) {
      const tooltipHeight = tooltipRef.current.offsetHeight * 1.1;
      const tooltipWidth = tooltipRef.current.offsetWidth * 1.1;

      let newRelatedY = task.index * rowHeight - scrollY + headerHeight;
      let newRelatedX: number;
      if (rtl) {
        newRelatedX = task.x1 - arrowIndent * 1.5 - tooltipWidth - scrollX;
        if (newRelatedX < 0) {
          newRelatedX = task.x2 + arrowIndent * 1.5 - scrollX;
        }
        const tooltipLeftmostPoint = tooltipWidth + newRelatedX;
        if (tooltipLeftmostPoint > svgContainerWidth) {
          newRelatedX = svgContainerWidth - tooltipWidth;
          newRelatedY += rowHeight;
        }
      } else {
        newRelatedX = task.x2 + arrowIndent * 1.5 - scrollX;
        const tooltipLeftmostPoint = tooltipWidth + newRelatedX;
        if (tooltipLeftmostPoint > svgContainerWidth) {
          newRelatedX = task.x1 - arrowIndent * 1.5 - scrollX - tooltipWidth;
        }
        if (newRelatedX < 0) {
          newRelatedX = svgContainerWidth - tooltipWidth;
          newRelatedY += rowHeight;
        }
      }

      const tooltipLowerPoint = tooltipHeight + newRelatedY - scrollY;
      if (tooltipLowerPoint > svgContainerHeight - scrollY) {
        newRelatedY = svgContainerHeight - tooltipHeight;
      }
      setRelatedY(newRelatedY);
      setRelatedX(newRelatedX);
    }
  }, [
    tooltipRef,
    task,
    arrowIndent,
    scrollX,
    scrollY,
    headerHeight,
    rowHeight,
    svgContainerHeight,
    svgContainerWidth,
    rtl,
  ]);

  return (
    <div
      ref={tooltipRef}
      className={cx(
        relatedX ? styles.tooltipDetailsContainer : styles.tooltipDetailsContainerHidden,
        styles.nbGridOther,
      )}
      style={{ left: relatedX, top: relatedY }}
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
