/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { FormProvider, createSchemaField } from '@formily/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MobileUnixTimestamp } from '../pages/dynamic-page/components/MobileDatePicker';

vi.mock('antd-mobile', () => ({
  DatePicker: ({ onConfirm }) => <button onClick={() => onConfirm(new Date(2026, 10, 9, 8, 25))}>Choose date</button>,
  Picker: () => null,
}));
vi.mock('@nocobase/client', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  DatePicker: Object.assign(() => <span />, { ReadPretty: () => null }),
  useVariables: () => ({}),
  useLocalVariables: () => [],
}));

it('submits the selected local date and time as an instant with no utc schema override', async () => {
  const form = createForm();
  const SchemaField = createSchemaField({ components: { MobileUnixTimestamp } });
  render(
    <FormProvider form={form}>
      <SchemaField
        schema={{
          type: 'object',
          properties: {
            epoch: {
              type: 'string',
              'x-component': 'MobileUnixTimestamp',
              'x-component-props': { picker: 'date', showTime: true },
            },
          },
        }}
      />
    </FormProvider>,
  );
  fireEvent.click(screen.getByText('Choose date'));
  await waitFor(() => expect(form.values.epoch).toBe(new Date(2026, 10, 9, 8, 25).toISOString()));
});
