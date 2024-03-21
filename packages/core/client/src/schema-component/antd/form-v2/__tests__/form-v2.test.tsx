import { render, screen, userEvent, waitFor } from '@nocobase/test/client';
import React from 'react';
import App1 from '../demos/demo1';
import App2 from '../demos/demo2';
import App3 from '../demos/demo3';

describe('FormV2', () => {
  it('basic', async () => {
    render(<App1 />);

    let input, submit;
    await waitFor(() => {
      input = document.querySelector('.ant-input') as HTMLInputElement;
      submit = screen.getByText('Submit');
      expect(input).toBeInTheDocument();
      expect(screen.queryByText('Nickname')).toBeInTheDocument();
    });

    await userEvent.type(input, '李四');
    await userEvent.click(submit);

    await waitFor(() => {
      // notification 的内容
      expect(screen.getByText(/\{"nickname":"李四"\}/i)).toBeInTheDocument();
    });
  });

  it('initial values', async () => {
    render(<App2 />);

    await waitFor(() => {
      const nicknameInput = document.querySelector('.nickname .ant-input') as HTMLInputElement;
      const passwordInput = document.querySelector('.password .ant-input') as HTMLInputElement;
      const submit = screen.getByText('Submit');

      expect(submit).toBeInTheDocument();
      expect(nicknameInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(nicknameInput).toHaveValue('张三');
      expect(passwordInput).toHaveValue('123456');
      expect(screen.getByText('Nickname')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
    });
  });

  it('read pretty', async () => {
    render(<App3 />);

    await waitFor(() => {
      expect(screen.getByText('Nickname')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
      expect(screen.getByText('张三')).toBeInTheDocument();
      expect(screen.getByText(/\*\*\*\*\*\*\*\*/i)).toBeInTheDocument();
    });
  });
});
