/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import { Form } from 'antd';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ResponseMessageFieldset } from '../nodes/components/response-message';

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => ({
  WorkflowVariableInput: () => <input aria-label="workflow-variable-input" />,
}));

describe('ResponseMessageFieldset', () => {
  it('renders the migrated antd fieldset and reuses WorkflowVariableInput', () => {
    render(
      <Form layout="vertical">
        <ResponseMessageFieldset />
      </Form>,
    );

    expect(screen.getByText('Message content')).toBeInTheDocument();
    expect(screen.getByText('Supports variables in template.')).toBeInTheDocument();
    expect(screen.getByLabelText('workflow-variable-input')).toBeInTheDocument();
    expect(
      screen.getByText('If the workflow ends normally, the response message will return a success status by default.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'If you want to return a failure status, please add an "End Process" node downstream to terminate the workflow.',
      ),
    ).toBeInTheDocument();
  });
});
