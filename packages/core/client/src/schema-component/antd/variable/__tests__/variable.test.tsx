import React from 'react';
import { render, screen, userEvent, waitFor } from 'testUtils';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';
import App3 from '../demos/demo3';

describe('Variable', () => {
  it('Variable.Input', async () => {
    render(<App1 />);

    expect(screen.getByPlaceholderText('Null')).toBeInTheDocument();

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
        '"<span class="ant-tag ant-tag-blue" contenteditable="false" data-variable="v1">v1</span>"',
      );
    });
  });

  it('Variable.JSON', async () => {
    render(<App3 />);

    const input = document.querySelector<HTMLTextAreaElement>('.ant-input');
    const variableSelector = document.querySelector('.ant-select-selector');
    expect(input).toBeInTheDocument();
    expect(variableSelector).toBeInTheDocument();

    // https://testing-library.com/docs/user-event/keyboard/
    await userEvent.type(input, '{{ "a": "');
    await userEvent.click(variableSelector);
    await userEvent.click(screen.getByText('v1'));
    await userEvent.type(input, '" }');
    await waitFor(() => {
      expect(input.value).toMatchInlineSnapshot('"{ "a": "{{v1}}" }"');
    });
  });
});
