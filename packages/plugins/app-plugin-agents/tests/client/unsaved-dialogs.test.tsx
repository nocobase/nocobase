// @vitest-environment jsdom
// NP-200: the agent, skill and variable dialogs ask before closing while they hold input that was not submitted.
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { callsTo, clientMocks, resetApi } from './fake-client.js';
import { agent } from './fixtures.js';
import { renderRoute } from './render.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { default: NewAgentPage } =
  await import('../../client/pages/agents/new.js');
const { default: NewSkillPage } =
  await import('../../client/pages/skills/new.js');
const { VariableDialog } =
  await import('../../client/components/variables/variable-dialogs.js');

const MANAGE = ['agents.agents/read', 'agents.agents/manage'];

async function cancelAndAnswer(answer: string): Promise<void> {
  fireEvent.click(screen.getByRole('button', { name: 'actions.cancel' }));
  const confirm = await screen.findByRole('alertdialog');
  expect(within(confirm).getByText('unsavedChanges.title')).toBeInTheDocument();
  fireEvent.click(within(confirm).getByRole('button', { name: answer }));
}

describe('dialogs with unsaved input', () => {
  beforeEach(() => {
    resetApi(
      {
        agents: () => [],
        'agents/runners': () => [],
        'agents/actions': () => [],
        'agents/presets': () => [],
        'PUT agents/variables/agent/a1/API_KEY': () => null,
      },
      MANAGE,
    );
  });

  it('closes the new agent dialog at once when nothing was entered', async () => {
    renderRoute(<NewAgentPage />, '/agents/new', '/agents/new');
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'actions.cancel' }));
    expect(await screen.findByText('elsewhere')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('asks before discarding a new agent, and keeps editing when told to', async () => {
    renderRoute(<NewAgentPage />, '/agents/new', '/agents/new');
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('agentForm.name'), {
      target: { value: 'Coder' },
    });
    await cancelAndAnswer('unsavedChanges.keepEditing');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(screen.getByLabelText('agentForm.name')).toHaveValue('Coder');
    await cancelAndAnswer('unsavedChanges.discard');
    expect(await screen.findByText('elsewhere')).toBeInTheDocument();
  });

  it('asks before discarding a new skill', async () => {
    renderRoute(<NewSkillPage />, '/skills/new', '/skills/new');
    fireEvent.change(await screen.findByLabelText('skills.content'), {
      target: { value: '---\nname: review\n---\n' },
    });
    await cancelAndAnswer('unsavedChanges.discard');
    expect(await screen.findByText('elsewhere')).toBeInTheDocument();
  });

  it('asks before discarding a variable, and not after saving it', async () => {
    const onClose = vi.fn();
    const props = {
      scopes: [{ scope: 'agent', scopeId: agent('a1').id, label: '' }],
      target: { name: null, at: 0, fixed: false },
      existingNames: () => [],
      onClose,
      onSaved: () => undefined,
    } as const;
    renderRoute(<VariableDialog {...props} />, '/', '/');
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('envVars.name'), {
      target: { value: 'API_KEY' },
    });
    await cancelAndAnswer('unsavedChanges.keepEditing');
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.change(within(dialog).getByLabelText('envVars.value'), {
      target: { value: 'k-1' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'actions.save' }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(callsTo('PUT', 'agents/variables/agent/a1/API_KEY')).toHaveLength(1);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});
