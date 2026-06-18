/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import type { FormInstance } from 'antd';
import React, { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { MailerFieldset } from '../components/MailerFieldset';

const mockState = vi.hoisted(() => ({
  defaultedTypedInputs: [] as string[],
}));

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@nocobase/plugin-workflow/client-v2', () => {
  type InputProps = {
    value?: unknown;
    onChange?: (value: unknown) => void;
    defaultToFirstConstantTypeWhenUndefined?: boolean;
    placeholder?: string;
    types?: unknown;
  };

  function getInputId(props: InputProps) {
    return props.placeholder ?? JSON.stringify(props.types);
  }

  function WorkflowTypedVariableInput(props: InputProps) {
    useEffect(() => {
      if (props.value !== undefined || props.defaultToFirstConstantTypeWhenUndefined === false) {
        return;
      }
      mockState.defaultedTypedInputs.push(getInputId(props));
      props.onChange?.('');
    }, [props]);

    return (
      <input
        aria-label={getInputId(props)}
        readOnly
        value={typeof props.value === 'string' ? props.value : ''}
        data-value={props.value === undefined ? '<undefined>' : String(props.value)}
      />
    );
  }

  function WorkflowVariableInput(props: InputProps) {
    return <input aria-label={props.placeholder ?? 'workflow-variable-input'} readOnly value="" />;
  }

  function WorkflowVariableTextArea(props: InputProps) {
    return <textarea aria-label={props.placeholder ?? 'workflow-variable-textarea'} readOnly value="" />;
  }

  return {
    WorkflowTypedVariableInput,
    WorkflowVariableInput,
    WorkflowVariableTextArea,
  };
});

function renderWithForm() {
  let formRef: FormInstance | undefined;

  function Wrapper() {
    const [form] = Form.useForm();
    formRef = form;

    return (
      <Form form={form}>
        <MailerFieldset />
      </Form>
    );
  }

  render(<Wrapper />);

  return () => formRef;
}

describe('MailerFieldset', () => {
  it('initializes empty string fields without triggering typed input default changes', async () => {
    mockState.defaultedTypedInputs = [];
    const getForm = renderWithForm();

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'provider', 'host'])).toBe('');
      expect(getForm()?.getFieldValue(['config', 'provider', 'auth', 'user'])).toBe('');
      expect(getForm()?.getFieldValue(['config', 'provider', 'auth', 'pass'])).toBe('');
      expect(getForm()?.getFieldValue(['config', 'from'])).toBe('');
    });

    expect(screen.getByLabelText('smtp.example.com')).toHaveAttribute('data-value', '');
    expect(screen.getByLabelText('example@domain.com')).toHaveAttribute('data-value', '');
    expect(screen.getByLabelText('noreply <example@domain.com>')).toHaveAttribute('data-value', '');
    expect(screen.getByLabelText('[["string",{"type":"password"}]]')).toHaveAttribute('data-value', '');
    expect(mockState.defaultedTypedInputs).not.toContain('smtp.example.com');
    expect(mockState.defaultedTypedInputs).not.toContain('example@domain.com');
    expect(mockState.defaultedTypedInputs).not.toContain('noreply <example@domain.com>');
    expect(mockState.defaultedTypedInputs).not.toContain('[["string",{"type":"password"}]]');
  });
});
