import { renderWithApp, answerApi } from '@nocobase/app-testing/client';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import Workbench from '../../client/pages/template-portal/my-apps.js';
import enUS from '../../client/locales/en-US.js';
import metadata from '../../package.json' with { type: 'json' };
async function renderPage(response: () => unknown) {
  return renderWithApp(<Workbench />, {
    namespace: metadata.name,
    namespaces: { [metadata.name]: enUS },
    fetch: answerApi(({ path }) =>
      path === 'multiApp/myApps'
        ? response()
        : new Response(null, { status: 404 }),
    ),
  });
}
it('renders compact application cards that enter through platform sign-in', async () => {
  await renderPage(() => ({
    data: [
      {
        id: 'lab',
        name: 'Teaching laboratory',
        url: 'https://example.test/lab/',
        template: 'reagents',
        templateName: 'Reagents',
      },
    ],
  }));
  expect(
    await screen.findByRole('link', { name: 'Teaching laboratory' }),
  ).toHaveAttribute(
    'href',
    'https://example.test/lab/login?auth=platform&redirect=%2F',
  );
  const link = screen.getByRole('link', { name: 'Teaching laboratory' });
  link.addEventListener('click', (event) => event.preventDefault());
  fireEvent.click(link, { ctrlKey: true });
  expect(link).toHaveAttribute('aria-busy', 'false');
  fireEvent.click(link);
  expect(link).toHaveAttribute('aria-busy', 'true');
  expect(screen.getByRole('progressbar')).toHaveAccessibleName(
    `${enUS.sso.entering} Teaching laboratory`,
  );
  expect(link).toHaveTextContent(enUS.portal.workbenchDescriptions.reagents);
  expect(link).not.toHaveTextContent(enUS.sso.entering);
  fireEvent(window, new Event('pageshow'));
  expect(screen.queryByRole('progressbar')).toBeNull();

  expect(screen.queryByRole('button', { name: 'Create app' })).toBeNull();
});
it('shows an empty state when no running application is available', async () => {
  await renderPage(() => ({ data: [] }));
  expect(await screen.findByText(enUS.portal.workbenchEmpty)).toBeVisible();
});
it('offers retry after a temporary failure', async () => {
  let fail = true;
  await renderPage(() =>
    fail ? new Response(null, { status: 503 }) : { data: [] },
  );
  await screen.findByRole('alert');
  fail = false;
  await userEvent.click(screen.getByRole('button', { name: enUS.sso.retry }));
  expect(await screen.findByText(enUS.portal.workbenchEmpty)).toBeVisible();
});
