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
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { createRunJSSourceModeField } from '../RunJSSourceModeField';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('RunJSSourceModeField', () => {
  it('preserves a controlled light-extension value when its provider is unavailable', async () => {
    const form = createForm();
    const onChange = vi.fn();
    const SourceModeField = createRunJSSourceModeField('MissingLightExtensionSourceField');

    render(
      <FormProvider form={form}>
        <SourceModeField value="light-extension" onChange={onChange} />
      </FormProvider>,
    );

    expect(screen.getByText('Light extension source is unavailable')).toBeInTheDocument();
    await waitFor(() => {
      expect(onChange).not.toHaveBeenCalled();
      expect(form.values.sourceMode).toBeUndefined();
    });
  });
});
