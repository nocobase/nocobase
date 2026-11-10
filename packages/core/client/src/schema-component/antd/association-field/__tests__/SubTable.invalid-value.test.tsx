/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { createSchemaField, FormProvider } from '@formily/react';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { SubTable } from '../SubTable';

const ctx = vi.hoisted(() => ({ field: undefined }));
vi.mock('../hooks', () => ({
  useAssociationFieldContext: () => ({ field: ctx.field, options: { targetKey: 'code' }, fieldSchema: {} }),
  useFieldNames: () => ({ label: 'title' }),
}));
vi.mock('../../form-item/hooks/useSpecialCase', () => ({ useSubTableSpecialCase: () => {} }));
vi.mock('../util', () => ({ useLabelUiSchema: () => null }));
vi.mock('../../../hooks', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCompile: () => (value) => value,
}));
vi.mock('../../action', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useActionContext: () => ({}),
}));

it.each([1, { code: 1 }])('reports the invalid sub-table default and prevents submitting it', async (value) => {
  const form = createForm();
  ctx.field = form.createField({ name: 'bad', value });
  const SchemaField = createSchemaField({ components: { SubTable } });
  render(
    <FormProvider form={form}>
      <SchemaField schema={{ type: 'object', properties: { ui: { type: 'void', 'x-component': 'SubTable' } } }} />
    </FormProvider>,
  );
  expect(screen.getByRole('alert').textContent).toContain('list of records');
  await waitFor(() => expect(form.errors).toHaveLength(1));
  await expect(form.submit()).rejects.toBeDefined();
  expect(form.values.bad).toEqual(value);
});
