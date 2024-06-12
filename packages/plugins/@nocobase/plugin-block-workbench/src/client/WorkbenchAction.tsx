/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { Action, Icon, withDynamicSchemaProps } from '@nocobase/client';
import { Avatar } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';

const useStyles = createStyles(({ token, css }) => ({
  // 支持 css object 的写法
  action: css`
    background-color: transparent;
    border: 0;
    height: auto;
    box-shadow: none;
  `,
  title: css`
    margin-top: ${token.marginSM}px;
  `,
}));

function Button() {
  const fieldSchema = useFieldSchema();
  const icon = fieldSchema['x-component-props']?.['icon'];
  const backgroundColor = fieldSchema['x-component-props']?.['iconColor'];
  const { styles, cx } = useStyles();

  return (
    <div>
      <Avatar style={{ backgroundColor }} size={64} icon={<Icon type={icon} />} />
      <div className={cx(styles.title)}>{fieldSchema.title}</div>
    </div>
  );
}

export const WorkbenchAction = withDynamicSchemaProps((props) => {
  const { className, ...others } = props;
  const { styles, cx } = useStyles();
  return <Action className={cx(className, styles.action)} {...others} icon={null} title={<Button />} />;
});
