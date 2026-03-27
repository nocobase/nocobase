/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { inferRunJSScenesFromContext, mergeRunJSScenes } from '../resolveScenes';

describe('mergeRunJSScenes', () => {
  it('merges explicit event flow scene with auto detail/table scenes', () => {
    expect(mergeRunJSScenes('eventFlow', ['detailFieldEvent'])).toEqual(['eventFlow', 'detailFieldEvent']);
    expect(mergeRunJSScenes('eventFlow', ['tableFieldEvent'])).toEqual(['eventFlow', 'tableFieldEvent']);
  });

  it('deduplicates and keeps order stable', () => {
    expect(mergeRunJSScenes(['eventFlow', 'detail'], ['detail', 'form'])).toEqual(['eventFlow', 'detail', 'form']);
  });

  it('returns undefined when both inputs are empty', () => {
    expect(mergeRunJSScenes(undefined, undefined)).toBeUndefined();
  });

  it('infers scenes for normal field models used in event flow settings', () => {
    expect(inferRunJSScenesFromContext({ model: { constructor: { name: 'DetailsItemModel' } } }, 'eventFlow')).toEqual([
      'detailFieldEvent',
    ]);
    expect(inferRunJSScenesFromContext({ model: { constructor: { name: 'TableColumnModel' } } }, 'eventFlow')).toEqual([
      'tableFieldEvent',
    ]);
    expect(inferRunJSScenesFromContext({ model: { constructor: { name: 'FormItemModel' } } }, 'eventFlow')).toEqual([
      'formFieldEvent',
    ]);
  });

  it('does not infer field event scenes outside event flow editors', () => {
    expect(
      inferRunJSScenesFromContext({ model: { constructor: { name: 'DetailsItemModel' } } }, 'detail'),
    ).toBeUndefined();
  });
});
