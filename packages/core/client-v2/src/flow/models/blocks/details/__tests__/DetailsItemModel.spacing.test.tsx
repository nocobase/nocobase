/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
import { render } from '@testing-library/react';
import React from 'react';
import { expect, it, vi } from 'vitest';
import { DetailsItemModel } from '../DetailsItemModel';

it.each([
  [true, 'horizontal', '8px'],
  [true, 'vertical', '12px'],
  [false, 'horizontal', '12px'],
] as const)('sets field spacing for isMobileLayout=%s and layout=%s', (isMobileLayout, layout, expectedMargin) => {
  const model = new DetailsItemModel({ uid: 'detail-field', flowEngine: new FlowEngine() });
  model.context.defineProperty('isMobileLayout', { value: isMobileLayout });
  model.context.defineProperty('blockModel', { value: { props: { layout } } });
  model.setProps('label', 'Name');
  model.setStepParams('fieldSettings', 'init', { fieldPath: 'name' });
  const Field = vi.fn(() => <span>Value</span>);

  const { container } = render(React.cloneElement(model.renderItem(), {}, <Field />));

  expect(container.querySelector<HTMLElement>('.ant-form-item')?.style.marginBottom).toBe(expectedMargin);
  expect(container.querySelector<HTMLElement>('.ant-form-item-label')?.style.paddingBottom).toBe(
    layout === 'vertical' ? '0px' : '',
  );
  expect(Field).toHaveBeenCalledWith(expect.not.objectContaining({ itemMarginBottom: 8 }), {});
});
