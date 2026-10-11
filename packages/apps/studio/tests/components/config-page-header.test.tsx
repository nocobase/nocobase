import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@nocobase/app-plugin-projects/client/kit', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@nocobase/app-plugin-projects/client/kit')
  >()),
  useViewer: () => ({ userId: 'u1' }),
  canUseSetting: (_viewer: unknown, item: string, action: string) =>
    item === 'pm.general' && action === 'read',
}));

vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: false, isPending: false }),
}));

const { default: ConfigPage } = await import('../../client/pages/config/index');
const { SettingsPageHeader } =
  await import('@nocobase/app-plugin-projects/client/kit');

describe('the settings page headings', () => {
  it('leaves the heading to the page: the settings area draws none of its own', () => {
    render(
      <MemoryRouter initialEntries={['/config/general']}>
        <Routes>
          <Route path='/config' element={<ConfigPage />}>
            <Route path='*' element={<p>page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('page')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('titles a page with its h1 and says when the viewer may only read it', () => {
    const { rerender } = render(
      <SettingsPageHeader id='page' title='Labels' description='About' />,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Labels' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('note')).toBeNull();
    rerender(
      <SettingsPageHeader
        id='page'
        title='Labels'
        description='About'
        readOnly
      />,
    );
    expect(screen.getByRole('note')).toHaveTextContent('settingsPage.readOnly');
  });
});
