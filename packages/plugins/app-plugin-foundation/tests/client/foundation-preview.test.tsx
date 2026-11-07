import { renderWithApp } from '@nocobase/app-testing/client';
import { fireEvent, screen, within, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import plugin from '../../client/plugin.js';
import { FoundationPreviewView } from '../../client/components/foundation-preview.js';
import { foundationPreviewDefinitions } from '../../client/routes.js';
import {
  FOUNDATION_I18N_NAMESPACE,
  type FoundationOverview,
} from '../../shared/foundation.js';

const overview: FoundationOverview = {
  checkedAt: '2026-11-07T09:00:00Z',
  durationMs: 1,
  connection: 'main',
  capabilities: [
    {
      key: 'dataModeling',
      status: 'active',
      completeness: 'complete',
      facts: [],
      metrics: [
        {
          key: 'businessCollections',
          value: 82,
          unit: 'count',
          complete: true,
        },
      ],
      parts: [],
      packages: [{ name: '@nocobase/db', version: 'fixture' }],
      issues: [],
    },
    {
      key: 'extension:example',
      title: 'Unclassified extension',
      status: null,
      completeness: 'partial',
      reason: 'unrecognizedExtension',
      facts: [],
      metrics: [],
      parts: [],
      packages: [],
      issues: [],
    },
  ],
};
async function render(route = '/foundation-preview') {
  return renderWithApp(
    <Routes>
      {foundationPreviewDefinitions().map((definition) => (
        <Route
          key={definition.name}
          path={definition.path}
          element={<FoundationPreviewView overview={overview} />}
        />
      ))}
    </Routes>,
    { route, plugins: [plugin()], namespace: FOUNDATION_I18N_NAMESPACE },
  );
}

describe('Foundation design preview', () => {
  it('keeps both preview routes restricted and separate from the existing page', () => {
    for (const route of foundationPreviewDefinitions())
      expect(route).toMatchObject({ auth: 'required', authz: 'unrestricted' });
  });
  it('shows grouped capabilities without putting technical numbers or unknown providers in the summary', async () => {
    await render();
    expect(
      screen.getByRole('region', { name: 'Data & files' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('82')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Unclassified extension'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('1 / 2')).not.toBeInTheDocument();
  });
  it('opens URL-addressable details and exposes technical information on demand', async () => {
    await render();
    fireEvent.click(screen.getByRole('button', { name: /^Data modeling/ }));
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Data modeling' }),
    ).toBeInTheDocument();
    expect(within(dialog).queryByText('82')).not.toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Technical details' }),
    );
    expect(await within(dialog).findByText('82')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });
  it('supports a direct link to a capability and a search with no results', async () => {
    await render('/foundation-preview/dataModeling');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'absent' },
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      'No matching capabilities.',
    );
  });
});
