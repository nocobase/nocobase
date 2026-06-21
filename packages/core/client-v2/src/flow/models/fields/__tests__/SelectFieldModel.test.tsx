/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { SelectFieldModel } from '../SelectFieldModel';

function mockT(text: string) {
  if (text === '{{t("Yes")}}') return '是';
  if (text === '{{t("No")}}') return '否';
  return text;
}

describe('SelectFieldModel', () => {
  it('translates enum fallback labels for selected values', () => {
    const model = {
      props: {
        value: true,
      },
      context: {
        collectionField: {
          uiSchema: {
            enum: [
              { label: '{{t("Yes")}}', value: true },
              { label: '{{t("No")}}', value: false },
            ],
          },
        },
      },
      translate: mockT,
    } as unknown as SelectFieldModel;

    const element = SelectFieldModel.prototype.render.call(model) as React.ReactElement;

    expect(element.props.value).toEqual({ label: '是', value: true });
  });
});
