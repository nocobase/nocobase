/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect, mapReadPretty } from '@formily/react';
import { useApp } from '@nocobase/client';
import { Input as AntdInput } from 'antd';
import React from 'react';

const ReadPretty = (props) => {
  const app = useApp();
  const content = props.value && (
    <a target={'_blank'} href={app.getRouteUrl(`/apps/${props.value}/admin`)} rel="noreferrer">
      {props.value}
    </a>
  );
  return (
    <div style={props.style}>
      {props.addonBefore}
      {props.prefix}
      {content}
      {props.suffix}
      {props.addonAfter}
    </div>
  );
};

export const AppNameInput = connect(AntdInput, mapReadPretty(ReadPretty));
