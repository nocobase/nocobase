import React from 'react';
import { Tag } from 'antd';
import classnames from 'classnames';

import { createStyles } from '@nocobase/client';

import { JobStatusOptionsMap } from '../constants';

const useStyles = createStyles(({ css, token }) => ({
  statusIconClass: css`
    padding: 0;
    width: ${token.sizeLG}px;
    height: ${token.sizeLG}px;
    line-height: ${token.sizeLG}px;
    margin-right: 0;
    border-radius: 50%;
    text-align: center;
  `,
}));

export function StatusIcon(props) {
  const { icon, color } = JobStatusOptionsMap[props.status];
  const { styles } = useStyles();

  return (
    <Tag color={color} className={classnames(styles.statusIconClass, props.className)}>
      {icon}
    </Tag>
  );
}
