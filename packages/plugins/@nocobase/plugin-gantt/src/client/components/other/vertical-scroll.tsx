/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
