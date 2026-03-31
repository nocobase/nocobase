/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect, mapProps, useFieldSchema } from '@formily/react';
import { Divider as AntdDivider } from 'antd';
import React from 'react';
import { useCompile } from '../../hooks/useCompile';
import { useTranslation } from 'react-i18next';
import { NAMESPACE_UI_SCHEMA } from '../../../i18n/constant';

export const Divider = connect(
  (props) => {
    const { color, borderColor } = props;
    const { t } = useTranslation();
    const schema = useFieldSchema();
    const compile = useCompile();
    const rawChildren = schema?.['x-component-props'].children || props.children;
    const children =
      typeof rawChildren === 'string' ? t(compile(rawChildren), { ns: NAMESPACE_UI_SCHEMA }) : rawChildren;
    return (
      <AntdDivider {...props} type="horizontal" style={{ color, borderColor }} orientationMargin="0">
        {children}
      </AntdDivider>
    );
  },
  mapProps((props) => {
    return {
      orientation: 'left',
      ...props,
    };
  }),
);

export default Divider;
