import { observer, useField } from '@formily/react';
import { useAPIClient, useApp } from '@nocobase/client';
import { Card } from 'antd';
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

    const { t } = useTranslation();
    const api = useAPIClient();
    const field = useField();
    const app = useApp();

    const src = React.useMemo(() => {
      if (mode === 'html') {
        const options = app.getOptions();
        const apiBaseURL: string = options?.apiClient?.['baseURL'];
        return `${apiBaseURL}iframeHtml:getHtml/${htmlId}?token=${api.auth.getToken()}&v=${field.data?.v || ''}`;
      }
      return url;
    }, [app, url, mode, htmlId, field.data?.v]);

    if ((mode === 'url' && !url) || (mode === 'html' && !htmlId)) {
      return <Card style={{ marginBottom: 24 }}>{t('Please fill in the iframe URL')}</Card>;
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
