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

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponent, useAPIClient } from '@nocobase/client';
import React, { useState } from 'react';
import { useAuthTranslation } from './locale';

/**
 * 微信认证选项设置组件
 * 用于管理员配置微信认证的相关参数
 * 包括微信应用配置、二维码设置和自动注册开关
 */
const Options = () => {
  const { t } = useAuthTranslation(); // 获取翻译函数
  const api = useAPIClient();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // 测试微信应用连接状态
  const testConnection = async (appId: string, appSecret: string) => {
    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const response = await api.request({
        url: '/auth:wechat/test-connection',
        method: 'post',
        data: {
          appId,
          appSecret,
        },
      });

      if (response.data?.success) {
        setTestResult({
          success: true,
          message: t('Connection test successful! WeChat API is working normally.'),
        });
      } else {
        setTestResult({
          success: false,
          message: response.data?.message || t('Connection test failed.'),
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.response?.data?.message || t('Failed to connect to WeChat API. Please check your credentials.'),
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <SchemaComponent
      scope={{
        t,
        testConnection,
        isTestingConnection,
        testResult,
      }} // 注入翻译函数和其他状态到作用域
      schema={{
        type: 'object',
        properties: {
          wechat: {
            type: 'void',
            properties: {
              public: {
                type: 'object',
                properties: {
                  appType: {
                    'x-decorator': 'FormItem',
                    type: 'string',
                    title: '{{t("WeChat App Type")}}',
                    'x-component': 'Select',
                    'x-component-props': {
                      placeholder: '{{t("Select WeChat App Type")}}',
                    },
                    enum: [
                      { label: '{{t("Official Account")}}', value: 'official' },
                      { label: '{{t("Mini Program")}}', value: 'miniprogram' },
                      { label: '{{t("Web App")}}', value: 'webapp' },
                      { label: '{{t("Mobile App")}}', value: 'mobileapp' },
                    ],
                    default: 'webapp',
                    description: '{{t("Select the type of your WeChat application")}}',
                  },
                  appId: {
                    'x-decorator': 'FormItem',
                    type: 'string',
                    title: '{{t("WeChat App ID")}}',
                    'x-component': 'Input',
                    'x-component-props': {
                      placeholder: '{{t("Please enter WeChat App ID")}}',
                    },
                    description: '{{t("The AppID of your WeChat application")}}',
                  },
                  appSecret: {
                    'x-decorator': 'FormItem',
                    type: 'string',
                    title: '{{t("WeChat App Secret")}}',
                    'x-component': 'Password',
                    'x-component-props': {
                      placeholder: '{{t("Please enter WeChat App Secret")}}',
                    },
                    description: '{{t("The AppSecret of your WeChat application")}}',
                  },
                  verifyToken: {
                    'x-decorator': 'FormItem',
                    type: 'string',
                    title: '{{t("Server Verification Token")}}',
                    'x-component': 'Input',
                    'x-component-props': {
                      placeholder: '{{t("Enter verification token for server validation")}}',
                    },
                    description: '{{t("The verification token for WeChat server to validate your application")}}',
                  },
                  testConnection: {
                    'x-decorator': 'FormItem',
                    type: 'void',
                    'x-component': 'div',
                    'x-component-props': {
                      style: {
                        margin: '10px 0',
                      },
                    },
                    properties: {
                      testButton: {
                        type: 'void',
                        'x-component': 'Action',
                        'x-component-props': {
                          type: 'default',
                          disabled: '{{isTestingConnection}}',
                          style: {
                            marginRight: '10px',
                          },
                        },
                        title: '{{isTestingConnection ? t("Testing...") : t("Test Connection")}}',
                        'x-action': 'test-connection',
                      },
                      testResult: {
                        type: 'void',
                        'x-component': 'div',
                        'x-component-props': {
                          style: {
                            marginTop: '8px',
                            fontSize: '14px',
                          },
                        },
                        properties: {},
                        'x-render': (props: any) => {
                          if (!testResult) return null;
                          return (
                            <div
                              style={{
                                color: testResult.success ? '#52c41a' : '#ff4d4f',
                                padding: '8px',
                                borderRadius: '4px',
                                backgroundColor: testResult.success ? '#f6ffed' : '#fff2f0',
                                border: `1px solid ${testResult.success ? '#b7eb8f' : '#ffccc7'}`,
                              }}
                            >
                              {testResult.message}
                            </div>
                          );
                        },
                      },
                    },
                  },
                  enableAuthLogin: {
                    'x-decorator': 'FormItem',
                    type: 'boolean',
                    title: '{{t("Enable Authorization Login")}}',
                    'x-component': 'Checkbox',
                    description: '{{t("Allow users to login through WeChat OAuth authorization")}}',
                  },
                  qrCodeExpireTime: {
                    'x-decorator': 'FormItem',
                    type: 'number',
                    title: '{{t("QR Code Expire Time (seconds)")}}',
                    'x-component': 'InputNumber',
                    'x-component-props': {
                      min: 60,
                      max: 1800,
                      step: 60,
                    },
                    default: 300,
                    description: '{{t("How long the QR code is valid (60-1800 seconds)")}}',
                  },
                  autoSignup: {
                    'x-decorator': 'FormItem',
                    type: 'boolean',
                    title: '{{t("Sign up automatically when the user does not exist")}}',
                    'x-component': 'Checkbox',
                    description: '{{t("Automatically create user account when first WeChat login")}}',
                  },
                  redirectUri: {
                    'x-decorator': 'FormItem',
                    type: 'string',
                    title: '{{t("OAuth Redirect URI")}}',
                    'x-component': 'Input',
                    'x-component-props': {
                      placeholder: '{{t("OAuth callback URL")}}',
                    },
                    description:
                      '{{t("The callback URL for OAuth authorization, usually your domain + /wechat/callback")}}',
                  },
                  apiTimeout: {
                    'x-decorator': 'FormItem',
                    type: 'number',
                    title: '{{t("API Request Timeout (milliseconds)")}}',
                    'x-component': 'InputNumber',
                    'x-component-props': {
                      min: 1000,
                      max: 30000,
                      step: 1000,
                    },
                    default: 5000,
                    description: '{{t("Timeout for WeChat API requests (1000-30000 ms)")}}',
                  },
                },
              },
            },
          },
        },
      }}
    />
  );
};

export default Options;
