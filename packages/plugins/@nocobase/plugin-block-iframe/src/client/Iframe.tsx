/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useField } from '@formily/react';
import { useRequest, replaceVariableValue, useVariables, useLocalVariables } from '@nocobase/client';
import { Card, Spin } from 'antd';
import React, { useState, useEffect } from 'react';
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
    const variables = useVariables();
    const localVariables = useLocalVariables();
    const { loading, data: htmlContent } = useRequest<string>(
      {
        url: `iframeHtml:getHtml/${htmlId}`,
      },
      {
        refreshDeps: [htmlId, field.data],
        ready: mode === 'html' && !!htmlId,
      },
    );

    const [src, setSrc] = useState(null);

    useEffect(() => {
      const generateSrc = async () => {
        if (mode === 'html') {
          const targetHtmlContent = await replaceVariableValue(htmlContent, variables, localVariables);
          const encodedHtml = encodeURIComponent(targetHtmlContent);
          const dataUrl = 'data:text/html;charset=utf-8,' + encodedHtml;
          setSrc(dataUrl);
        } else {
          try {
            const targetUrl = await replaceVariableValue(url, variables, localVariables);
            setSrc(targetUrl);
          } catch (error) {
            console.error('Error fetching target URL:', error);
            // Handle error or set a fallback URL
            setSrc('fallback-url');
          }
        }
      };

      generateSrc();
    }, [htmlContent, mode, url, variables, localVariables]);
    if ((mode === 'url' && !url) || (mode === 'html' && !htmlId)) {
      return <Card style={{ marginBottom: 24 }}>{t('Please fill in the iframe URL')}</Card>;
    }

    if (loading && !src) {
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
