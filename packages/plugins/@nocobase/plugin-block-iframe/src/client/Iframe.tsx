/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useField } from '@formily/react';
import { useRequest } from '@nocobase/client';
import { Card, Spin } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import RIframe from 'react-iframe';
import type { IIframe } from 'react-iframe/types';
import { IframeDesigner } from './Iframe.Designer';

function isNumeric(str: string | undefined) {
  if (typeof str !== 'string') return false; // we only process strings!
  return (
    !isNaN(str as any) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}

export const Iframe: any = observer(
  (props: IIframe & { html?: string; htmlId?: number; mode: string }) => {
    const { url, htmlId, mode = 'url', height, html, ...others } = props;
    const field = useField();
    const { t } = useTranslation();
    const { loading, data: htmlContent } = useRequest<string>(
      {
        url: `iframeHtml:getHtml/${htmlId}`,
      },
      {
        refreshDeps: [htmlId, field.data],
        ready: mode === 'html' && !!htmlId,
      },
    );
    const src = React.useMemo(() => {
      if (mode === 'html') {
        const encodedHtml = encodeURIComponent(htmlContent);
        const dataUrl = 'data:text/html;charset=utf-8,' + encodedHtml;
        return dataUrl;
      }
      return url;
    }, [htmlContent, mode, url]);

    if ((mode === 'url' && !url) || (mode === 'html' && !htmlId)) {
      return <Card style={{ marginBottom: 24 }}>{t('Please fill in the iframe URL')}</Card>;
    }

    if (loading) {
      return (
        <div
          style={{
            height: isNumeric(height) ? `${height}px` : height,
            marginBottom: '24px',
            border: 0,
          }}
        >
          <Spin />
        </div>
      );
    }

    return (
      <RIframe
        url={src}
        width="100%"
        display="block"
        position="relative"
        styles={{
          height: isNumeric(height) ? `${height}px` : height,
          marginBottom: '24px',
          border: 0,
        }}
        {...others}
      />
    );
  },
  { displayName: 'Iframe' },
);

Iframe.Designer = IframeDesigner;
