/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Result, Space, Typography, theme } from 'antd';
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '../locale';

export default function ErrorPage() {
  const [searchParams] = useSearchParams();
  const { token } = theme.useToken();
  const t = useT();
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const iss = searchParams.get('iss');
  const title = error || t('Authentication failed');

  return (
    <div
      style={{
        maxWidth: token.screenMD,
        marginInline: 'auto',
        paddingBlock: token.paddingXL,
        paddingInline: token.paddingLG,
      }}
    >
      <Result status="error" title={title} subTitle={errorDescription || undefined} />
      <Space direction="vertical" size="middle">
        {iss ? (
          <div>
            <Typography.Text type="secondary">{t('Issuer')}</Typography.Text>
            <div>
              <Typography.Text code>{iss}</Typography.Text>
            </div>
          </div>
        ) : null}
      </Space>
    </div>
  );
}
