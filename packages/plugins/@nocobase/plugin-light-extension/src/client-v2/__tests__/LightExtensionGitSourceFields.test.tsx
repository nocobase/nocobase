/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
import { FlowEngineProvider } from '@nocobase/flow-engine';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { vi } from 'vitest';

import LightExtensionGitSourceFields, {
  createEmptyLightExtensionGitSourceDraft,
  parseGitRepositoryUrl,
  type LightExtensionGitSourceDraft,
  type LightExtensionGitSourceValue,
  validateGitBranch,
  validateGitSubdirectory,
} from '../components/LightExtensionGitSourceFields';

const variables = [{ name: 'SYNC_SECRET', type: 'secret' }];
const loadVariables = async () => variables;

function GitFieldsHarness(props: { onValidSourceChange: (source: LightExtensionGitSourceValue | undefined) => void }) {
  const [value, setValue] = useState<LightExtensionGitSourceDraft>(createEmptyLightExtensionGitSourceDraft);
  return (
    <LightExtensionGitSourceFields
      loadEnvironmentVariables={loadVariables}
      onChange={setValue}
      onValidSourceChange={props.onValidSourceChange}
      value={value}
    />
  );
}

function renderFields(onValidSourceChange = vi.fn()) {
  const app = createMockClient();
  render(
    <FlowEngineProvider engine={app.flowEngine}>
      <GitFieldsHarness onValidSourceChange={onValidSourceChange} />
    </FlowEngineProvider>,
  );
  return onValidSourceChange;
}

describe('generic Git source validation', () => {
  it('accepts HTTPS, standard SSH, and scp-like SSH URLs while deriving transport', () => {
    expect(parseGitRepositoryUrl('https://git.example.com/team/project.git')).toEqual({
      valid: true,
      url: 'https://git.example.com/team/project.git',
      transport: 'https',
    });
    expect(parseGitRepositoryUrl('ssh://git@git.example.com/team/project.git')).toEqual({
      valid: true,
      url: 'ssh://git@git.example.com/team/project.git',
      transport: 'ssh',
    });
    expect(parseGitRepositoryUrl('git@git.example.com:team/project.git')).toEqual({
      valid: true,
      url: 'ssh://git@git.example.com/team/project.git',
      transport: 'ssh',
    });
  });

  it('rejects unsupported protocols, credentials in HTTPS URLs, query strings, and local paths', () => {
    for (const value of [
      'http://git.example.com/team/project.git',
      'https://user:secret@git.example.com/team/project.git',
      'https://git.example.com/team/project.git?ref=main',
      'file:///tmp/project.git',
      '/tmp/project.git',
    ]) {
      expect(parseGitRepositoryUrl(value).valid).toBe(false);
    }
  });

  it('requires a valid branch and validates the optional subdirectory with server-compatible rules', () => {
    expect(validateGitBranch('')).toEqual({ valid: false, reason: 'required' });
    expect(validateGitBranch('feature/sync')).toEqual({ valid: true, branch: 'feature/sync' });
    expect(validateGitBranch(' feature/sync ')).toEqual({ valid: false, reason: 'invalid' });
    expect(validateGitBranch('unsafe..branch')).toEqual({ valid: false, reason: 'invalid' });
    expect(validateGitSubdirectory('packages/light-extension')).toEqual({
      valid: true,
      subdirectory: 'packages/light-extension',
    });
    expect(validateGitSubdirectory('')).toEqual({ valid: true, subdirectory: null });
    expect(validateGitSubdirectory('a/../b')).toEqual({ valid: false });
  });
});

