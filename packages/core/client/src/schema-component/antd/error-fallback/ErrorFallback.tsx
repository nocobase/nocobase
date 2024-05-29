/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Button, Result, Typography } from 'antd';
import React, { FC } from 'react';
import { FallbackProps } from 'react-error-boundary';
import { Trans, useTranslation } from 'react-i18next';
import { ErrorFallbackModal } from './ErrorFallbackModal';
import { useAPIClient } from '../../../api-client';
import { useFieldSchema } from '@formily/react';

const { Paragraph, Text, Link } = Typography;

export const ErrorFallback: FC<FallbackProps> & {
  Modal: FC<FallbackProps>;
} = ({ error }) => {
  const schema = useFieldSchema();
  const { t } = useTranslation();
  const api = useAPIClient();
  const [loading, setLoading] = React.useState(false);

  const subTitle = (
    <Trans>
      {'This is likely a NocoBase internals bug. Please open an issue at '}
      <Link href="https://github.com/nocobase/nocobase/issues" target="_blank">
        here
      </Link>
    </Trans>
  );

  const download = async () => {
    setLoading(true);
    try {
      const res = await api.request({
        url: 'logger:collect',
        method: 'post',
        responseType: 'blob',
        data: {
          error: {
            message: error.message,
            stack: error.stack,
          },
          schema: schema.toJSON(),
        },
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/gzip' }));
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'logs.tar.gz');
      link.click();
      link.remove();
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  return (
    <div style={{ backgroundColor: 'white' }}>
      <Result
        style={{ maxWidth: '60vw', margin: 'auto' }}
        status="error"
        title={t('Render Failed')}
        subTitle={subTitle}
        extra={[
          <Button type="primary" key="feedback" href="https://github.com/nocobase/nocobase/issues" target="_blank">
            {t('Feedback')}
          </Button>,
          <Button key="log" loading={loading} onClick={download}>
            {t('Download logs')}
          </Button>,
        ]}
      >
        <Paragraph copyable>
          <Text type="danger" style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
            {error.stack}
          </Text>
        </Paragraph>
      </Result>
    </div>
  );
};

ErrorFallback.Modal = ErrorFallbackModal;
