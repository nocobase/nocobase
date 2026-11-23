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
  [true, 'horizontal', ''],
  [true, 'vertical', '12px'],
  [false, 'horizontal', '12px'],
] as const)('sets field spacing for isMobileLayout=%s and layout=%s', (isMobileLayout, layout, inlineMargin) => {
  const model = new DetailsItemModel({ uid: 'detail-field', flowEngine: new FlowEngine() });
  model.context.defineProperty('isMobileLayout', { value: isMobileLayout });
  model.context.defineProperty('blockModel', { value: { props: { layout } } });
  model.setProps('label', 'Name');
  model.setStepParams('fieldSettings', 'init', { fieldPath: 'name' });
  const Field = vi.fn(() => <span>Value</span>);

  const { container } = render(React.cloneElement(model.renderItem(), {}, <Field />));

  const item = container.querySelector<HTMLElement>('.ant-form-item');
  expect(item.style.marginBottom).toBe(inlineMargin);
  const rules = Array.from(document.styleSheets).flatMap((sheet) => Array.from(sheet.cssRules));
  const matchesStyle = (rules: CSSRule[], element: Element, property: string, value: string) =>
    rules.some(
      (rule) =>
        rule instanceof CSSStyleRule &&
        element.matches(rule.selectorText) &&
        rule.style.getPropertyValue(property) === value,
    );

  const responsive = isMobileLayout && layout === 'horizontal';
  const narrowRules = rules.flatMap((rule) =>
    rule instanceof CSSMediaRule && rule.conditionText === '(max-width: 575px)' ? Array.from(rule.cssRules) : [],
  );
  expect(matchesStyle(rules, item, 'margin-bottom', '11px')).toBe(responsive);
  expect(matchesStyle(narrowRules, item, 'margin-bottom', '10px')).toBe(responsive);
  expect(matchesStyle(narrowRules, item.querySelector('.ant-form-item-label'), 'padding-bottom', '0')).toBe(responsive);
  expect(matchesStyle(narrowRules, item.querySelector('label'), 'height', 'auto')).toBe(responsive);
  expect(matchesStyle(narrowRules, item.querySelector('.ant-form-item-control-input'), 'min-height', '22px')).toBe(
    responsive,
  );
  expect(container.querySelector<HTMLElement>('.ant-form-item-label')?.style.paddingBottom).toBe(
    layout === 'vertical' ? '0px' : '',
  );
  expect(Field).toHaveBeenCalledWith(expect.not.objectContaining({ itemMarginClassName: expect.any(String) }), {});
});
