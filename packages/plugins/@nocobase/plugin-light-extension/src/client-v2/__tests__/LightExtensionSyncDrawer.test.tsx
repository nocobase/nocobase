/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  LightExtensionRepoRecord,
  LightExtensionSyncOperationResult,
  LightExtensionSyncPlan,
  LightExtensionSyncPlanResult,
  LightExtensionSyncSourceSummary,
} from '../../shared/types';
import LightExtensionSyncDrawer from '../components/LightExtensionSyncDrawer';
import { LightExtensionSyncHookError } from '../hooks/useLightExtensionSync';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  plan: vi.fn(),
  pull: vi.fn(),
  push: vi.fn(),
  disconnect: vi.fn(),
  testConnection: vi.fn(),
  configure: vi.fn(),
  createFromGit: vi.fn(),
}));

vi.mock('../hooks/useLightExtensionSync', async (importOriginal) => {
  const original = await importOriginal<typeof import('../hooks/useLightExtensionSync')>();
  return {
    ...original,
    useLightExtensionSync: () => mocks,
  };
});

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

const repo: LightExtensionRepoRecord = {
  id: 'repo-1',
  name: 'sales',
  normalizedName: 'sales',
  lifecycleStatus: 'enabled',
  healthStatus: 'ready',
  headCommitId: 'local-head-123456',
};

const source: LightExtensionSyncSourceSummary = {
  provider: 'github',
  config: {
    owner: 'nocobase',
    repository: 'extensions',
    branch: 'main',
    subdirectory: 'light/sales',
  },
  status: 'active',
  remoteTargetVersion: 3,
  revision: 'remote-revision-123456',
  credentialConfigured: true,
  authRefDisplay: '********',
  lastSyncedAt: '2026-07-16T00:00:00.000Z',
};

function createPlan(
  state: LightExtensionSyncPlan['state'],
  overrides: Partial<LightExtensionSyncPlan> = {},
): LightExtensionSyncPlan {
  return {
    state,
    action: 'noop',
    reasonCode: null,
    canPull: false,
    canPush: false,
    fingerprint: `fingerprint-${state}`,
    remoteTargetVersion: state === 'unconfigured' ? null : 3,
    local: { headCommitId: 'local-head-123456', contentHash: 'sha256:local' },
    remote: { revision: 'remote-revision-123456', contentHash: 'sha256:remote', contentHashKnown: true },
    baseline: {
      remoteTargetVersion: 3,
      lastLocalCommitId: 'local-base',
      lastRemoteRevision: 'remote-base',
      lastSyncedContentHash: 'sha256:base',
    },
    ...overrides,
  };
}

function setPlanResult(plan: LightExtensionSyncPlan, currentSource: LightExtensionSyncSourceSummary | null = source) {
  const result: LightExtensionSyncPlanResult = { repoId: repo.id, source: currentSource, plan };
  mocks.get.mockResolvedValue({ repoId: repo.id, source: currentSource });
  mocks.plan.mockResolvedValue(result);
  return result;
}

function createDeferred<T>() {
  let resolveDeferred: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolve) => {
    resolveDeferred = resolve;
  });
  return { promise, resolve: resolveDeferred };
}

function renderDrawer(props: Partial<React.ComponentProps<typeof LightExtensionSyncDrawer>> = {}) {
  const callbacks = {
    onClose: vi.fn(),
    onRepoUpdated: vi.fn(),
    onSyncSourceChanged: vi.fn(),
  };
  const view = render(
    <LightExtensionSyncDrawer
      onClose={callbacks.onClose}
      onRepoUpdated={callbacks.onRepoUpdated}
      onSyncSourceChanged={callbacks.onSyncSourceChanged}
      open
      repo={repo}
      {...props}
    />,
  );
  return { ...view, ...callbacks };
}

async function waitForPlan() {
  await waitFor(() => expect(mocks.plan).toHaveBeenCalledWith({ repoId: repo.id }));
}

