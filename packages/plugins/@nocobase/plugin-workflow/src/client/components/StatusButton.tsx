/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
  const { status, statusMap, ...others } = props;
  const { styles } = useStyles();
  let tag = null;
  if (typeof status !== 'undefined' && statusMap?.[status]) {
    const { icon, color } = statusMap[status];
    tag = <Tag color={color}>{icon}</Tag>;
  }

  return (
    <Button
      {...others}
      shape="circle"
      size="small"
      className={classnames(tag ? styles.statusButtonClass : styles.noStatusButtonClass, props.className)}
    >
      {tag}
    </Button>
  );
}
