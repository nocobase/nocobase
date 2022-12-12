import { observer } from '@formily/react';
import { Card } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import RIframe from 'react-iframe';
import type { IIframe } from 'react-iframe/types';
import { IframeDesigner } from './Iframe.Designer';

function isNumeric(str: string) {
  if (typeof str !== 'string') return false; // we only process strings!
  return (
    !isNaN(str as any) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}

export const Iframe: any = observer((props: IIframe) => {
  const { url, height, ...others } = props;
  const { t } = useTranslation();
  if (!url) {
    return <Card style={{ marginBottom: 24 }}>{t('Please fill in the iframe URL')}</Card>;
  }
  return (
    <RIframe
      url={url}
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
});

Iframe.Designer = IframeDesigner;
