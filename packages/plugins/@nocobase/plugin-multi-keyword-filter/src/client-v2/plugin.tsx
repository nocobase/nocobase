/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LinkOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Application, Plugin } from '@nocobase/client-v2';
import { Tooltip } from 'antd';
import React from 'react';
import { interceptor } from '../shared/interceptor';
import { useT } from './locale';
import { MultipleKeywordsInput } from './MultipleKeywordsInput';

const fieldInterfaces = ['input', 'phone', 'email', 'uuid', 'sequence', 'integer', 'number', 'id', 'percent', 'nanoid'];

function MultipleKeywordsOperatorLabel({ type }: { type: 'in' | 'notIn' }) {
  const t = useT();
  const isSimplifiedChinese = t('equalsAny') === '等于任意一个';
  const label = type === 'in' ? t('equalsAny') : t('notEqualsAny');
  const docsHost = isSimplifiedChinese ? 'docs-cn' : 'docs';

  return (
    <div>
      {label}{' '}
      <Tooltip
        title={
          <div>
            {t('providedByPlugin', { pluginName: t('pluginName') })}{' '}
            <a
              href={`https://${docsHost}.nocobase.com/handbook/multi-keyword-filter`}
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
}

function createMultipleKeywordsOperator(fieldInterface: string, type: 'in' | 'notIn') {
  return {
    label: <MultipleKeywordsOperatorLabel type={type} />,
    value: type === 'in' ? '$in' : '$notIn',
    schema: {
      'x-component': 'MultipleKeywordsInput',
      'x-component-props': {
        fieldInterface,
      },
    },
  };
}

export class PluginFilterOperatorMultipleKeywordsClient extends Plugin<any, Application> {
  async load() {
    fieldInterfaces.forEach((interfaceName) => {
      this.app.addFieldInterfaceOperator(interfaceName, createMultipleKeywordsOperator(interfaceName, 'in'));
      this.app.addFieldInterfaceOperator(interfaceName, createMultipleKeywordsOperator(interfaceName, 'notIn'));
    });

    this.app.addComponents({
      MultipleKeywordsInput,
    });

    // Keep the v1 interceptor ordering: register after request-encryption so this interceptor runs before it.
    setTimeout(() => {
      this.app.apiClient.axios.interceptors.request.use(interceptor);
    });
  }
}

export default PluginFilterOperatorMultipleKeywordsClient;
