/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { default as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark, defaultStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Card, Alert } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useT } from '../../../locale';
import { useGlobalTheme, useToken } from '@nocobase/client';
import { Generating } from './Generating';
import { useChatMessagesStore } from '../stores/chat-messages';

const download =
  'M505.7 661a8 8 0 0 0 12.6 0l112-141.7c4.1-5.2.4-12.9-6.3-12.9h-74.1V168c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v338.3H400c-6.7 0-10.4 7.7-6.3 12.9l112 141.8zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z';

const EchartsComponent = (props: any) => {
  const { children, className, message, index, ...rest } = props;
  const chartRef = useRef<ReactECharts>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useT();
  const { token } = useToken();
  const { isDarkTheme } = useGlobalTheme();

  const responseLoading = useChatMessagesStore.use.responseLoading();

  const iconStyle = {
    fontSize: token.fontSizeSM,
    color: token.colorText,
    borderWidth: 0,
  };
  const emphasisIconStyle = {
    ...iconStyle,
    color: token.colorLinkHover,
  };

  const optionStr = React.Children.toArray(children).join('');
  let option = {};
  let optionValid = true;
  try {
    option = JSON.parse(optionStr);
  } catch (err) {
    optionValid = false;
  }

  useEffect(() => {
    if (!optionValid) {
      return;
    }
    const resizeChart = () => {
      const chart = chartRef.current?.getEchartsInstance();
      chart?.resize();
    };

    const timeouts = [0, 100, 300].map((delay) => window.setTimeout(resizeChart, delay));
    const observer =
      typeof ResizeObserver !== 'undefined' && containerRef.current
        ? new ResizeObserver(() => {
            resizeChart();
          })
        : null;

    if (observer && containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      observer?.disconnect();
    };
  }, [optionStr, optionValid]);

  if (responseLoading && !message.messageId) {
    return <Generating />;
  }

  if (!optionValid) {
    return (
      <Card
        size="small"
        title={t('ECharts')}
        styles={{
          title: {
            fontSize: token.fontSize,
            fontWeight: 400,
          },
          body: {
            width: '100%',
            fontSize: token.fontSizeSM,
          },
        }}
      >
        <SyntaxHighlighter {...rest} PreTag="div" language={'json'} style={isDarkTheme ? dark : defaultStyle}>
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </Card>
    );
  }

  return (
    <>
      <div ref={containerRef}>
        <ReactECharts
          ref={chartRef}
          option={{
            ...option,
            toolbox: {
              show: true,
              feature: {
                saveAsImage: {
                  title: t('Save as image'),
                  icon: `path://${download}`,
                  iconStyle,
                  emphasis: {
                    iconStyle: emphasisIconStyle,
                  },
                },
              },
            },
          }}
          theme={isDarkTheme ? 'dark' : 'default'}
        />
      </div>
    </>
  );
};

export const Echarts = React.memo(EchartsComponent, (prevProps, nextProps) => {
  const prevChildren = React.Children.toArray(prevProps.children).join('');
  const nextChildren = React.Children.toArray(nextProps.children).join('');
  return (
    prevChildren === nextChildren &&
    prevProps.message?.messageId === nextProps.message?.messageId &&
    prevProps.index === nextProps.index
  );
});
