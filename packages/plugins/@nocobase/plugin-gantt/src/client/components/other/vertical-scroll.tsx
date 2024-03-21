import { cx } from '@emotion/css';
import React, { SyntheticEvent, useEffect, useRef } from 'react';
import useStyles from './style';

export const VerticalScroll: React.FC<{
  scroll: number;
  ganttHeight: number;
  ganttFullHeight: number;
  headerHeight: number;
  rtl: boolean;
  onScroll: (event: SyntheticEvent<HTMLDivElement>) => void;
}> = ({ scroll, ganttHeight, ganttFullHeight, headerHeight, rtl, onScroll }) => {
  const { styles } = useStyles();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scroll;
    }
  }, [scroll]);

  return (
    <div
      style={{
        maxHeight: ganttHeight,
        marginTop: headerHeight,
        marginLeft: rtl ? '' : '-1rem',
      }}
      className={cx(styles.nbGridOther, 'verticalScroll')}
      onScroll={onScroll}
      ref={scrollRef}
    >
      <div style={{ height: ganttFullHeight, width: 1 }} />
    </div>
  );
};
