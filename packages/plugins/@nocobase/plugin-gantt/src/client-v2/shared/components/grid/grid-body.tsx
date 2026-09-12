/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cx } from '@emotion/css';
import React, { ReactNode } from 'react';
import { addToDate } from '../../helpers/date-helper';
import { Task } from '../../types/public-types';
import useStyles from './style';

export type GridBodyProps = {
  tasks: Task[];
  dates: Date[];
  svgWidth: number;
  rowHeight: number;
  columnWidth: number;
  todayColor: string;
  rtl: boolean;
  selectedRowKeys: React.Key[];
};
export const GridBody: React.FC<GridBodyProps> = ({
  tasks,
  dates,
  rowHeight,
  svgWidth,
  columnWidth,
  todayColor,
  rtl,
  selectedRowKeys,
}) => {
  const { styles } = useStyles();

  const data = tasks;
  const fullHeight = data.length * rowHeight;
  const selectedRowKeySet = new Set(selectedRowKeys?.map((key) => String(key)));
  let y = 0;
  const gridRows: ReactNode[] = [];
  const rowLines: ReactNode[] = [
    <line key="RowLineFirst" x1={0} y1={0} x2={svgWidth} y2={0} className={styles.gridRowLine} />,
  ];
  for (const task of data) {
    if (selectedRowKeySet.has(String(task.id))) {
      gridRows.push(
        <rect
          key={'Row' + task.id}
          x={0}
          y={y}
          width={svgWidth}
          height={rowHeight}
          className={styles.gridSelectedRow}
        />,
      );
    }
    rowLines.push(
      <line
        key={'RowLine' + task.id}
        x1={0}
        y1={y + rowHeight}
        x2={svgWidth}
        y2={y + rowHeight}
        className={styles.gridRowLine}
      />,
    );
    y += rowHeight;
  }

  const now = new Date();
  let tickX = 0;
  const columnShades: ReactNode[] = [];
  let today: ReactNode = null;
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    if (i % 2 === 1) {
      columnShades.push(
        <rect
          key={`ColumnShade${date.getTime()}`}
          x={tickX}
          y={0}
          width={columnWidth}
          height={fullHeight}
          className={styles.gridColumnShade}
        />,
      );
    }
    if (
      (i + 1 !== dates.length && date.getTime() < now.getTime() && dates[i + 1].getTime() >= now.getTime()) ||
      // if current date is last
      (i !== 0 &&
        i + 1 === dates.length &&
        date.getTime() < now.getTime() &&
        addToDate(date, date.getTime() - dates[i - 1].getTime(), 'millisecond').getTime() >= now.getTime())
    ) {
      today = <rect x={tickX} y={0} width={columnWidth} height={fullHeight} fill={todayColor} />;
    }
    // rtl for today
    if (rtl && i + 1 !== dates.length && date.getTime() >= now.getTime() && dates[i + 1].getTime() < now.getTime()) {
      today = <rect x={tickX + columnWidth} y={0} width={columnWidth} height={fullHeight} fill={todayColor} />;
    }
    tickX += columnWidth;
  }
  return (
    <g className={cx('gridBody')}>
      <g className="background">
        <rect x={0} y={0} width={svgWidth} height={fullHeight} className={styles.gridBackground} />
      </g>
      <g className="columns">{columnShades}</g>
      <g className="today">{today}</g>
      <g className="rows">{gridRows}</g>
      <g className="rowLines">{rowLines}</g>
    </g>
  );
};
