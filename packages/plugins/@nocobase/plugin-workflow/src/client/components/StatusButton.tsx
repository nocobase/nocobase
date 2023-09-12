import React from 'react';
import { Button, Tag } from 'antd';
import classnames from 'classnames';

import { createStyles } from '@nocobase/client';

const useStyles = createStyles(({ css, token }) => ({
  statusButtonClass: css`
    border: none;
    .ant-tag {
      width: 100%;
      height: 100%;
      padding: 0;
      margin-right: 0;
      border-radius: 50%;
      text-align: center;
    }
  `,
  noStatusButtonClass: css`
    border-width: 2px;
  `,
}));

export function StatusButton(props) {
  const { styles } = useStyles();
  let tag = null;
  if (typeof props.status !== 'undefined' && props.statusMap?.[props.status]) {
    const { icon, color } = props.statusMap[props.status];
    tag = <Tag color={color}>{icon}</Tag>;
  }

  return (
    <Button
      {...props}
      shape="circle"
      size="small"
      className={classnames(tag ? styles.statusButtonClass : styles.noStatusButtonClass, props.className)}
    >
      {tag}
    </Button>
  );
}
