/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FormLayout } from '@formily/antd-v5';
import { Card } from 'antd';

export function Fieldset(props) {
  return (
    <Card>
      <FormLayout layout={props.layout || 'vertical'}>{props.children}</FormLayout>
    </Card>
  );
}
