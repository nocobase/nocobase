/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { Form } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SortFieldConfigureForm } from '../SortFieldConfigureForm';

vi.mock('@nocobase/flow-engine', () => ({
  useFlowEngine: () => ({
    context: {
      t: (value: string) => value,
    },
  }),
}));

const fields = [
  { name: 'title', type: 'string', uiSchema: { title: '{{t("Title")}}' } },
  { name: 'groupId', type: 'integer', uiSchema: { title: 'Group' } },
  { name: 'bigGroupId', type: 'bigInt' },
  { name: 'amount', type: 'double', uiSchema: { title: 'Amount' } },
  { name: 'createdAt', type: 'date', uiSchema: { title: 'Created at' } },
];

function ConfigureFormHarness({
  disabled,
  field,
  collection = { fields },
}: {
  disabled?: boolean;
  field?: {
    fields?: typeof fields;
  };
  collection?: {
    fields?: typeof fields;
  };
}) {
  const [form] = Form.useForm();

  return (
    <Form form={form}>
      <SortFieldConfigureForm disabled={disabled} field={field} collection={collection} />
    </Form>
  );
}

describe('SortFieldConfigureForm', () => {
  afterEach(() => {
    cleanup();
  });

  it('builds grouped sorting options from string, integer and bigInt collection fields', async () => {
    render(<ConfigureFormHarness />);

    expect(screen.getByText('Grouped sorting')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('combobox'));

    expect(await screen.findByTitle('Title')).toBeInTheDocument();
    expect(await screen.findByTitle('Group')).toBeInTheDocument();
    expect(await screen.findByTitle('bigGroupId')).toBeInTheDocument();
    expect(screen.queryByTitle('Amount')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Created at')).not.toBeInTheDocument();
  });

  it('prefers nested field metadata', async () => {
    render(
      <ConfigureFormHarness
        field={{
          fields: [
            { name: 'nestedName', type: 'string', uiSchema: { title: 'Nested name' } },
            { name: 'nestedJson', type: 'json', uiSchema: { title: 'Nested JSON' } },
          ],
        }}
      />,
    );

    fireEvent.mouseDown(screen.getByRole('combobox'));

    expect(await screen.findByTitle('Nested name')).toBeInTheDocument();
    expect(screen.queryByTitle('Nested JSON')).not.toBeInTheDocument();
  });

  it('disables grouped sorting selection when the configure field is disabled', () => {
    render(<ConfigureFormHarness disabled />);

    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('renders an empty select when no field metadata is available', () => {
    render(<ConfigureFormHarness collection={{}} />);

    fireEvent.mouseDown(screen.getByRole('combobox'));

    expect(within(document.body).queryByRole('option')).not.toBeInTheDocument();
  });
});
