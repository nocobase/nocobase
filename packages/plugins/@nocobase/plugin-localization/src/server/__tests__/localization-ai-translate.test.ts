/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { pickBuiltInResourceReference } from '../tasks/localization-ai-translate';

describe('localization AI translate', () => {
  test('should pick built-in reference translations from local resources', () => {
    const resources = new Map([['zh-CN', new Map([['1', '翻译']])]]);

    const reference = pickBuiltInResourceReference(
      {
        id: 1,
        module: 'resources.@nocobase/plugin-ai',
        text: 'Translate',
      },
      resources,
      {
        primary: 'zh-CN',
      },
    );

    expect(reference).toEqual({ locale: 'zh-CN', translation: '翻译' });
  });

  test('should fallback to the next built-in reference language', () => {
    const resources = new Map([
      ['zh-CN', new Map()],
      ['ja-JP', new Map([['1', '翻訳']])],
    ]);

    const reference = pickBuiltInResourceReference(
      {
        id: 1,
        module: 'resources.ai',
        text: 'Translate',
      },
      resources,
      {
        primary: 'zh-CN',
        fallback: 'ja-JP',
      },
    );

    expect(reference).toEqual({ locale: 'ja-JP', translation: '翻訳' });
  });
});
