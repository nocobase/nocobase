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

export class PluginFilterOperatorMultipleKeywordsClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    this.app.addFieldInterfaceOperator('input', {
      label: '{{t("等于任意一个")}}',
      value: '$in',
      schema: {
        'x-component': 'MultipleKeywordsInput',
      },
    });
    this.app.addFieldInterfaceOperator('input', {
      label: '{{t("不等于任意一个")}}',
      value: '$notIn',
      schema: {
        'x-component': 'MultipleKeywordsInput',
      },
    });

    this.app.addComponents({
      MultipleKeywordsInput,
    });
  }
}

export default PluginFilterOperatorMultipleKeywordsClient;
