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
import { AssociationSelect } from '../AssociationSelect';

vi.mock('../hooks', () => ({
  default: () => ({}),
  useAssociationFieldContext: () => ({ options: { target: 'teams', targetKey: 'id' } }),
}));

vi.mock('../../../', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useAPIClient: () => ({ resource: () => ({}) }),
  useCollectionRecordData: () => ({}),
  useCollectionManager_deprecated: () => ({
    getCollection: () => ({ filterTargetKey: 'code' }),
    getCollectionJoinField: () => ({ type: 'integer' }),
  }),
}));

vi.mock('../../remote-select', () => ({
  RemoteSelect: ({ onChange, value }) => (
    <button onClick={() => onChange({ id: 0, title: 'Team' })}>{value?.title || 'Choose'}</button>
  ),
}));

it('retains the selected team when the role can read its association key but not its collection identifier', async () => {
  const SchemaField = createSchemaField({ components: { AssociationSelect } });
  const form = createForm();
  render(
    <FormProvider form={form}>
      <SchemaField
        schema={{
          type: 'object',
          properties: {
            team: {
              type: 'object',
              required: true,
              'x-component': 'AssociationSelect',
            },
          },
        }}
      />
    </FormProvider>,
  );
  fireEvent.click(screen.getByText('Choose'));
  await waitFor(() => expect(form.values.team).toEqual({ id: 0, title: 'Team' }));
  await expect(form.submit()).resolves.toMatchObject({ team: { id: 0 } });
  form.setValuesIn('team', 'Wrong title');
  await waitFor(() => expect(form.errors).toHaveLength(1));
  await expect(form.submit()).rejects.toBeDefined();
});
