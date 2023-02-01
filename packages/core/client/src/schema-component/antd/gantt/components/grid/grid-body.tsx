import React, { ReactChild } from 'react';
import { cx } from '@emotion/css';
import { Task } from '../../types/public-types';
import { addToDate } from '../../helpers/date-helper';
import { gridRowLine, gridRow, gridTick } from './style';
import { uid } from '@nocobase/utils/client';

export type GridBodyProps = {
  tasks: Task[];
  dates: Date[];
  svgWidth: number;
  rowHeight: number;
  columnWidth: number;
  todayColor: string;
  rtl: boolean;
};
const empty = [{ id: uid() }, { id: uid() }, { id: uid() }];
export const GridBody: React.FC<GridBodyProps> = ({
  tasks,
  dates,
  rowHeight,
  svgWidth,
  columnWidth,
  todayColor,
  rtl,
}) => {
  const data = tasks.length ? tasks : empty;
  let y = 0;
  const gridRows: ReactChild[] = [];
  const rowLines: ReactChild[] = [
    <line key="RowLineFirst" x="0" y1={0} x2={svgWidth} y2={0} className={cx(gridRowLine)} />,
  ];
  for (const task of data) {
    gridRows.push(
      <rect key={'Row' + task.id} x="0" y={y} width={svgWidth} height={rowHeight} className={cx(gridRow)} />,
    );
    rowLines.push(
      <line
        key={'RowLine' + task.id}
        x="0"
        y1={y + rowHeight}
        x2={svgWidth}
        y2={y + rowHeight}
        className={cx(gridRowLine)}
      />,
    );
    y += rowHeight;
  }

  const now = new Date();
  let tickX = 0;
  const ticks: ReactChild[] = [];
  let today: ReactChild = <rect />;
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    ticks.push(<line key={date.getTime()} x1={tickX} y1={0} x2={tickX} y2={y} className={cx(gridTick)} />);
    if (
      (i + 1 !== dates.length && date.getTime() < now.getTime() && dates[i + 1].getTime() >= now.getTime()) ||
      // if current date is last
      (i !== 0 &&
        i + 1 === dates.length &&
        date.getTime() < now.getTime() &&
        addToDate(date, date.getTime() - dates[i - 1].getTime(), 'millisecond').getTime() >= now.getTime())
    ) {
      today = <rect x={tickX} y={0} width={columnWidth} height={y} fill={todayColor} />;
    }
    // rtl for today
    if (rtl && i + 1 !== dates.length && date.getTime() >= now.getTime() && dates[i + 1].getTime() < now.getTime()) {
      today = <rect x={tickX + columnWidth} y={0} width={columnWidth} height={y} fill={todayColor} />;
    }
    tickX += columnWidth;
  }
  return (
    <g className="gridBody">
      <g className="rows">{gridRows}</g>
      <g className="rowLines">{rowLines}</g>
      <g className="ticks">{ticks}</g>
      <g className="today">{today}</g>
    </g>
  );
};
