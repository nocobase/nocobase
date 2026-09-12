/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { FormProvider } from '@formily/react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UseOriginalUrlRadio } from '../UseOriginalUrlRadio';

vi.mock('../locale', () => ({
  useFmTranslation: () => ({ t: (value: string) => value }),
}));

describe('UseOriginalUrlRadio', () => {
  afterEach(cleanup);

  it('controls public access in the proxy URL option and clears it for original URLs', async () => {
    const form = createForm({ initialValues: { options: { public: true } } });
    const { rerender } = render(
      <FormProvider form={form}>
        <UseOriginalUrlRadio value={false} />
      </FormProvider>,
    );

    expect(screen.getByRole('checkbox', { name: 'Allow public access' })).toBeChecked();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Allow public access' }));
    expect(form.getValuesIn('options.public')).toBe(false);

    act(() => {
      form.setValuesIn('options.public', true);
    });
    rerender(
      <FormProvider form={form}>
        <UseOriginalUrlRadio value />
      </FormProvider>,
    );

    await waitFor(() => {
      expect(form.getValuesIn('options.public')).toBe(false);
      expect(screen.queryByRole('checkbox', { name: 'Allow public access' })).not.toBeInTheDocument();
    });
  });
});
