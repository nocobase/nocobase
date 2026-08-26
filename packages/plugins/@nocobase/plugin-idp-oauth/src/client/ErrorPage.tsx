/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Result, Space, Typography } from 'antd';
import React from 'react';
import { useSearchParams } from 'react-router-dom';

export const ErrorPage = () => {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const iss = searchParams.get('iss');
  const title = error || 'Authentication failed';
  const subTitle = errorDescription || undefined;

  return (
    <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 24px' }}>
      <Result status="error" title={title} subTitle={subTitle} />
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {iss ? (
          <div>
            <Typography.Text type="secondary">Issuer</Typography.Text>
            <div>
              <Typography.Text code>{iss}</Typography.Text>
            </div>
          </div>
        ) : null}
      </Space>
    </div>
  );
};

export default ErrorPage;
