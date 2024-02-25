import React, { SyntheticEvent, useEffect, useRef } from 'react';
import { cx } from '@emotion/css';
import useStyles from './style';

export const HorizontalScroll: React.FC<{
  scroll: number;
  svgWidth: number;
  taskListWidth: number;
  rtl: boolean;
  onScroll: (event: SyntheticEvent<HTMLDivElement>) => void;
}> = ({ scroll, svgWidth, taskListWidth, rtl, onScroll }) => {
  const { styles } = useStyles();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scroll;
    }
  }, [scroll]);

  return (
    <div
      dir="ltr"
      style={{
        margin: rtl ? `0px ${taskListWidth}px 0px 0px` : `0px 0px 0px ${taskListWidth}px`,
      }}
      className={cx(styles.nbGridOther, styles.scrollWrapper, 'gantt-horizontal-scoll')}
      onScroll={onScroll}
      ref={scrollRef}
    >
      <div style={{ width: svgWidth, height: 1 }} className="horizontalScroll" />
    </div>
  );
};
