// @vitest-environment jsdom
// The new skill dialog asks before closing while it holds an unsaved draft.
import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clientMocks, resetApi } from './fake-client.js';
import { renderRoute } from './render.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { default: NewSkillPage } =
  await import('../../client/pages/skills/new.js');

async function cancelAndAnswer(answer: string): Promise<void> {
  fireEvent.click(screen.getByRole('button', { name: 'actions.cancel' }));
  const confirm = await screen.findByRole('alertdialog');
  expect(within(confirm).getByText('unsavedChanges.title')).toBeInTheDocument();
  fireEvent.click(within(confirm).getByRole('button', { name: answer }));
}

describe('dialogs with unsaved input', () => {
  beforeEach(() => {
    resetApi({}, ['agents.skills/read', 'agents.skills/manage']);
  });

  it('asks before discarding a new skill', async () => {
    renderRoute(<NewSkillPage />, '/skills/new', '/skills/new');
    fireEvent.change(await screen.findByLabelText('skills.content'), {
      target: { value: '---\nname: review\n---\n' },
    });
    await cancelAndAnswer('unsavedChanges.discard');
    expect(await screen.findByText('elsewhere')).toBeInTheDocument();
  });
});
