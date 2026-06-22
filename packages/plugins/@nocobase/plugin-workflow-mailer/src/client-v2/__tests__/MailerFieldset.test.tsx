/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import type { FormInstance } from 'antd';
import React, { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { MailerFieldset } from '../components/MailerFieldset';

const mockState = vi.hoisted(() => ({
  defaultedTypedInputs: [] as string[],
}));

const dndState = vi.hoisted(() => ({
  contexts: [] as Array<{
    items: string[];
    onDragEnd?: (event: { active: { id: string }; over?: { id: string } | null }) => void;
  }>,
  pendingDragEndHandlers: [] as Array<
    ((event: { active: { id: string }; over?: { id: string } | null }) => void) | undefined
  >,
}));

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('@dnd-kit/core', () => ({
  closestCenter: vi.fn(),
  DndContext: ({
    children,
    onDragEnd,
  }: {
    children: React.ReactNode;
    onDragEnd?: (event: { active: { id: string }; over?: { id: string } | null }) => void;
  }) => {
    dndState.pendingDragEndHandlers.push(onDragEnd);
    return <>{children}</>;
  },
  PointerSensor: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn((...sensors: unknown[]) => sensors),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children, items }: { children: React.ReactNode; items: string[] }) => {
    dndState.contexts.push({
      items,
      onDragEnd: dndState.pendingDragEndHandlers.shift(),
    });
    return <>{children}</>;
  },
  useSortable: vi.fn(({ id }: { id: string }) => ({
    attributes: { 'data-sortable-id': id },
    isDragging: false,
    listeners: {},
    setActivatorNodeRef: vi.fn(),
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
  })),
  verticalListSortingStrategy: vi.fn(),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => undefined),
    },
  },
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

  it('does not show the recipient required error immediately after adding a blank row', async () => {
    const getForm = renderWithForm();

    fireEvent.click(screen.getAllByRole('button', { name: /Add email address/ })[0]);

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'to'])).toEqual(['']);
    });

    expect(screen.queryByText('Please enter at least one email address')).toBeNull();

    let validationError: unknown;
    await act(async () => {
      try {
        await getForm()?.validateFields([['config', 'to']]);
      } catch (error) {
        validationError = error;
      }
    });

    expect(validationError).toMatchObject({
      errorFields: [
        {
          errors: ['Please enter at least one email address'],
        },
      ],
    });
  });

  it('clears the recipient required error after adding a blank row', async () => {
    const getForm = renderWithForm();

    await act(async () => {
      try {
        await getForm()?.validateFields([['config', 'to']]);
      } catch {
        // The assertion below checks the rendered validation state.
      }
    });

    expect(screen.getByText('Please enter at least one email address')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /Add email address/ })[0]);

    await waitFor(() => {
      expect(getForm()?.getFieldValue(['config', 'to'])).toEqual(['']);
      expect(screen.queryByText('Please enter at least one email address')).toBeNull();
    });
  });

  it('supports drag sorting recipient and attachment rows', async () => {
    dndState.contexts = [];
    dndState.pendingDragEndHandlers = [];
    const getForm = renderWithForm();
    const getCurrentForm = () => {
      const form = getForm();
      expect(form).toBeDefined();
      return form as FormInstance;
    };

    act(() => {
      getCurrentForm().setFieldsValue({
        config: {
          to: ['first@example.com', 'second@example.com'],
          attachments: ['{{$jobsMapByNodeKey.query.files.0}}', '{{$jobsMapByNodeKey.query.files.1}}'],
        },
      });
    });

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Drag sort' })).toHaveLength(4);
    });

    const getActiveContexts = () => dndState.contexts.filter((context) => context.items.length === 2).slice(-2);
    const [recipientContext, initialAttachmentContext] = getActiveContexts();
    const initialAttachmentItems = initialAttachmentContext.items;

    act(() => {
      recipientContext.onDragEnd?.({
        active: { id: recipientContext.items[0] },
        over: { id: recipientContext.items[1] },
      });
    });

    await waitFor(() => {
      expect(getCurrentForm().getFieldValue(['config', 'to'])).toEqual(['second@example.com', 'first@example.com']);
    });

    const attachmentContext = dndState.contexts
      .filter((context) => context.items.join('\n') === initialAttachmentItems.join('\n'))
      .at(-1);
    if (!attachmentContext) {
      throw new Error('Attachment sortable context was not rendered');
    }

    act(() => {
      attachmentContext.onDragEnd?.({
        active: { id: attachmentContext.items[0] },
        over: { id: attachmentContext.items[1] },
      });
    });

    await waitFor(() => {
      expect(getCurrentForm().getFieldValue(['config', 'attachments'])).toEqual([
        '{{$jobsMapByNodeKey.query.files.1}}',
        '{{$jobsMapByNodeKey.query.files.0}}',
      ]);
    });
  });
});
