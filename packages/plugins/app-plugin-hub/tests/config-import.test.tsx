import { useState } from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import enUS from '../client/locales/en-US.js';
import type { AppDetail } from '../client/pages/hub/types.js';
import type { ConfigMergeEditorProps } from '../client/components/config-editor.js';
import {
  Configuration,
  DeploymentDialog,
} from '../client/pages/hub/configuration.js';

vi.mock('../client/components/config-editor.js', () => ({
  ConfigMergeEditor: ({ current, value, onChange }: ConfigMergeEditorProps) => (
    <>
      <pre data-testid='template'>{current}</pre>
      <textarea
        aria-label='Draft'
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </>
  ),
  ConfigEditor: ({ value, onChange }: ConfigMergeEditorProps) => (
    <textarea
      aria-label='Draft'
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
  ConfigUnifiedDiff: () => null,
}));

const runtime = await createTestI18nRuntime({
  namespaces: { '@nocobase/app-plugin-hub': enUS },
});
function I18n({ children }: { readonly children: ReactNode }) {
  return (
    <TestI18nProvider runtime={runtime} namespace='@nocobase/app-plugin-hub'>
      {children}
    </TestI18nProvider>
  );
}
const template = 'database:\n  driver: sqlite\n';
const imported = 'database:\n  driver: postgres\n';
const app: AppDetail = {
  enabled: true,
  hasReleases: true,
  hasPendingDeployment: false,
  currentVersion: null,
  app: { id: 'test', name: 'Test', updatedAt: '', currentDeploymentId: null },
  deployments: [],
  runtime: { hostAvailable: true, state: 'stopped' },
  deployment: {
    desiredReleaseId: null,
    observedReleaseId: null,
    observedState: 'stopped',
    activation: 'eager',
    basePath: '/test',
    updatedAt: '',
  },
  releases: [
    {
      id: 'release-1',
      version: '1.0.0',
      size: 1,
      checksum: 'test-checksum',
      hasConfigTemplate: true,
      createdAt: '2026-09-18T00:00:00Z',
    },
  ],
  hostUrl: null,
};
const loadTemplate = async (): Promise<string> => template;
const noop = (): void => undefined;

describe('configuration server refresh', () => {
  it('preserves dirty drafts and requires confirmation before loading new server content', async () => {
    const props = {
      mode: 'file' as const,
      busy: false,
      canUpdate: true,
      onSave: vi.fn(),
    };
    const { rerender } = render(
      <Configuration {...props} content={template} />,
      { wrapper: I18n },
    );
    const editor = await screen.findByLabelText('Draft');
    fireEvent.change(editor, {
      target: { value: 'database:\n  driver: mysql\n' },
    });
    rerender(<Configuration {...props} content={imported} />);
    expect(screen.getByLabelText('Draft')).toBe(editor);
    expect(editor).toHaveValue('database:\n  driver: mysql\n');
    expect(
      screen.getByRole('button', { name: 'Save and publish' }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole('button', { name: 'Reload server configuration' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(editor).toHaveValue('database:\n  driver: mysql\n');
    fireEvent.click(
      screen.getByRole('button', { name: 'Reload server configuration' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Discard draft and reload' }),
    );
    expect(editor).toHaveValue(imported);
    expect(
      screen.queryByText(/Server configuration has changed/),
    ).not.toBeInTheDocument();
  });

  it('synchronizes pristine content without remounting and accepts a saved draft', async () => {
    const props = {
      mode: 'file' as const,
      busy: false,
      canUpdate: true,
      onSave: vi.fn(),
    };
    const { rerender } = render(
      <Configuration {...props} content={template} />,
      { wrapper: I18n },
    );
    const editor = await screen.findByLabelText('Draft');
    rerender(<Configuration {...props} content={imported} />);
    expect(screen.getByLabelText('Draft')).toBe(editor);
    expect(editor).toHaveValue(imported);
    fireEvent.change(editor, { target: { value: template } });
    rerender(<Configuration {...props} content={template} />);
    expect(editor).toHaveValue(template);
    expect(
      screen.getByRole('button', { name: 'Save and publish' }),
    ).toBeDisabled();
    expect(
      screen.queryByText(/Server configuration has changed/),
    ).not.toBeInTheDocument();
  });
});

async function setup() {
  const complete = vi.fn();
  function Harness() {
    const [content, setContent] = useState('');
    return (
      <DeploymentDialog
        app={app}
        releaseId='release-1'
        mode='file'
        content={content}
        baselineContent=''
        baselineMode='file'
        rollback={false}
        busy={false}
        onRelease={noop}
        loadTemplate={loadTemplate}
        onMode={noop}
        onContent={setContent}
        onClose={noop}
        onComplete={complete}
      />
    );
  }
  const result = render(<Harness />, { wrapper: I18n });
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await waitFor(() =>
    expect(screen.getByLabelText('Draft')).toHaveValue(template),
  );
  return { ...result, complete };
}

function choose(content = imported, name = 'config.yml', bytes?: Uint8Array) {
  const data = bytes ?? new TextEncoder().encode(content);
  const file = new File([content], name);
  Object.defineProperty(file, 'arrayBuffer', {
    value: async () => data.buffer,
  });
  fireEvent.change(screen.getByLabelText('Import file'), {
    target: { files: [file] },
  });
  return file;
}

describe('deployment configuration import', () => {
  it('imports on the configuration page without saving until review is confirmed', async () => {
    const save = vi.fn();
    render(
      <Configuration
        mode='file'
        content={template}
        busy={false}
        canUpdate
        onSave={save}
      />,
      { wrapper: I18n },
    );
    await screen.findByLabelText('Draft');
    choose();
    await waitFor(() =>
      expect(screen.getByLabelText('Draft')).toHaveValue(imported),
    );
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Undo import' }));
    expect(screen.getByLabelText('Draft')).toHaveValue(template);
    choose();
    await waitFor(() =>
      expect(screen.getByLabelText('Draft')).toHaveValue(imported),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save and publish' }));
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Save and publish',
      }),
    );
    expect(save).toHaveBeenCalledExactlyOnceWith(imported);
  });

  it('does not offer import to a read-only configuration viewer', () => {
    render(
      <Configuration
        mode='file'
        content={template}
        busy={false}
        canUpdate={false}
        onSave={vi.fn()}
      />,
      { wrapper: I18n },
    );
    expect(
      screen.queryByRole('button', { name: 'Import file' }),
    ).not.toBeInTheDocument();
  });

  it('changes only the draft, supports undo, and requires explicit deployment', async () => {
    const { complete } = await setup();
    choose();
    await waitFor(() =>
      expect(screen.getByLabelText('Draft')).toHaveValue(imported),
    );
    expect(screen.getByTestId('template').textContent).toBe(template);
    expect(
      screen.getByText('Imported from config.yml · Editable'),
    ).toBeInTheDocument();
    expect(complete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Undo import' }));
    expect(screen.getByLabelText('Draft')).toHaveValue(template);
    choose(imported, 'config.yaml');
    await waitFor(() =>
      expect(screen.getByLabelText('Draft')).toHaveValue(imported),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(complete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Deploy release' }));
    expect(complete).toHaveBeenCalledOnce();
  });

  it('confirms edited draft replacement, supports cancellation and restores edits on undo', async () => {
    await setup();
    fireEvent.change(screen.getByLabelText('Draft'), {
      target: { value: 'custom: true\n' },
    });
    choose();
    await screen.findByRole('button', { name: 'Replace draft' });
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    expect(screen.getByLabelText('Draft')).toHaveValue('custom: true\n');
    // The footer also has a Cancel button; choose the inline confirmation action.
    const confirmation = screen
      .getByText('Importing replaces your edited draft. Continue?')
      .closest('[role="alert"]') as HTMLElement;
    fireEvent.click(
      within(confirmation).getByRole('button', { name: 'Cancel' }),
    );
    expect(screen.getByLabelText('Draft')).toHaveValue('custom: true\n');
    choose();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Replace draft' }),
    );
    expect(screen.getByLabelText('Draft')).toHaveValue(imported);
    fireEvent.click(screen.getByRole('button', { name: 'Undo import' }));
    expect(screen.getByLabelText('Draft')).toHaveValue('custom: true\n');
  });

  it.each([
    ['config.txt', imported],
    ['config.yml', ''],
    ['config.yml', '   '],
    ['config.yml', '- item'],
    ['config.yml', 'scalar'],
    ['config.yml', 'bad: ['],
    ['config.yml', 'a'.repeat(1024 * 1024 + 1)],
  ])(
    'rejects invalid file %s without changing the draft',
    async (name, value) => {
      await setup();
      choose(value, name);
      await screen.findByText(/Choose a non-empty UTF-8/);
      expect(screen.getByLabelText('Draft')).toHaveValue(template);
      expect(
        screen.queryByRole('button', { name: 'Undo import' }),
      ).not.toBeInTheDocument();
    },
  );

  it('rejects invalid UTF-8', async () => {
    await setup();
    choose('placeholder', 'config.yml', new Uint8Array([0xff]));
    await screen.findByText(/Choose a non-empty UTF-8/);
    expect(screen.getByLabelText('Draft')).toHaveValue(template);
  });

  it('ignores a file read completed after unmount', async () => {
    const { unmount, complete } = await setup();
    let resolve!: (value: ArrayBuffer) => void;
    const file = new File(['pending'], 'config.yml');
    Object.defineProperty(file, 'arrayBuffer', {
      value: () =>
        new Promise<ArrayBuffer>((done) => {
          resolve = done;
        }),
    });
    fireEvent.change(screen.getByLabelText('Import file'), {
      target: { files: [file] },
    });
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    unmount();
    await act(async () => {
      resolve(new TextEncoder().encode(imported).buffer);
    });
    expect(complete).not.toHaveBeenCalled();
  });
});
