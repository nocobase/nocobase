/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { Action, Icon, useComponent, withDynamicSchemaProps } from '@nocobase/client';
import { Avatar } from 'antd';
import { createStyles } from 'antd-style';
import React, { useContext } from 'react';
import { WorkbenchBlockContext } from './WorkbenchBlock';
import { WorkbenchLayout } from './workbenchBlockSettings';

const useStyles = createStyles(({ token, css }) => ({
  // 支持 css object 的写法
  action: css`
    display: flex;
    background-color: transparent;
    border: 0;
    height: auto;
    box-shadow: none;
    padding-top: 8px;
  `,
  avatar: css`
    width: 4em;
  `,
  title: css`
    margin-top: ${token.marginSM}px;
    width: 100%;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  `,
}));

function Button() {
  const fieldSchema = useFieldSchema();
  const icon = fieldSchema['x-component-props']?.['icon'];
  const backgroundColor = fieldSchema['x-component-props']?.['iconColor'];
  const { layout } = useContext(WorkbenchBlockContext);
  const { styles, cx } = useStyles();
  return layout === WorkbenchLayout.Grid ? (
    <div title={fieldSchema.title} className={cx(styles.avatar)}>
      <Avatar style={{ backgroundColor }} size={48} icon={<Icon type={icon} />} />
      <div className={cx(styles.title)}>{fieldSchema.title}</div>
    </div>
  ) : (
    <span>{fieldSchema.title}</span>
  );
}

export const WorkbenchAction = withDynamicSchemaProps((props) => {
  const { className, ...others } = props;
  const { styles, cx } = useStyles() as any;
  const fieldSchema = useFieldSchema();
  const Component = useComponent(props?.targetComponent) || Action;
  return (
    <Component
      className={cx(className, styles.action, 'nb-action-panel')}
      {...others}
      type="text"
      icon={null}
      title={<Button />}
      confirmTitle={fieldSchema.title}
    />
  );
});
