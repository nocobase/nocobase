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

import JsTemplateGitSourceFields, {
  createEmptyJsTemplateGitSourceDraft,
  parseGitRepositoryUrl,
  type JsTemplateGitSourceDraft,
  type JsTemplateGitSourceValue,
  validateGitBranch,
  validateGitSubdirectory,
} from '../components/JsTemplateGitSourceFields';

const variables = [{ name: 'SYNC_SECRET', type: 'secret' }];
const loadVariables = async () => variables;
const unsupportedGitScheme = ['s', 's', 'h'].join('');

function GitFieldsHarness(props: { onValidSourceChange: (source: JsTemplateGitSourceValue | undefined) => void }) {
  const [value, setValue] = useState<JsTemplateGitSourceDraft>(createEmptyJsTemplateGitSourceDraft);
  return (
    <JsTemplateGitSourceFields
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
  it('accepts HTTP and HTTPS URLs while deriving transport', () => {
    expect(parseGitRepositoryUrl('https://git.example.com/team/project.git')).toEqual({
      valid: true,
      url: 'https://git.example.com/team/project.git',
      transport: 'https',
    });
    expect(parseGitRepositoryUrl('http://git.example.com/team/project.git')).toEqual({
      valid: true,
      url: 'http://git.example.com/team/project.git',
      transport: 'http',
    });
  });

  it('rejects unsupported protocols, URL credentials, query/hash suffixes, backslashes, and local paths', () => {
    for (const value of [
      'https://user:secret@git.example.com/team/project.git',
      'http://user:secret@git.example.com/team/project.git',
      `${unsupportedGitScheme}://git@git.example.com/team/project.git`,
      ['git', '@git.example.com:team/project.git'].join(''),
      `${unsupportedGitScheme}://git:secret@git.example.com/team/project.git`,
      'https://git.example.com/team/project.git?ref=main',
      'https://git.example.com/team/project.git#main',
      `${unsupportedGitScheme}://git@git.example.com/team\\project.git`,
      'file:///tmp/project.git',
      '/tmp/project.git',
    ]) {
      expect(parseGitRepositoryUrl(value).valid).toBe(false);
    }
  });

  it('allows an unresolved branch and validates explicit branches and optional subdirectories', () => {
    expect(validateGitBranch('')).toEqual({ valid: true, branch: null });
    expect(validateGitBranch('feature/sync')).toEqual({ valid: true, branch: 'feature/sync' });
    expect(validateGitBranch(' feature/sync ')).toEqual({ valid: false, reason: 'invalid' });
    expect(validateGitBranch('unsafe..branch')).toEqual({ valid: false, reason: 'invalid' });
    expect(validateGitBranch('refs/heads/main')).toEqual({ valid: false, reason: 'invalid' });
    expect(validateGitBranch('main~1')).toEqual({ valid: false, reason: 'invalid' });
    expect(validateGitSubdirectory('packages/js-template')).toEqual({
      valid: true,
      subdirectory: 'packages/js-template',
    });
    expect(validateGitSubdirectory('')).toEqual({ valid: true, subdirectory: null });
    expect(validateGitSubdirectory('   ')).toEqual({ valid: false });
    expect(validateGitSubdirectory('a/../b')).toEqual({ valid: false });
    expect(validateGitSubdirectory('a/.GIT/b')).toEqual({ valid: false });
    expect(validateGitSubdirectory('a\\b')).toEqual({ valid: false });
  });
});

