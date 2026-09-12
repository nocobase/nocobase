/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render } from '@nocobase/test/client';
import { ConfigProvider } from 'antd';
import React from 'react';
import { SchemaInitializerDivider } from '../../../schema-initializer/components/SchemaInitializerDivider';

describe('SchemaInitializerDivider', () => {
  it('basic', async () => {
    render(
      <ConfigProvider>
        <SchemaInitializerDivider />
      </ConfigProvider>,
    );

    expect(document.querySelector('.ant-divider')).toBeInTheDocument();
  });
});
