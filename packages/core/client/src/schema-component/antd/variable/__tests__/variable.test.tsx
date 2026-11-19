/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, userEvent, waitFor } from '@nocobase/test/client';
import React from 'react';
import { RawTextArea } from '../RawTextArea';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';
import App3 from '../demos/demo3';

describe('Variable', () => {
  it('Variable.Input', async () => {
    render(<App1 />);

    expect(screen.getByPlaceholderText('<Null>')).toBeInTheDocument();

    await userEvent.click(screen.getByText('x'));
    await userEvent.click(screen.getByText('v1'));
    await waitFor(() => {
      expect(screen.getByText('v1', { selector: '.ant-tag' }).innerHTML).toMatchInlineSnapshot('"v1"');
    });
  });

  it('Variable.TextArea', async () => {
    render(<App2 />);

    const input = document.querySelector('.ant-input');
    const variableSelector = document.querySelector('.ant-select-selector');
    expect(input).toBeInTheDocument();
    expect(variableSelector).toBeInTheDocument();

    await userEvent.click(variableSelector);
    await userEvent.click(screen.getByText('v1'));
    await waitFor(() => {
      expect(input.innerHTML).toMatchInlineSnapshot(
        `"<span class="ant-tag ant-tag-blue" contenteditable="false" data-variable="v1">v1</span>"`,
      );
    });
  });

  it('inserts a newly available variable at the selection in an open raw text area', async () => {
    const { rerender } = render(<RawTextArea scope={[]} syncScope />);
    const input = screen.getByRole<HTMLTextAreaElement>('textbox');
    await userEvent.type(input, '<p>draft</p>');
    input.setSelectionRange(3, 8);

    const scope = [
      { label: 'Custom variables', value: '$customVariables', children: [{ label: 'Total', value: 'total' }] },
    ];
    rerender(<RawTextArea scope={scope} syncScope />);
    expect(screen.getByRole('textbox')).toBe(input);
    expect(input.value).toBe('<p>draft</p>');
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('Custom variables'));
    await userEvent.click(screen.getByText('Total'));
    expect(input.value).toBe('<p>{{$customVariables.total}}</p>');
  });

  it('retains refreshed options when an earlier lazy load finishes', async () => {
    let finishLoading: () => void;
    const loading = new Promise<void>((resolve) => {
      finishLoading = resolve;
    });
    const loadChildren = vi.fn(async (option) => {
      await loading;
      option.children = [{ label: 'Name', value: 'name' }];
    });
    const user = { label: 'User', value: 'user', isLeaf: false, loadChildren };
    const { rerender } = render(<RawTextArea scope={[user]} syncScope />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByText('User'));
    expect(loadChildren).toHaveBeenCalledTimes(1);

    rerender(<RawTextArea scope={[user, { label: 'Total', value: 'total' }]} syncScope />);
    finishLoading();
    await screen.findByText('Name');
    expect(screen.getByText('Total')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Name'));
    expect(screen.getByRole('textbox')).toHaveValue('{{user.name}}');
  });

  it('keeps the initial options for raw text areas without scope synchronization', async () => {
    const { rerender } = render(<RawTextArea scope={[{ value: 'first', label: 'First' }]} />);
    rerender(<RawTextArea scope={[{ value: 'second', label: 'Second' }]} />);
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.queryByText('Second')).not.toBeInTheDocument();
  });

  it('Variable.JSON', async () => {
    render(<App3 />);

    const input = document.querySelector<HTMLTextAreaElement>('.ant-input');
    const variableSelector = document.querySelector('.ant-select-selector');
    expect(input).toBeInTheDocument();
    expect(variableSelector).toBeInTheDocument();

    await userEvent.click(variableSelector);
    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'v1' }));
    await waitFor(() => {
      expect(input.value).toMatchInlineSnapshot('"{{v1}}"');
    });
  });
});
