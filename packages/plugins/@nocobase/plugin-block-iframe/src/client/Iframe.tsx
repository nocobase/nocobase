/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useField } from '@formily/react';
import {
  getRenderContent,
  useBlockHeight,
  useCompile,
  useLocalVariables,
  useParseURLAndParams,
  useRequest,
  useVariables,
} from '@nocobase/client';
import { Card, Spin, theme } from 'antd';
import React, { useEffect, useState } from 'react';
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
  (props: IIframe & { html?: string; htmlId?: number; mode: string; params?: any; engine?: string }) => {
    const { url, htmlId, mode = 'url', height, html, params, engine, ...others } = props;
    const field = useField();
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const targetHeight = useBlockHeight() || height;
    const variables = useVariables();
    const localVariables = useLocalVariables();
    const compile = useCompile();
    const { loading, data: htmlContent } = useRequest<string>(
      {
        url: `iframeHtml:getHtml/${htmlId}`,
      },
      {
        refreshDeps: [htmlId, field.data],
        ready: mode === 'html' && !!htmlId,
      },
    );
    const { parseURLAndParams } = useParseURLAndParams();
    const [src, setSrc] = useState(null);
    useEffect(() => {
      const generateSrc = async () => {
        if (mode === 'html') {
          const targetHtmlContent = await getRenderContent(
            engine,
            htmlContent,
            compile(variables),
            compile(localVariables),
            (data) => {
              return data;
            },
          );

          // fix https://nocobase.height.app/T-4940/description
          if (targetHtmlContent === undefined) {
            return;
          }

          const encodedHtml = encodeURIComponent(targetHtmlContent);
          const dataUrl = 'data:text/html;charset=utf-8,' + encodedHtml;

          setSrc(dataUrl);
        } else {
          try {
            const targetUrl = await parseURLAndParams(url, params || []);
            setSrc(targetUrl);
          } catch (error) {
            console.error('Error fetching target URL:', error);
            // Handle error or set a fallback URL
            setSrc('fallback-url');
          }
        }
      };

      generateSrc();
    }, [htmlContent, mode, url, variables, localVariables, params]);
    if ((mode === 'url' && !url) || (mode === 'html' && !htmlId)) {
      return (
        <Card
          style={{ marginBottom: token.padding, height: isNumeric(targetHeight) ? `${targetHeight}px` : targetHeight }}
        >
          {t('Please fill in the iframe URL')}
        </Card>
      );
    }

    if (loading && !src) {
      return (
        <div
          style={{
            height: isNumeric(targetHeight) ? `${targetHeight}px` : targetHeight || '60vh',
            marginBottom: token.padding,
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
          height: isNumeric(targetHeight) ? `${targetHeight}px` : targetHeight || '60vh',
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
