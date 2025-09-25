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
import { useGlobalTheme, useToken } from '@nocobase/client';
import { ToolCall } from '../../types';

const download =
  'M505.7 661a8 8 0 0 0 12.6 0l112-141.7c4.1-5.2.4-12.9-6.3-12.9h-74.1V168c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v338.3H400c-6.7 0-10.4 7.7-6.3 12.9l112 141.8zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z';

export const Echarts: React.FC<{
  messageId: string;
  tool: ToolCall<{
    options: any;
  }>;
}> = ({ tool }) => {
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
    <ReactECharts
      option={{
        ...tool.args.options,
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
  );
};
