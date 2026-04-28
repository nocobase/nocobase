/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { Form } from 'antd';
import { describe, expect, it } from 'vitest';
import { FormItem } from '../FormItem';

describe('FlowEngine FormItem', () => {
  it('allows horizontal label columns to shrink in narrow layouts', () => {
    const { container } = render(
      <Form>
        <FormItem label="公司名称" layout="horizontal" labelWidth={120}>
          <span>测试值</span>
        </FormItem>
      </Form>,
    );

    const label = container.querySelector('.ant-form-item-label') as HTMLElement;
    const control = container.querySelector('.ant-form-item-control') as HTMLElement;

    expect(label.style.width).toBe('120px');
    expect(label.style.flex).toBe('0 1 120px');
    expect(label.style.maxWidth).toBe('120px');
    expect(label.style.minWidth).toBe('0');
    expect(control.style.flex).toBe('1 1 0px');
    expect(control.style.minWidth).toBe('0');
  });
});
