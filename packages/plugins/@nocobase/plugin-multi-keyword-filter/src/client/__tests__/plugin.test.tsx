/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/client';
import { describe, expect, it, vi } from 'vitest';
import { MultipleKeywordsInput } from '../MultipleKeywordsInput';
import PluginFilterOperatorMultipleKeywordsClient from '../index';

describe('PluginFilterOperatorMultipleKeywordsClient v1', () => {
  it('registers id multi-keyword operators and the value input component', async () => {
    const app = new Application({
      plugins: [PluginFilterOperatorMultipleKeywordsClient],
    });
    const addFieldInterfaceOperator = vi.spyOn(app, 'addFieldInterfaceOperator');
    const addComponents = vi.spyOn(app, 'addComponents');

    await app.load();

    expect(addComponents).toHaveBeenCalledWith({ MultipleKeywordsInput });
    expect(addFieldInterfaceOperator).toHaveBeenCalledWith(
      'id',
      expect.objectContaining({
        value: '$in',
        schema: {
          'x-component': 'MultipleKeywordsInput',
          'x-component-props': {
            fieldInterface: 'id',
          },
        },
      }),
    );
    expect(addFieldInterfaceOperator).toHaveBeenCalledWith(
      'id',
      expect.objectContaining({
        value: '$notIn',
        schema: {
          'x-component': 'MultipleKeywordsInput',
          'x-component-props': {
            fieldInterface: 'id',
          },
        },
      }),
    );
  });
});
