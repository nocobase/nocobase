import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithApp } from '@nocobase/app-testing/client';

import plugin from '../../client/index.js';
import AIEmployeeTasksFallbackPage from '../../client/pages/tasks-fallback.js';

describe('AI employee tasks fallback page', () => {
  it('names the Registry items to install and what the server registers', async () => {
    await renderWithApp(<AIEmployeeTasksFallbackPage />, {
      plugins: [plugin()],
      namespace: '@nocobase/app-plugin-ai-employee-example',
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'AI employee tasks' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/nocobase-ai item/)).toBeInTheDocument();
    expect(screen.getByText(/tasks-page item/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /AI employee “iris” and the read-only tool “example-ticket-history”/,
      ),
    ).toBeInTheDocument();
  });
});
