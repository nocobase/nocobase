/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { SchemaComponent, useAPIClient, useCurrentUserContext } from '@nocobase/client';

const SigninPage: React.FC = () => {
  const api = useAPIClient();
  const { refresh } = useCurrentUserContext();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const useWechatActionProps = () => {
    return {
      onClick: async () => {
        setIsLoading(true);
        try {
          // 生成微信登录二维码
          const response = await api.request({
            url: '/auth:wechat/qrcode',
            params: {},
          });

          if (response.data?.data?.qrCodeUrl) {
            setQrCodeUrl(response.data.data.qrCodeUrl);

            // 开始轮询检查登录状态
            pollLoginStatus(response.data.data.sceneId);
          }
        } catch (error) {
          console.error('Failed to generate QR code:', error);
          setIsLoading(false);
        }
      },
    };
  };

  const pollLoginStatus = async (sceneId: string) => {
    const checkStatus = async () => {
      try {
        const response = await api.request({
          url: '/auth:wechat/check',
          params: { sceneId },
        });

        if (response.data?.data?.status === 'confirmed') {
          // 用户确认登录，刷新用户信息并跳转
          await refresh();
          window.location.href = '/';
          return;
        } else if (response.data?.data?.status === 'expired') {
          // 二维码过期，需要重新生成
          setQrCodeUrl('');
          setIsLoading(false);
          return;
        }

        // 继续轮询
        setTimeout(checkStatus, 2000);
      } catch (error) {
        console.error('Failed to check login status:', error);
        setTimeout(checkStatus, 3000); // 错误时延长间隔
      }
    };

    checkStatus();
  };

  const schema = {
    type: 'object',
    properties: {
      wechatLogin: {
        type: 'void',
        'x-component': 'div',
        'x-component-props': {
          style: {
            textAlign: 'center',
            padding: '40px 20px',
          },
        },
        properties: {
          qrCodeContainer: {
            type: 'void',
            'x-component': 'div',
            'x-component-props': {
              style: {
                marginBottom: '20px',
              },
            },
            properties: {
              qrCode: {
                type: 'void',
                'x-component': qrCodeUrl ? 'img' : 'div',
                'x-component-props': {
                  src: qrCodeUrl,
                  style: {
                    width: '200px',
                    height: '200px',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                  },
                },
              },
            },
          },
          wechatButton: {
            type: 'void',
            'x-component': 'Action',
            'x-component-props': {
              type: 'primary',
              icon: 'WechatOutlined',
              style: {
                background: '#07c160',
                borderColor: '#07c160',
                width: '100%',
                marginBottom: '10px',
              },
              loading: isLoading,
            },
            'x-action': 'wechat:login',
            title: '{{t("WeChat Login")}}',
            useActionProps: useWechatActionProps,
          },
          description: {
            type: 'void',
            'x-component': 'div',
            'x-component-props': {
              style: {
                color: '#666',
                fontSize: '14px',
                lineHeight: '1.5',
              },
            },
            default: '{{t("Use WeChat to scan the QR code and log in")}}',
          },
        },
      },
    },
  };

  return (
    <SchemaComponent
      schema={schema}
      scope={{
        useWechatActionProps,
      }}
    />
  );
};

export default SigninPage;
