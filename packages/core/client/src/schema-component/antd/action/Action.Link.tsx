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
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import Action from './Action';
import { ComposedAction } from './types';

export const ActionLink: ComposedAction = withDynamicSchemaProps(
  observer((props: any) => {
    return (
      <Action
        {...props}
        component={props.component || 'a'}
        className={classnames('nb-action-link', props.className)}
        isLink
      />
    );
  }),
  { displayName: 'ActionLink' },
);
