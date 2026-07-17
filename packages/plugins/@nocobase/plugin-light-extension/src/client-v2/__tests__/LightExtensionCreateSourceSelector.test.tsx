/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMockClient } from '@nocobase/client-v2';
import { FlowEngineProvider } from '@nocobase/flow-engine';
import React from 'react';
import { vi } from 'vitest';

import LightExtensionCreateSourceSelector, {
  type LightExtensionCreateSource,
} from '../components/LightExtensionCreateSourceSelector';

const variables = [{ name: 'SYNC_SECRET', type: 'secret' }];
const loadVariables = async () => variables;

function renderSelector(props: {
  onChange: (source: LightExtensionCreateSource | undefined) => void;
  readZipFile?: (file: Blob, errorMessage: string) => Promise<string>;
}) {
  const app = createMockClient();
  return render(
    <FlowEngineProvider engine={app.flowEngine}>
      <LightExtensionCreateSourceSelector
        loadEnvironmentVariables={loadVariables}
        onChange={props.onChange}
        readZipFile={props.readZipFile}
      />
    </FlowEngineProvider>,
  );
}

describe('LightExtensionCreateSourceSelector', () => {
  it('defaults to template and emits mutually exclusive template, ZIP, and GitHub sources', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSelector({ onChange, readZipFile: async () => 'zip-source-base64' });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ mode: 'template' }));
    expect(screen.getByRole('radio', { name: 'Template' })).toBeChecked();

    await user.click(screen.getByText('ZIP file'));
    const fileInput = document.querySelector('input[type="file"]');
    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error('Expected the ZIP file input');
    }
    await user.upload(fileInput, new File(['zip'], 'source.zip', { type: 'application/zip' }));
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith({ mode: 'zip', zipBase64: 'zip-source-base64' }));

    await user.click(screen.getByText('GitHub source'));
    expect(screen.queryByText('source.zip')).not.toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'GitHub repository' }), 'nocobase/example');

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith({
        mode: 'github',
        provider: 'github',
        config: {
          owner: 'nocobase',
          repository: 'example',
          branch: '',
          subdirectory: null,
        },
      }),
    );
    const source = onChange.mock.calls.at(-1)?.[0];
    expect(source).not.toHaveProperty('zipBase64');
  });

  it('clears ZIP file and error state when leaving ZIP mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSelector({
      onChange,
      readZipFile: async () => {
        throw new Error('ZIP read failed');
      },
    });

    await user.click(screen.getByText('ZIP file'));
    const fileInput = document.querySelector('input[type="file"]');
    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error('Expected the ZIP file input');
    }
    await user.upload(fileInput, new File(['broken'], 'broken.zip', { type: 'application/zip' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('ZIP read failed');

    await user.click(screen.getByText('Template'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith({ mode: 'template' });

    await user.click(screen.getByText('ZIP file'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('broken.zip')).not.toBeInTheDocument();
  });

  it('clears GitHub draft and validation state after switching away', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSelector({ onChange });

    await user.click(screen.getByText('GitHub source'));
    const repositoryInput = screen.getByRole('textbox', { name: 'GitHub repository' });
    await user.type(repositoryInput, 'https://example.com/owner/repository');
    await user.tab();
    expect(await screen.findByText('GitHub repository locator is invalid')).toBeInTheDocument();

    await user.click(screen.getByText('Template'));
    await user.click(screen.getByText('GitHub source'));
    expect(screen.getByRole('textbox', { name: 'GitHub repository' })).toHaveValue('');
    expect(screen.queryByText('GitHub repository locator is invalid')).not.toBeInTheDocument();
  });

  it('ignores a ZIP read that finishes after leaving ZIP mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    let resolveRead: ((value: string) => void) | undefined;
    renderSelector({
      onChange,
      readZipFile: () =>
        new Promise((resolve) => {
          resolveRead = resolve;
        }),
    });

    await user.click(screen.getByText('ZIP file'));
    const fileInput = document.querySelector('input[type="file"]');
    if (!(fileInput instanceof HTMLInputElement)) {
      throw new Error('Expected the ZIP file input');
    }
    fireEvent.change(fileInput, {
      target: { files: [new File(['zip'], 'slow.zip', { type: 'application/zip' })] },
    });
    await user.click(screen.getByText('Template'));
    resolveRead?.('late-zip-base64');

    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith({ mode: 'template' }));
    expect(onChange).not.toHaveBeenCalledWith({ mode: 'zip', zipBase64: 'late-zip-base64' });
  });
});
