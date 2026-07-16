/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMockClient } from '@nocobase/client-v2';
import { FlowEngineProvider } from '@nocobase/flow-engine';
import React, { useState } from 'react';
import { vi } from 'vitest';

import LightExtensionGitSourceFields, {
  createEmptyLightExtensionGitSourceDraft,
  parseGitHubRepositoryLocator,
  type LightExtensionGitHubSourceValue,
  type LightExtensionGitSourceDraft,
  validateGitHubBranch,
  validateGitHubSubdirectory,
} from '../components/LightExtensionGitSourceFields';

const variables = [
  { name: 'SYNC_SECRET', type: 'secret' },
  { name: 'ORDINARY_VALUE', type: 'default' },
];
const loadVariables = async () => variables;

function GitFieldsHarness(props: {
  onValidSourceChange: (source: LightExtensionGitHubSourceValue | undefined) => void;
}) {
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

describe('parseGitHubRepositoryLocator', () => {
  it('accepts owner/repository and strict GitHub HTTPS locators', () => {
    expect(parseGitHubRepositoryLocator('nocobase/example')).toEqual({
      valid: true,
      owner: 'nocobase',
      repository: 'example',
    });
    expect(parseGitHubRepositoryLocator('https://github.com/nocobase/example.git')).toEqual({
      valid: true,
      owner: 'nocobase',
      repository: 'example',
    });
  });

  it('rejects non-GitHub, SSH, query-bearing, and nested locators', () => {
    expect(parseGitHubRepositoryLocator('https://example.com/nocobase/example').valid).toBe(false);
    expect(parseGitHubRepositoryLocator('git@github.com:nocobase/example.git').valid).toBe(false);
    expect(parseGitHubRepositoryLocator('https://github.com/nocobase/example?ref=main').valid).toBe(false);
    expect(parseGitHubRepositoryLocator('nocobase/group/example').valid).toBe(false);
  });

  it('enforces GitHub owner and repository shape and length limits', () => {
    expect(parseGitHubRepositoryLocator('bad--owner/example').valid).toBe(false);
    expect(parseGitHubRepositoryLocator(`${'o'.repeat(40)}/example`).valid).toBe(false);
    expect(parseGitHubRepositoryLocator(`owner/${'r'.repeat(101)}`).valid).toBe(false);
    expect(parseGitHubRepositoryLocator('-owner/example').valid).toBe(false);
  });
});

describe('GitHub branch and subdirectory validation', () => {
  it('accepts an empty or safe branch and rejects unsafe Git ref forms', () => {
    expect(validateGitHubBranch('')).toEqual({ valid: true, branch: '' });
    expect(validateGitHubBranch(' feature/sync ')).toEqual({ valid: true, branch: 'feature/sync' });

    for (const branch of [
      'unsafe..branch',
      '/main',
      'main/',
      'refs/heads/main',
      '.hidden',
      'feature//sync',
      'x.lock',
    ]) {
      expect(validateGitHubBranch(branch)).toEqual({ valid: false });
    }
  });

  it('accepts a safe relative subdirectory and rejects unsafe path forms', () => {
    expect(validateGitHubSubdirectory(' packages/light-extension ')).toEqual({
      valid: true,
      subdirectory: 'packages/light-extension',
    });
    expect(validateGitHubSubdirectory('')).toEqual({ valid: true, subdirectory: null });

    for (const subdirectory of ['/absolute', 'a\\b', 'a/../b', 'a//b', 'a/.git/b', 'a/', './a']) {
      expect(validateGitHubSubdirectory(subdirectory)).toEqual({ valid: false });
    }
  });
});

describe('LightExtensionGitSourceFields', () => {
  it('emits normalized non-sensitive GitHub config with optional branch, subdirectory, and authRef', async () => {
    const user = userEvent.setup();
    const onValidSourceChange = renderFields();

    await user.type(screen.getByRole('textbox', { name: 'GitHub repository' }), 'nocobase/example');
    await user.type(screen.getByRole('textbox', { name: 'Branch' }), ' feature/sync ');
    await user.type(screen.getByRole('textbox', { name: 'Subdirectory' }), ' packages/light-extension ');

    const tokenInput = screen.getByRole('combobox', { name: 'Token secret' });
    await user.click(tokenInput);
    await user.click(await screen.findByText('SYNC_SECRET'));

    await waitFor(() =>
      expect(onValidSourceChange).toHaveBeenLastCalledWith({
        provider: 'github',
        config: {
          owner: 'nocobase',
          repository: 'example',
          branch: 'feature/sync',
          subdirectory: 'packages/light-extension',
        },
        authRef: '{{ $env.SYNC_SECRET }}',
      }),
    );
    expect(JSON.stringify(onValidSourceChange.mock.calls.at(-1))).not.toMatch(/zipBase64|accessToken|tokenValue/);
  });

  it('allows an empty branch and authRef for a public repository', async () => {
    const user = userEvent.setup();
    const onValidSourceChange = renderFields();

    await user.type(screen.getByRole('textbox', { name: 'GitHub repository' }), 'nocobase/public-example');

    await waitFor(() =>
      expect(onValidSourceChange).toHaveBeenLastCalledWith({
        provider: 'github',
        config: {
          owner: 'nocobase',
          repository: 'public-example',
          branch: '',
          subdirectory: null,
        },
      }),
    );
  });

  it('keeps invalid locator feedback until the locator is corrected', async () => {
    const user = userEvent.setup();
    const onValidSourceChange = renderFields();
    const repositoryInput = screen.getByRole('textbox', { name: 'GitHub repository' });

    await user.type(repositoryInput, 'https://example.com/owner/repository');
    await user.tab();
    expect(await screen.findByText('GitHub repository locator is invalid')).toBeInTheDocument();
    expect(onValidSourceChange).toHaveBeenLastCalledWith(undefined);

    await user.clear(repositoryInput);
    await user.type(repositoryInput, 'owner/repository');
    await waitFor(() => expect(screen.queryByText('GitHub repository locator is invalid')).not.toBeInTheDocument());
  });

  it('shows branch and subdirectory errors and gates the valid source until corrected', async () => {
    const user = userEvent.setup();
    const onValidSourceChange = renderFields();
    await user.type(screen.getByRole('textbox', { name: 'GitHub repository' }), 'owner/repository');
    await waitFor(() =>
      expect(onValidSourceChange).toHaveBeenLastCalledWith(expect.objectContaining({ provider: 'github' })),
    );

    const branchInput = screen.getByRole('textbox', { name: 'Branch' });
    await user.type(branchInput, 'unsafe..branch');
    await user.tab();
    expect(await screen.findByText('GitHub branch is invalid')).toBeInTheDocument();
    expect(onValidSourceChange).toHaveBeenLastCalledWith(undefined);

    await user.clear(branchInput);
    await user.type(branchInput, 'main');
    const subdirectoryInput = screen.getByRole('textbox', { name: 'Subdirectory' });
    await user.type(subdirectoryInput, 'a/../b');
    await user.tab();
    expect(await screen.findByText('GitHub subdirectory is invalid')).toBeInTheDocument();
    expect(onValidSourceChange).toHaveBeenLastCalledWith(undefined);

    await user.clear(subdirectoryInput);
    await user.type(subdirectoryInput, 'packages/light');
    await waitFor(() =>
      expect(onValidSourceChange).toHaveBeenLastCalledWith({
        provider: 'github',
        config: {
          owner: 'owner',
          repository: 'repository',
          branch: 'main',
          subdirectory: 'packages/light',
        },
      }),
    );
  });
});
