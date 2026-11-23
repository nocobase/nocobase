/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel, Tracker } from '@nocobase/flow-engine';
import { render } from '@testing-library/react';
import React from 'react';
import { expect, it, vi } from 'vitest';
import { DetailsItemModel } from '../DetailsItemModel';

it.each([
  ['DetailsBlockModel', true, 'horizontal', 'DisplayTextFieldModel', 'text', '3px', '29px', true],
  ['GridCardBlockModel', true, 'horizontal', 'DisplayTextFieldModel', 'text', '8px', '24px', true],
  ['GridCardBlockModel', true, 'horizontal', 'DisplayTextFieldModel', 'tag', '8px', '24px', false],
  ['DetailsBlockModel', true, 'horizontal', 'DisplayHtmlFieldModel', 'text', '3px', '29px', false],
  ['CCTaskCardDetailsModel', true, 'horizontal', 'DisplayTextFieldModel', 'text', '', '', false],
  ['DetailsBlockModel', false, 'horizontal', 'DisplayTextFieldModel', 'text', '', '', false],
  ['GridCardBlockModel', true, 'vertical', 'DisplayTextFieldModel', 'text', '', '', false],
] as const)(
  'selects phone styles for %s, mobile=%s, %s, %s (%s)',
  (block, mobile, layout, field, displayStyle, margin, minHeight, plainText) => {
    const engine = new FlowEngine();
    engine.registerModels({ [field]: FlowModel });
    const model = new DetailsItemModel({ uid: 'detail-field', flowEngine: engine });
    model.context.defineProperty('blockModel', { value: { use: block, props: { layout } } });
    model.context.defineProperty('isMobileLayout', { value: mobile });
    model.setProps('label', 'Name');
    model.setStepParams('fieldSettings', 'init', { fieldPath: 'name' });
    model.setSubModel('field', { use: field, props: { displayStyle } });

    const { container } = render(React.cloneElement(model.renderItem(), {}, <span>Value</span>));
    const item = container.querySelector<HTMLElement>('.ant-form-item');
    const value = item.querySelector('.ant-form-item-control-input-content');
    const rules = Array.from(document.styleSheets).flatMap((sheet) => Array.from(sheet.cssRules));
    const narrowRules = rules.flatMap((rule) =>
      rule instanceof CSSMediaRule && rule.conditionText === '(max-width: 575px)' ? Array.from(rule.cssRules) : [],
    );
    const declarations = (element: Element, property: string) =>
      narrowRules
        .flatMap((rule) =>
          rule instanceof CSSStyleRule && element.matches(rule.selectorText)
            ? [rule.style.getPropertyValue(property)]
            : [],
        )
        .filter(Boolean);

    expect(item.style.marginBottom).toBe(margin ? '' : '12px');
    expect(declarations(item, 'margin-bottom')).toEqual(margin ? [margin] : []);
    expect(declarations(item, 'min-height')).toEqual(minHeight ? [minHeight] : []);
    expect(declarations(value, 'line-height')).toEqual(plainText ? ['max(20px, 1.4em)'] : []);
  },
);

it('does not subscribe the grid card item to field renderer prop writes', () => {
  const engine = new FlowEngine();
  engine.registerModels({ DisplayTextFieldModel: FlowModel });
  const item = new DetailsItemModel({ uid: 'card-field', flowEngine: engine });
  item.context.defineProperty('blockModel', { value: { use: 'GridCardBlockModel', props: { layout: 'horizontal' } } });
  item.context.defineProperty('isMobileLayout', { value: true });
  item.context.defineProperty('fieldIndex', { value: 0 });
  item.setStepParams('fieldSettings', 'init', { fieldPath: 'name' });
  const field = item.setSubModel('field', { use: 'DisplayTextFieldModel' });
  const invalidate = vi.fn();
  const tracker = new Tracker(invalidate);
  try {
    tracker.track(() => item.renderItem());
    field.getFork('0').setProps({ value: 'First row' });
    expect(invalidate).not.toHaveBeenCalled();
  } finally {
    tracker.dispose();
  }
});
