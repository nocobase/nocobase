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
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createModelSettingsForm: vi.fn(() => () => <div>GigaChat model settings</div>),
}));

vi.mock('@nocobase/plugin-ai/client-v2', () => ({
  createModelSettingsForm: mocks.createModelSettingsForm,
}));

import { ModelSettingsForm } from '../llm-providers/gigachat/ModelSettings';

describe('GigaChat ModelSettingsForm', () => {
  it('creates the settings form lazily when the component renders', () => {
    expect(mocks.createModelSettingsForm).not.toHaveBeenCalled();

    const { rerender } = render(<ModelSettingsForm />);

    expect(screen.getByText('GigaChat model settings')).toBeInTheDocument();
    expect(mocks.createModelSettingsForm).toHaveBeenCalledTimes(1);

    rerender(<ModelSettingsForm />);

    expect(mocks.createModelSettingsForm).toHaveBeenCalledTimes(1);
  });
});
