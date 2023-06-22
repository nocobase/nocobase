import React from 'react';
import { render, screen, sleep, userEvent } from 'testUtils';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';
import App3 from '../demos/demo3';

describe('Variable', () => {
  it('Variable.Input', async () => {
    render(<App1 />);

    expect(screen.getByPlaceholderText('Null')).toBeInTheDocument();

    await userEvent.click(screen.getByText('x'));
    await userEvent.click(screen.getByText('v1'));
    await sleep(100);
    expect(screen.getByText('v1', { selector: '.ant-tag' })).toMatchInlineSnapshot(`
      <span
        class="ant-tag ant-tag-blue css-dev-only-do-not-override-1wazalj"
        contenteditable="false"
      >
        v1
      </span>
    `);
  });

  it('Variable.TextArea', async () => {
    render(<App2 />);

    const input = document.querySelector('.ant-input') as HTMLElement;
    const variableSelector = document.querySelector('.ant-select-selector') as HTMLElement;
    expect(input).toBeInTheDocument();
    expect(variableSelector).toBeInTheDocument();

    await userEvent.type(input, '1+');
    await sleep(100);

    await userEvent.click(variableSelector);
    await userEvent.click(screen.getByText('v1'));
    await sleep(100);
    expect(input).toMatchInlineSnapshot(`
      <div
        class="ant-input css-1p5yrh5"
        contenteditable="true"
      >
        <span
          class="ant-tag ant-tag-blue"
          contenteditable="false"
          data-variable="v1"
        >
          v1
        </span>
        +1
      </div>
    `);
  });

  it('Variable.JSON', async () => {
    render(<App3 />);

    const input = document.querySelector('.ant-input') as HTMLTextAreaElement;
    const variableSelector = document.querySelector('.ant-select-selector') as HTMLElement;
    expect(input).toBeInTheDocument();
    expect(variableSelector).toBeInTheDocument();

    // https://testing-library.com/docs/user-event/keyboard/
    await userEvent.type(input, '{{ "a": "');
    await userEvent.click(variableSelector);
    await userEvent.click(screen.getByText('v1'));
    await sleep(100);

    await userEvent.type(input, '" }');
    // expect(input.value).toMatchInlineSnapshot('"{ \\"a\\": \\"{{v1}}\\" }"');
  });
});
