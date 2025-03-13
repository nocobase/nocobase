/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/react';
import classnames from 'classnames';
import React from 'react';
import { Space, Tooltip } from 'antd';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import Action from './Action';
import { ComposedAction } from './types';
import { Icon } from '../../../icon';

const WrapperComponent = ({ component: Component = 'a', icon, onlyIcon, children, ...restProps }: any) => {
  return (
    <Component {...restProps}>
      <Tooltip title={restProps.title}>
        <span style={{ marginRight: 3 }}>{icon && typeof icon === 'string' ? <Icon type={icon} /> : icon}</span>
      </Tooltip>
      {onlyIcon ? children[1] : children}
    </Component>
  );
};

export const ActionLink: ComposedAction = withDynamicSchemaProps(
  observer((props: any) => {
    return (
      <Action
        {...props}
        component={props.component || WrapperComponent}
        className={classnames('nb-action-link', props.className)}
      />
    );
  }),
  { displayName: 'ActionLink' },
);
