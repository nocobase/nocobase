/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { GlobalOutlined } from '@ant-design/icons';
import { Instruction } from '@nocobase/plugin-workflow/client-v2';
import { tExpr, useT } from './locale';
import { buildResponseVariableChildren } from './utils';

export default class RequestInstruction extends Instruction {
  type = 'request';
  title = tExpr('HTTP request');
  group = 'extended';
  description = tExpr(
    'Send HTTP request to a URL. You can use the variables in the upstream nodes as request headers, parameters and request body.',
  );
  icon = (<GlobalOutlined />);
  testable = true;
  FieldsetLoader = () => import('./components/RequestFieldset').then((module) => ({ default: module.RequestFieldset }));

  useVariables({ key, title, config }: { key: string; title: string; config?: { onlyData?: boolean } }) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const t = useT();

    return {
      value: key,
      label: title,
      children: buildResponseVariableChildren(config?.onlyData, t),
    };
  }
}
