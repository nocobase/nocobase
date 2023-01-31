import React, { SyntheticEvent, useRef, useEffect } from "react";
import { cx } from '@emotion/css';
import {scrollWrapper,horizontalScroll} from './style'

export const HorizontalScroll: React.FC<{
  scroll: number;
  svgWidth: number;
  taskListWidth: number;
  rtl: boolean;
  onScroll: (event: SyntheticEvent<HTMLDivElement>) => void;
}> = ({ scroll, svgWidth, taskListWidth, rtl, onScroll }) => {
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
        margin: rtl
          ? `0px ${taskListWidth}px 0px 0px`
          : `0px 0px 0px ${taskListWidth}px`,
      }}
      className={cx(scrollWrapper)}
      onScroll={onScroll}
      ref={scrollRef}
    >
      <div style={{ width: svgWidth  }} className={cx(horizontalScroll)} />
    </div>
  );
};
