import { ApiClientError } from '@nocobase/app-client';
import { renderWithApp } from '@nocobase/app-testing/client';
import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import demoMode from '../../client/index.js';
import { ErrorAlert } from '../../client/settings/shared.js';

it('renders the standard localized API message and falls back for malformed messages', async () => {
  for (const localizedMessage of [
    { locale: 'en-US', message: 'Invalid collection' },
    { locale: 'en-US', message: { unexpected: true } },
  ]) {
    const error = new ApiClientError('Internal diagnostic', {
      status: 400,
      reason: 'DEMO_CONFIGURATION_INVALID',
      method: 'PUT',
      url: '/demoMode/configuration/collections',
      payload: { error: { localizedMessage } },
    });
    const view = await renderWithApp(<ErrorAlert error={error} />, {
      plugins: [demoMode()],
      locale: 'en-US',
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      typeof localizedMessage.message === 'string'
        ? 'Invalid collection'
        : 'The request did not complete. Try again.',
    );
    expect(screen.queryByText('Internal diagnostic')).not.toBeInTheDocument();
    view.unmount();
  }
});
