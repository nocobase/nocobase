/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Form } from 'antd';
import ScheduleConfig from '../ScheduleConfig';
import { SCHEDULE_MODE } from '../constants';

vi.mock('../../../locale', () => ({
  NAMESPACE: 'workflow',
  useT: () => (key: string) => key,
}));

vi.mock('../../../components/collection', () => ({
  CollectionCascader: () => <div data-testid="collection-cascader" />,
  AppendsSelect: () => <div data-testid="appends-select" />,
}));

vi.mock('../OnField', () => ({
  OnField: () => <div data-testid="on-field" />,
}));

vi.mock('../RepeatField', () => ({
  RepeatField: () => <div data-testid="repeat-field" />,
}));

vi.mock('../EndsByField', () => ({
  EndsByField: () => <div data-testid="ends-by-field" />,
}));

describe('ScheduleConfig', () => {
  it('marks starts-on as required in date-field mode', () => {
    const { container } = render(
      <Form initialValues={{ config: { mode: SCHEDULE_MODE.DATE_FIELD, collection: 'roles' } }}>
        <ScheduleConfig />
      </Form>,
    );

    expect(screen.getByTestId('on-field')).toBeInTheDocument();

    const startsOnLabel = container.querySelector('label[for="config_startsOn"]');
    expect(startsOnLabel).toBeTruthy();
    expect(startsOnLabel).toHaveClass('ant-form-item-required');
  });
});
