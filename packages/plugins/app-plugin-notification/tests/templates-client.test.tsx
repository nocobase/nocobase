import { useState, type ReactElement } from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { describe, expect, it } from 'vitest';
import { NotificationTemplates } from '../client/components/templates.js';
import enUS from '../client/locales/en-US.js';
import type { NotificationTemplateView } from '../shared/templates.js';

const item: NotificationTemplateView = {
  id: 'task.assigned',
  name: 'Task assigned',
  category: 'Tasks',
  contributor: 'example',
  trigger: 'Task created',
  recipients: 'Assignee',
  businessRule: 'On business action',
  locales: ['en-US'],
  languagePolicy: 'English only',
  variables: [{ name: 'title', description: 'Task title' }],
  channels: [
    { name: 'inbox', type: 'in-app', configured: true, enabled: false },
  ],
};
function Page(): ReactElement {
  const [id, setId] = useState<string | null>(null);
  return <NotificationTemplates selectedId={id} onSelect={setId} />;
}

async function renderPage(list: unknown = { data: [item] }) {
  const calls: string[] = [];
  await renderWithApp(<Page />, {
    namespace: '@nocobase/app-plugin-notification',
    namespaces: { '@nocobase/app-plugin-notification': enUS },
    fetch: answerApi(({ path, method }) => {
      calls.push(`${method} ${path}`);
      if (path === 'notifications/templates') return list;
      if (path === 'notifications/templates/task.assigned')
        return { data: item };
      if (path === 'notifications/templates/task.assigned/preview')
        return {
          data: {
            synthetic: true,
            requestedLocale: 'en-US',
            effectiveLocale: 'en-US',
            definition: { title: '{{title}}', body: 'Template' },
            content: {
              title: 'Sample task',
              body: 'Synthetic example',
              html: '<img src="https://example.invalid/track"><script>alert(1)</script>',
            },
          },
        };
      return new Response(null, { status: 404 });
    }),
  });
  return calls;
}

describe('read-only template administration', () => {
  it('searches and displays a synthetic preview with inert HTML and truthful status', async () => {
    const calls = await renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'View details' }),
    );
    expect(await screen.findByText('Sample task')).toBeVisible();
    expect(screen.getByText('Synthetic example')).toBeVisible();
    expect(
      screen.getByText(/inbox · in-app · Configured · Disabled/u),
    ).toBeVisible();
    expect(screen.getByLabelText('HTML source (inert text)')).toHaveTextContent(
      '<script>alert(1)</script>',
    );
    expect(
      screen
        .getByRole('region', { name: 'View details' })
        .querySelector('img, iframe, script'),
    ).toBeNull();
    expect(calls).toEqual([
      'GET notifications/templates',
      'GET notifications/templates/task.assigned',
      'POST notifications/templates/task.assigned/preview',
    ]);
    fireEvent.change(screen.getByLabelText('Search scenarios'), {
      target: { value: 'missing' },
    });
    expect(screen.getByText('No scenarios match these filters.')).toBeVisible();
    fireEvent.change(screen.getByLabelText('Search scenarios'), {
      target: { value: 'assigned' },
    });
    expect(screen.getByRole('button', { name: 'View details' })).toBeVisible();
  });

  it('distinguishes an empty registry from denied access and a retryable failure', async () => {
    await renderPage({ data: [] });
    expect(
      await screen.findByText('No notification scenarios are registered.'),
    ).toBeVisible();
  });

  it('does not offer retry on a permission denial', async () => {
    await renderPage(
      new Response(
        JSON.stringify({
          error: {
            reason: 'NOTIFICATION_TEMPLATES_FORBIDDEN',
            message: 'Forbidden',
          },
        }),
        { status: 403, headers: { 'content-type': 'application/json' } },
      ),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You do not have permission',
    );
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('offers retry after a server error', async () => {
    await renderPage(new Response(null, { status: 500 }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible(),
    );
  });
});
