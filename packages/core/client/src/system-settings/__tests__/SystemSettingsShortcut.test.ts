/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { getSystemSettingsMutationData } from '../SystemSettingsShortcut';

describe('SystemSettingsShortcut', () => {
  it('should keep the system settings cache wrapped after submit', () => {
    const response = {
      data: {
        data: {
          raw_title: 'NocoBase',
          logo: { id: 1 },
          enabledLanguages: ['zh-CN', 'en-US'],
        },
      },
    };

    expect(
      getSystemSettingsMutationData(response, undefined, {
        raw_title: 'Updated',
        enabledLanguages: [],
      }),
    ).toEqual(response.data);
  });

  it('should wrap fallback values when the response is empty', () => {
    expect(
      getSystemSettingsMutationData(
        { data: {} },
        {
          data: {
            raw_title: 'NocoBase',
            logo: { id: 1 },
            enabledLanguages: ['en-US'],
          },
        },
        {
          enabledLanguages: ['zh-CN', 'en-US'],
        },
      ),
    ).toEqual({
      data: {
        raw_title: 'NocoBase',
        logo: { id: 1 },
        enabledLanguages: ['zh-CN', 'en-US'],
      },
    });
  });
});
