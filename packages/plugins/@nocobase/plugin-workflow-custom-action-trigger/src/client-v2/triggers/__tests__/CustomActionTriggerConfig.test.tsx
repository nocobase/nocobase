/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Form } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import { CONTEXT_TYPE } from '../../../common/constants';
import { CustomActionTriggerConfig } from '../CustomActionTriggerConfig';

function TestForm() {
  const [form] = Form.useForm();

  React.useEffect(() => {
    form.setFieldsValue({ config: { type: CONTEXT_TYPE.SINGLE_RECORD, collection: 'posts' } });
  }, [form]);

  return (
    <Form form={form}>
      <CustomActionTriggerConfig />
    </Form>
  );
}

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  AppendsSelect: () => <div data-testid="appends-select" />,
  CollectionCascader: () => <div data-testid="collection-cascader" />,
}));

vi.mock('../../locale', () => ({
  useT: () => (key: string, options?: { ns?: string }) => (options?.ns ? `${options.ns}:${key}` : key),
}));

describe('CustomActionTriggerConfig', () => {
  it('uses the core client namespace for the collection field label', async () => {
    render(<TestForm />);

    expect(await screen.findByText('client:Collection')).toBeInTheDocument();
  });
});