describe('LightExtensionGitSourceFields', () => {
  it('emits normalized public HTTPS config without credential material', async () => {
    const user = userEvent.setup();
    const onValidSourceChange = renderFields();
    await user.type(screen.getByRole('textbox', { name: 'Git repository URL' }), 'https://git.example.com/a/b.git');
    await user.type(screen.getByRole('textbox', { name: 'Branch' }), 'feature/sync');
    await user.type(screen.getByRole('textbox', { name: 'Subdirectory' }), 'packages/light');

    await waitFor(() =>
      expect(onValidSourceChange).toHaveBeenLastCalledWith({
        provider: 'git',
        config: {
          url: 'https://git.example.com/a/b.git',
          branch: 'feature/sync',
          subdirectory: 'packages/light',
          transport: 'https',
        },
      }),
    );
  });

  it('allows SSH without a credential and emits a Secret reference when selected', async () => {
    const user = userEvent.setup();
    const onValidSourceChange = renderFields();
    await user.type(screen.getByRole('textbox', { name: 'Git repository URL' }), 'git@git.example.com:team/app.git');
    await user.type(screen.getByRole('textbox', { name: 'Branch' }), 'main');
    await waitFor(() =>
      expect(onValidSourceChange).toHaveBeenLastCalledWith({
        provider: 'git',
        config: {
          url: 'ssh://git@git.example.com/team/app.git',
          branch: 'main',
          subdirectory: null,
          transport: 'ssh',
        },
      }),
    );

    await user.click(screen.getByRole('combobox', { name: 'Git credential' }));
    await user.click(await screen.findByText('SYNC_SECRET'));
    await waitFor(() =>
      expect(onValidSourceChange).toHaveBeenLastCalledWith({
        provider: 'git',
        config: {
          url: 'ssh://git@git.example.com/team/app.git',
          branch: 'main',
          subdirectory: null,
          transport: 'ssh',
        },
        authRef: '{{ $env.SYNC_SECRET }}',
      }),
    );
    expect(JSON.stringify(onValidSourceChange.mock.calls.at(-1))).not.toMatch(/privateKey|knownHosts|passphrase/);
  });

  it('emits a literal token for a private HTTPS repository', async () => {
    const user = userEvent.setup();
    const onValidSourceChange = renderFields();
    await user.type(
      screen.getByRole('textbox', { name: 'Git repository URL' }),
      'https://git.example.com/team/app.git',
    );
    await user.type(screen.getByRole('textbox', { name: 'Branch' }), 'main');
    await user.type(screen.getByRole('combobox', { name: 'Git credential' }), 'github_pat_direct_123');

    await waitFor(() =>
      expect(onValidSourceChange).toHaveBeenLastCalledWith({
        provider: 'git',
        config: {
          url: 'https://git.example.com/team/app.git',
          branch: 'main',
          subdirectory: null,
          transport: 'https',
        },
        authRef: 'github_pat_direct_123',
      }),
    );
  });

  it('shows URL, branch, and subdirectory errors and gates the valid source', async () => {
    const user = userEvent.setup();
    const onValidSourceChange = renderFields();
    const urlInput = screen.getByRole('textbox', { name: 'Git repository URL' });
    await user.type(urlInput, 'file:///tmp/repo.git');
    await user.tab();
    expect(await screen.findByText('Git repository URL is invalid')).toBeInTheDocument();

    await user.clear(urlInput);
    await user.type(urlInput, 'https://git.example.com/team/repo.git');
    const branchInput = screen.getByRole('textbox', { name: 'Branch' });
    await user.click(branchInput);
    await user.tab();
    expect(await screen.findByText('Git branch is required')).toBeInTheDocument();

    await user.type(branchInput, 'unsafe..branch');
    await user.tab();
    expect(await screen.findByText('Git branch is invalid')).toBeInTheDocument();

    await user.clear(branchInput);
    const subdirectoryInput = screen.getByRole('textbox', { name: 'Subdirectory' });
    await user.type(subdirectoryInput, 'a/../b');
    await user.tab();
    expect(await screen.findByText('Git subdirectory is invalid')).toBeInTheDocument();
    expect(onValidSourceChange).toHaveBeenLastCalledWith(undefined);
  });
});
