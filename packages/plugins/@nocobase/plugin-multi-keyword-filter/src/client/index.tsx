/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { MultipleKeywordsInput } from './MultipleKeywordsInput';
import React from 'react';
import { useT } from './locale';
import { LinkOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { interceptor } from './interceptor';

const $in = (fieldInterface: string) => {
  return {
    label: React.createElement(() => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const t = useT();
      const isSimplifiedChinese = t('equalsAny') === '等于任意一个';
      return (
        <div>
          {t('equalsAny')}{' '}
          <Tooltip
            title={
              <div>
                {t('providedByPlugin', { pluginName: t('pluginName') })}{' '}
                <a
                  href={`https://${
                    isSimplifiedChinese ? 'docs-cn' : 'docs'
                  }.nocobase.com/handbook/multi-keyword-filter`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <LinkOutlined />
                </a>
              </div>
            }
          >
            <QuestionCircleOutlined />
          </Tooltip>
        </div>
      );
    }),
    value: '$in',
    schema: {
      'x-component': 'MultipleKeywordsInput',
      'x-component-props': {
        fieldInterface,
      },
    },
  };
};
const $notIn = (fieldInterface: string) => {
  return {
    label: React.createElement(() => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const t = useT();
      const isSimplifiedChinese = t('equalsAny') === '等于任意一个';
      return (
        <div>
          {t('notEqualsAny')}{' '}
          <Tooltip
            title={
              <div>
                {t('providedByPlugin', { pluginName: t('pluginName') })}{' '}
                <a
                  href={`https://${
                    isSimplifiedChinese ? 'docs-cn' : 'docs'
                  }.nocobase.com/handbook/multi-keyword-filter`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <LinkOutlined />
                </a>
              </div>
            }
          >
            <QuestionCircleOutlined />
          </Tooltip>
        </div>
      );
    }),
    value: '$notIn',
    schema: {
      'x-component': 'MultipleKeywordsInput',
      'x-component-props': {
        fieldInterface,
      },
    },
  };
};

export class PluginFilterOperatorMultipleKeywordsClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    ['input', 'phone', 'email', 'uuid', 'sequence', 'integer', 'number', 'percent', 'nanoid'].forEach(
      (interfaceName) => {
        this.app.addFieldInterfaceOperator(interfaceName, $in(interfaceName));
        this.app.addFieldInterfaceOperator(interfaceName, $notIn(interfaceName));
      },
    );

    this.app.addComponents({
      MultipleKeywordsInput,
    });

    // Adding a delay to ensure this interceptor is inserted after the plugin-request-encryption interceptor.
    // This ensures it runs before the encryption interceptor, otherwise errors would occur
    setTimeout(() => {
      this.app.apiClient.axios.interceptors.request.use(interceptor);
    });
  }
}

export default PluginFilterOperatorMultipleKeywordsClient;
