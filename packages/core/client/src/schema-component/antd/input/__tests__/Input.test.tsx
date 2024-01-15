import { fireEvent, render, screen, userEvent, waitFor } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/input';
import App4 from '../demos/json';
import App2 from '../demos/textarea';
import App3 from '../demos/url';

describe('Input', () => {
  it('should display the title', () => {
    render(<App1 />);

    expect(screen.getByText('Editable').innerHTML).toBe('Editable');
    expect(screen.getByText('Read pretty').innerHTML).toBe('Read pretty');
  });

  it('should display the value of user input', async () => {
    const { container } = render(<App1 />);

    await waitFor(async () => {
      const input = container.querySelector('input') as HTMLInputElement;
      await userEvent.type(input, 'Hello World');
      expect(screen.getByText('Hello World').innerHTML).toBe('Hello World');
    });
  });
});

describe('Input.TextArea', () => {
  it('should display the title', () => {
    render(<App2 />);

    expect(screen.getByText('Editable').innerHTML).toBe('Editable');
    expect(screen.getByText('Read pretty').innerHTML).toBe('Read pretty');
    expect(screen.getByText('Read pretty(ellipsis)').innerHTML).toBe('Read pretty(ellipsis)');
    expect(screen.getByText('Read pretty(autop)').innerHTML).toBe('Read pretty(autop)');
  });

  it('should display the value of user input', () => {
    const { container } = render(<App2 />);

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Hello World, Hello World' } });

    expect(textarea.value).toBe('Hello World, Hello World');
    expect(screen.getAllByText('Hello World, Hello World')).toHaveLength(4);
  });

  it('should not display undefined', () => {
    render(<App2 />);

    // @ts-ignore
    expect(screen.queryByText('undefined')).toBeNull();
  });
});

describe('Input.URL', () => {
  it('should display the title', () => {
    render(<App3 />);

    expect(screen.getByText('Editable').innerHTML).toBe('Editable');
    expect(screen.getByText('Read pretty').innerHTML).toBe('Read pretty');
  });

  it('should display the value of user input', async () => {
    const { container } = render(<App3 />);

    const input = container.querySelector('input') as HTMLInputElement;
    await userEvent.type(input, 'https://www.nocobase.com');
    expect(input.value).toBe('https://www.nocobase.com');
    expect(screen.getByText('https://www.nocobase.com')).toBeInTheDocument();
  });

  it('should display the error when the value is invalid', async () => {
    const { container } = render(<App3 />);

    const input = container.querySelector('input') as HTMLInputElement;
    await userEvent.type(input, 'abcd');
    expect(input.value).toBe('abcd');
    expect(screen.getByText('abcd')).toBeInTheDocument();

    // show error message
    expect(screen.getByText('The field value is a invalid url').innerHTML).toBe('The field value is a invalid url');
  });
});

describe('Input.JSON', () => {
  it('should display the title', async () => {
    render(<App4 />);

    await waitFor(() => {
      expect(screen.getByText('Editable').innerHTML).toBe('Editable');
      expect(screen.getByText('Read pretty').innerHTML).toBe('Read pretty');
    });
  });

  it('should display the value of user input', async () => {
    const { container } = render(<App4 />);

    await waitFor(() => {
      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
      const pre = container.querySelector('pre') as HTMLPreElement;
      fireEvent.change(textarea, { target: { value: '{"name":"nocobase"}' } });
      fireEvent.blur(textarea, { target: { value: '{"name":"nocobase"}' } });
      expect(JSON.parse(textarea.value)).toEqual({ name: 'nocobase' });
      expect(pre).toMatchInlineSnapshot(`
      <pre
        class="ant-json css-4dta7v"
      >
        {
        "name": "nocobase"
      }
      </pre>
    `);
    });
  });

  it('should display the error when the value is invalid', async () => {
    const { container } = render(<App4 />);

    await waitFor(() => {
      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: '{"name":nocobase}' } });
      fireEvent.blur(textarea, { target: { value: '{"name":nocobase}' } });
      expect(screen.getByText(/Unexpected token/)).toBeInTheDocument();
    });
  });
});
