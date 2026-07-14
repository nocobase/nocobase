/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Alert, Button, message, theme } from 'antd';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { CopyOutlined } from '@ant-design/icons';
import type { ToolsUIProperties } from '@nocobase/client-v2';
import { useGlobalTheme } from '@nocobase/client-v2';
import { useT } from '../../locale';
import { useChat } from '../chatbox/hooks/useChat';
import { useChatConversationsStore } from '../chatbox/stores/chat-conversations';

const downloadIconPath =
  'M505.7 661a8 8 0 0 0 12.6 0l112-141.7c4.1-5.2.4-12.9-6.3-12.9h-74.1V168c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v338.3H400c-6.7 0-10.4 7.7-6.3 12.9l112 141.8zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z';

type ChartGeneratorArgs = {
  options?: Record<string, unknown>;
};

class ChartErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback: (error: Error) => React.ReactNode;
    resetKey: unknown;
  },
  { error: Error | null; resetKey: unknown }
> {
  state: { error: Error | null; resetKey: unknown } = {
    error: null,
    resetKey: this.props.resetKey,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  static getDerivedStateFromProps(
    props: {
      resetKey: unknown;
    },
    state: { error: Error | null; resetKey: unknown },
  ) {
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }
    return null;
  }

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

export const ChartGeneratorCard: React.FC<ToolsUIProperties<ChartGeneratorArgs>> = ({ toolCall }) => {
  const t = useT();
  const { token } = theme.useToken();
  const { isDarkTheme } = useGlobalTheme();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const responseLoading = chat.use.responseLoading();
  const options = toolCall.args?.options;

  const iconStyle = {
    fontSize: token.fontSizeSM,
    color: token.colorText,
    borderWidth: 0,
  };

  return (
    <ChartErrorBoundary
      resetKey={options}
      fallback={(error) =>
        responseLoading ? null : (
          <Alert
            showIcon
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
        )
      }
    >
      <ReactECharts
        echarts={echarts}
        option={{
          ...options,
          animation: false,
          toolbox: {
            show: true,
            feature: {
              saveAsImage: {
                title: t('Save as image'),
                icon: `path://${downloadIconPath}`,
                iconStyle,
                emphasis: {
                  iconStyle: {
                    ...iconStyle,
                    color: token.colorLinkHover,
                  },
                },
              },
            },
          },
        }}
        theme={!isDarkTheme ? 'light' : 'defaultDark'}
      />
    </ChartErrorBoundary>
  );
};

ChartGeneratorCard.displayName = 'ChartGeneratorCard';