describe('LightExtensionSyncDrawer', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) {
      mock.mockReset();
    }
    mocks.testConnection.mockResolvedValue({
      ok: true,
      provider: 'github',
      config: source.config,
      revision: source.revision,
      credentialConfigured: true,
      authRefDisplay: source.authRefDisplay,
    });
    mocks.disconnect.mockResolvedValue({ repoId: repo.id, source: null });
  });

  it('shows loading and then an accessible unconfigured state with a Configure entry', async () => {
    let resolveGet: ((value: { repoId: string; source: null }) => void) | undefined;
    mocks.get.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        }),
    );
    mocks.plan.mockResolvedValue({ repoId: repo.id, source: null, plan: createPlan('unconfigured') });
    const onRequestConfigure = vi.fn();
    const user = userEvent.setup();

    renderDrawer({ onRequestConfigure });

    expect(screen.getByRole('dialog', { name: 'Sync code' })).toBeInTheDocument();
    expect(screen.getByText('Loading sync status')).toBeInTheDocument();
    await act(async () => {
      resolveGet?.({ repoId: repo.id, source: null });
    });
    await user.click(await screen.findByRole('button', { name: 'Configure' }));
    expect(onRequestConfigure).toHaveBeenCalledOnce();
    expect(screen.getByRole('alert')).toHaveTextContent('Sync source is not configured');
  });

  it('treats a null Plan source as authoritative after Get returned a concurrently disconnected source', async () => {
    mocks.get.mockResolvedValue({ repoId: repo.id, source });
    mocks.plan.mockResolvedValue({ repoId: repo.id, source: null, plan: createPlan('unconfigured') });

    renderDrawer({ configurationPanel: <div>Configure GitHub source</div> });

    expect(await screen.findByText('Configure GitHub source')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Sync source is not configured');
    expect(screen.queryByRole('cell', { name: 'nocobase/extensions' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pull from Git' })).not.toBeInTheDocument();
  });

  it.each([
    ['in-sync', 'In sync'],
    ['local-ahead', 'Local changes'],
    ['remote-ahead', 'Remote changes'],
    ['diverged', 'Diverged'],
  ] as const)('renders the %s server plan without reclassifying it', async (state, label) => {
    setPlanResult(createPlan(state));
    renderDrawer();

    expect(await screen.findByText(label)).toBeInTheDocument();
    expect(screen.getByText('local-he')).toBeInTheDocument();
    expect(screen.getByText('remote-r')).toBeInTheDocument();
    expect(screen.queryByText(/vscRepoId/iu)).not.toBeInTheDocument();
  });

  it('renders initial ambiguity guidance and keeps both write actions disabled', async () => {
    setPlanResult(
      createPlan('diverged', {
        action: 'conflict',
        reasonCode: 'initial-ambiguous',
        canPull: false,
        canPush: false,
      }),
    );
    renderDrawer();

    expect(await screen.findByText('Initial sync needs a clear source')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pull from Git' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Push to Git' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /overwrite/iu })).not.toBeInTheDocument();
  });

  it.each([
    ['LIGHT_EXTENSION_SYNC_CREDENTIAL_UNAVAILABLE', 'The configured credential is unavailable'],
    ['LIGHT_EXTENSION_SYNC_AUTH_FAILED', 'GitHub authentication failed'],
    ['LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE', 'The sync provider is unavailable'],
    [
      'LIGHT_EXTENSION_SYNC_RATE_LIMITED',
      'GitHub API rate limit reached. Try again later or configure a GitHub token.',
    ],
    ['LIGHT_EXTENSION_PERMISSION_DENIED', 'You do not have permission to perform this sync operation'],
  ])('maps safe error plan code %s to a user-facing message', async (reasonCode, label) => {
    setPlanResult(createPlan('error', { reasonCode }));
    renderDrawer();

    expect(await screen.findByText(label)).toBeInTheDocument();
  });

  it('uses only server canPull and sends the full expected revision contract', async () => {
    const pullPlan = createPlan('remote-ahead', { action: 'pull', canPull: true });
    const completedPlan = createPlan('in-sync', {
      local: { headCommitId: 'updated-local-head', contentHash: 'sha256:updated' },
      remote: { revision: 'updated-remote-revision', contentHash: 'sha256:updated', contentHashKnown: true },
    });
    setPlanResult(pullPlan);
    const result: LightExtensionSyncOperationResult = {
      repo: { ...repo, headCommitId: 'updated-local-head' },
      source: { ...source, revision: 'updated-remote-revision' },
      plan: completedPlan,
    };
    mocks.pull.mockResolvedValue(result);
    mocks.plan.mockResolvedValueOnce({ repoId: repo.id, source, plan: pullPlan }).mockResolvedValueOnce({
      repoId: repo.id,
      source: result.source,
      plan: completedPlan,
    });
    const user = userEvent.setup();
    const { onRepoUpdated, onSyncSourceChanged } = renderDrawer();

    const pullButton = await screen.findByRole('button', { name: 'Pull from Git' });
    pullButton.focus();
    await user.keyboard('{Enter}');

    await waitFor(() =>
      expect(mocks.pull).toHaveBeenCalledWith({
        repoId: repo.id,
        expectedHeadCommitId: pullPlan.local.headCommitId,
        expectedRemoteRevision: pullPlan.remote.revision,
        expectedRemoteTargetVersion: 3,
        planFingerprint: pullPlan.fingerprint,
      }),
    );
    expect(onRepoUpdated).toHaveBeenCalledWith(result.repo);
    expect(onSyncSourceChanged).toHaveBeenCalledWith(result.source);
    await waitFor(() => expect(mocks.plan).toHaveBeenCalledTimes(2));
  });

  it('does not Push before confirmation and uses the current plan after confirmation', async () => {
    const pushPlan = createPlan('local-ahead', { action: 'push', canPush: true });
    setPlanResult(pushPlan);
    const result: LightExtensionSyncOperationResult = { repo, source, plan: createPlan('in-sync') };
    mocks.push.mockResolvedValue(result);
    const user = userEvent.setup();
    renderDrawer();

    await user.click(await screen.findByRole('button', { name: 'Push to Git' }));
    expect(mocks.push).not.toHaveBeenCalled();

    const confirmation = await screen.findByRole('dialog', { name: 'Push changes to GitHub?' });
    await user.click(within(confirmation).getByRole('button', { name: 'Push to Git' }));

    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith({
        repoId: repo.id,
        expectedHeadCommitId: pushPlan.local.headCommitId,
        expectedRemoteRevision: pushPlan.remote.revision,
        expectedRemoteTargetVersion: 3,
        planFingerprint: pushPlan.fingerprint,
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Push changes to GitHub?' })).not.toBeInTheDocument(),
    );
  });

  it('ignores a late repo-A Pull result after switching to repo B and blocks a second write until it settles', async () => {
    const repoB: LightExtensionRepoRecord = {
      ...repo,
      id: 'repo-2',
      name: 'support',
      normalizedName: 'support',
      headCommitId: 'repo-b-local',
    };
    const sourceB: LightExtensionSyncSourceSummary = {
      ...source,
      config: { ...source.config, owner: 'repo-b-owner', repository: 'repo-b-extension' },
    };
    const repoAPlan = createPlan('remote-ahead', { action: 'pull', canPull: true });
    const repoBPlan = createPlan('remote-ahead', {
      action: 'pull',
      canPull: true,
      fingerprint: 'repo-b-plan',
      local: { headCommitId: repoB.headCommitId, contentHash: 'sha256:repo-b-local' },
    });
    setPlanResult(repoAPlan);
    const latePull = createDeferred<LightExtensionSyncOperationResult>();
    const repoBResult: LightExtensionSyncOperationResult = {
      repo: { ...repoB, headCommitId: 'repo-b-updated' },
      source: sourceB,
      plan: createPlan('in-sync', { fingerprint: 'repo-b-complete' }),
    };
    mocks.pull.mockImplementationOnce(() => latePull.promise).mockResolvedValueOnce(repoBResult);
    const callbacks = {
      onClose: vi.fn(),
      onRepoUpdated: vi.fn(),
      onSyncSourceChanged: vi.fn(),
    };
    const user = userEvent.setup();
    const { rerender } = render(<LightExtensionSyncDrawer open repo={repo} {...callbacks} />);

    await user.click(await screen.findByRole('button', { name: 'Pull from Git' }));
    expect(mocks.pull).toHaveBeenCalledTimes(1);

    mocks.get.mockResolvedValue({ repoId: repoB.id, source: sourceB });
    mocks.plan.mockResolvedValue({ repoId: repoB.id, source: sourceB, plan: repoBPlan });
    rerender(<LightExtensionSyncDrawer open repo={repoB} {...callbacks} />);

    expect(await screen.findByRole('cell', { name: 'repo-b-owner/repo-b-extension' })).toBeInTheDocument();
    const repoBPullButton = screen.getByRole('button', { name: 'Pull from Git' });
    expect(repoBPullButton).toBeDisabled();
    await user.click(repoBPullButton);
    expect(mocks.pull).toHaveBeenCalledTimes(1);

    await act(async () => {
      latePull.resolve({
        repo: { ...repo, headCommitId: 'late-repo-a-head' },
        source: { ...source, revision: 'late-repo-a-revision' },
        plan: createPlan('in-sync', { fingerprint: 'late-repo-a-plan' }),
      });
    });

    await waitFor(() => expect(repoBPullButton).toBeEnabled());
    expect(callbacks.onRepoUpdated).not.toHaveBeenCalled();
    expect(callbacks.onSyncSourceChanged).not.toHaveBeenCalled();
    expect(screen.getByRole('cell', { name: 'repo-b-owner/repo-b-extension' })).toBeInTheDocument();

    await user.click(repoBPullButton);
    await waitFor(() => expect(mocks.pull).toHaveBeenCalledTimes(2));
    expect(mocks.pull.mock.calls[1][0]).toMatchObject({ repoId: repoB.id, planFingerprint: repoBPlan.fingerprint });
  });

  it('invalidates a Push confirmation when the current plan fingerprint changes and rejects its stale submit', async () => {
    const firstPlan = createPlan('local-ahead', { action: 'push', canPush: true, fingerprint: 'push-plan-1' });
    const refreshedPlan = createPlan('local-ahead', { action: 'push', canPush: true, fingerprint: 'push-plan-2' });
    mocks.get.mockResolvedValue({ repoId: repo.id, source });
    mocks.plan
      .mockResolvedValueOnce({ repoId: repo.id, source, plan: firstPlan })
      .mockResolvedValue({ repoId: repo.id, source, plan: refreshedPlan });
    const user = userEvent.setup();
    renderDrawer();

    await user.click(await screen.findByRole('button', { name: 'Push to Git' }));
    const confirmation = await screen.findByRole('dialog', { name: 'Push changes to GitHub?' });
    const staleSubmit = within(confirmation).getByRole('button', { name: 'Push to Git' });

    await user.click(screen.getByRole('button', { name: 'Test connection' }));
    await waitFor(() => expect(mocks.plan).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Push changes to GitHub?' })).not.toBeInTheDocument(),
    );
    fireEvent.click(staleSubmit);

    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('tests and disconnects a saved source without exposing credentials', async () => {
    const testToken = 'test-token-must-never-render';
    setPlanResult(createPlan('in-sync'));
    const user = userEvent.setup();
    const { onSyncSourceChanged } = renderDrawer();

    await user.click(await screen.findByRole('button', { name: 'Test connection' }));
    await waitFor(() => expect(mocks.testConnection).toHaveBeenCalledWith({ repoId: repo.id }));

    await user.click(screen.getByRole('button', { name: 'Disconnect' }));
    const disconnectButtons = await screen.findAllByRole('button', { name: 'Disconnect' });
    const confirmDisconnectButton = disconnectButtons.at(-1);
    expect(confirmDisconnectButton).toBeDefined();
    if (!confirmDisconnectButton) {
      return;
    }
    await user.click(confirmDisconnectButton);
    await waitFor(() => expect(mocks.disconnect).toHaveBeenCalledWith({ repoId: repo.id }));
    expect(onSyncSourceChanged).toHaveBeenCalledWith(null);
    await waitFor(() => expect(mocks.plan).toHaveBeenCalledTimes(3));
    expect(document.body).not.toHaveTextContent(testToken);
    expect(document.body).not.toHaveTextContent('vscRepoId');
  });

  it('never renders a raw error response and allows closing with the keyboard', async () => {
    const testToken = 'test-token-must-never-render';
    mocks.get.mockRejectedValue(
      new LightExtensionSyncHookError({
        operation: 'get',
        message: `provider response contained ${testToken}`,
      }),
    );
    const user = userEvent.setup();
    const { onClose } = renderDrawer();

    expect(await screen.findByText('Unable to complete sync operation')).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(testToken);
    const closeButton = screen.getByRole('button', { name: 'Close' });
    closeButton.focus();
    await user.keyboard('{Enter}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('reloads the source and plan every time the Drawer is reopened', async () => {
    setPlanResult(createPlan('in-sync'));
    const callbacks = {
      onClose: vi.fn(),
      onRepoUpdated: vi.fn(),
      onSyncSourceChanged: vi.fn(),
    };
    const { rerender } = render(<LightExtensionSyncDrawer open repo={repo} {...callbacks} />);
    await waitForPlan();

    rerender(<LightExtensionSyncDrawer open={false} repo={repo} {...callbacks} />);
    rerender(<LightExtensionSyncDrawer open repo={repo} {...callbacks} />);

    await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(mocks.plan).toHaveBeenCalledTimes(2));
  });
});