describe('JsTemplateGitSourceFields', () => {
  it('emits normalized public HTTPS config without credential material', async () => {
    const user = userEvent.setup();
    const onValidSourceChange = renderFields();
    await user.type(screen.getByRole('textbox', { name: 'Git repository URL' }), 'https://git.example.com/a/b.git');
    await user.type(screen.getByRole('textbox', { name: 'Branch' }), 'feature/sync');
    await user.type(screen.getByRole('textbox', { name: 'Subdirectory' }), 'packages/light');

    await waitFor(() =>
      expect(onValidSourceChange).toHaveBeenLastCalledWith({
        provider: 'git',
        authRef: null,
        config: {
          url: 'https://git.example.com/a/b.git',
          branch: 'feature/sync',
          subdirectory: 'packages/light',
          transport: 'https',
        },
      }),
    );
  });

  it('emits an unresolved draft when Branch is blank', async () => {
    const user = userEvent.setup();
    const onValidSourceChange = renderFields();
    await user.type(screen.getByRole('textbox', { name: 'Git repository URL' }), 'https://git.example.com/a/b.git');

    await waitFor(() =>
      expect(onValidSourceChange).toHaveBeenLastCalledWith({
        provider: 'git',
        authRef: null,
        config: {
          url: 'https://git.example.com/a/b.git',
          branch: null,
          subdirectory: null,
          transport: 'https',
        },
      }),
    );
    expect(screen.getByText('Leave blank to use the default branch')).toBeInTheDocument();
  });

  it('allows public HTTP and disables credentials', async () => {
    const user = userEvent.setup();
    const onValidSourceChange = renderFields();
    await user.type(screen.getByRole('textbox', { name: 'Git repository URL' }), 'http://git.example.com/team/app.git');
    await user.type(screen.getByRole('textbox', { name: 'Branch' }), 'main');
    await waitFor(() =>
      expect(onValidSourceChange).toHaveBeenLastCalledWith({
        provider: 'git',
        authRef: null,
        config: {
          url: 'http://git.example.com/team/app.git',
          branch: 'main',
          subdirectory: null,
          transport: 'http',
        },
      }),
    );

    expect(screen.getByRole('combobox', { name: 'Git credential' })).toBeDisabled();
    expect(screen.getByText('HTTP repositories must be public and cannot use credentials.')).toBeInTheDocument();
  });

  it('emits only a selected Secret reference for a private HTTPS repository', async () => {
    const user = userEvent.setup();
    const onValidSourceChange = renderFields();
    await user.type(
      screen.getByRole('textbox', { name: 'Git repository URL' }),
      'https://git.example.com/team/app.git',
    );
    await user.type(screen.getByRole('textbox', { name: 'Branch' }), 'main');
    await user.click(screen.getByRole('combobox', { name: 'Git credential' }));
    await user.click(await screen.findByText('SYNC_SECRET'));

    await waitFor(() =>
      expect(onValidSourceChange).toHaveBeenLastCalledWith({
        provider: 'git',
        config: {
          url: 'https://git.example.com/team/app.git',
          branch: 'main',
          subdirectory: null,
          transport: 'https',
        },
        authRef: '{{ $env.SYNC_SECRET }}',
      }),
    );
  });

  it('clears a selected Secret when the URL changes from HTTPS to HTTP', async () => {
    const user = userEvent.setup();
    const onValidSourceChange = renderFields();
    const urlInput = screen.getByRole('textbox', { name: 'Git repository URL' });
    await user.type(urlInput, 'https://git.example.com/team/app.git');
    await user.click(screen.getByRole('combobox', { name: 'Git credential' }));
    await user.click(await screen.findByText('SYNC_SECRET'));
    await user.clear(urlInput);
    await user.type(urlInput, 'http://git.example.com/team/app.git');

    await waitFor(() =>
      expect(onValidSourceChange).toHaveBeenLastCalledWith({
        provider: 'git',
        config: {
          url: 'http://git.example.com/team/app.git',
          branch: null,
          subdirectory: null,
          transport: 'http',
        },
        authRef: null,
      }),
    );
    expect(screen.getByRole('combobox', { name: 'Git credential' })).toBeDisabled();
  });

  it('shows URL, explicit branch, and subdirectory errors and gates the valid source', async () => {
    const user = userEvent.setup();
    const onValidSourceChange = renderFields();
    const urlInput = screen.getByRole('textbox', { name: 'Git repository URL' });
    await user.type(urlInput, 'file:///tmp/repo.git');
    await user.tab();
    expect(await screen.findByText('Git repository URL is invalid')).toBeInTheDocument();

    await user.clear(urlInput);
    await user.type(urlInput, 'https://git.example.com/team/repo.git');
    const branchInput = screen.getByRole('textbox', { name: 'Branch' });
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
