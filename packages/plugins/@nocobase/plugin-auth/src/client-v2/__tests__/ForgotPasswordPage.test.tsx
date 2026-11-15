/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';

const lostPassword = vi.hoisted(() => vi.fn().mockResolvedValue({ status: 204 }));

vi.mock('@nocobase/client-v2', () => ({ useApp: () => ({ apiClient: { auth: { lostPassword } } }) }));
vi.mock('../authenticator', () => ({ useAuthenticator: () => ({ options: { enableResetPassword: true } }) }));
vi.mock('../locale', () => ({ useAuthTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('../hooks', () => ({ useDocumentTitle: () => {} }));

it('shows a conditional inbox message after an accepted recovery request', async () => {
  render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'recovery@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send reset email' }));
  await waitFor(() => expect(lostPassword).toHaveBeenCalledWith({ email: 'recovery@example.com' }));
  expect(
    await screen.findByText('If this email address is registered, you will receive a password reset email.'),
  ).toBeTruthy();
});
