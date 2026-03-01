/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useT } from '../../../locale';
import { ToolsUIProperties, useGlobalTheme, useToken } from '@nocobase/client';
import { ToolCall } from '../../types';
import { ErrorBoundary } from 'react-error-boundary';
import { Alert, message, Button } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useChatMessagesStore } from '../../chatbox/stores/chat-messages';

const download =
  'M505.7 661a8 8 0 0 0 12.6 0l112-141.7c4.1-5.2.4-12.9-6.3-12.9h-74.1V168c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v338.3H400c-6.7 0-10.4 7.7-6.3 12.9l112 141.8zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z';

const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => {
  const t = useT();
  const responseLoading = useChatMessagesStore.use.responseLoading();
  if (responseLoading) {
    return null;
  }
  return (
    <Alert
      showIcon={true}
      type="error"
      message={t('Invalid chart options')}
      description={
        <>
          {error.message}{' '}
          <Button
            icon={<CopyOutlined />}
            variant="link"
            color="primary"
            onClick={() => {
              navigator.clipboard.writeText(error.message);
              message.success(t('Copied'));
            }}
          />
        </>
      }
    />
  );
};

export const Echarts: React.FC<
  ToolsUIProperties<{
    options: any;
  }>
> = ({ toolCall }) => {
  const t = useT();
  const { token } = useToken();
  const { isDarkTheme } = useGlobalTheme();

  const iconStyle = {
    fontSize: token.fontSizeSM,
    color: token.colorText,
    borderWidth: 0,
  };
  const emphasisIconStyle = {
    ...iconStyle,
    color: token.colorLinkHover,
  };

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => console.error(error, toolCall.args)}
      resetKeys={[toolCall.args.options]}
    >
      <ReactECharts
        option={{
          ...toolCall.args.options,
          animation: false,
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
        theme={!isDarkTheme ? 'light' : 'defaultDark'}
      />
    </ErrorBoundary>
  );
};
