/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '../../../../../flowEngine';
import { FlowModel } from '../../../../../models/flowModel';
import { FlowSettings } from '../FlowSettings';

function createSettingsModel() {
  class SettingsModel extends FlowModel {}

  const engine = new FlowEngine();
  SettingsModel.registerFlow({
    key: 'settings',
    steps: {
      general: {
        title: 'General',
        uiSchema: {
          value: {
            title: 'Runtime value',
            type: 'string',
            'x-component': 'Input',
          },
        },
      },
    },
  });

  return new SettingsModel({ uid: 'embedded-settings-use-form', flowEngine: engine });
}

function stringifyConsoleCalls(spy: ReturnType<typeof vi.spyOn>) {
  return spy.mock.calls.map((args) => args.map(String).join(' ')).join('\n');
}

describe('embedded FlowSettings antd form lifecycle', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('keeps the antd form instance connected while async setting fields are prepared', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const model = createSettingsModel();

    render(<FlowSettings model={model} flowKey="settings" />);

    await waitFor(() => expect(screen.getByText('Runtime value')).toBeInTheDocument());
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(stringifyConsoleCalls(error)).not.toContain(
      'Instance created by `useForm` is not connected to any Form element',
    );
  });
});
