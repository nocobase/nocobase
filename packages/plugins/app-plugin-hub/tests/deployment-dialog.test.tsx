import { useState, type ReactElement } from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { render } from './render.js';
import { useHostToaster } from './host-toaster.js';
import { DeploymentDialog } from '../client/pages/hub/configuration.js';
import type { AppDetail, ConfigMode } from '../client/pages/hub/types.js';

vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useToaster: () => useHostToaster(),
}));
vi.mock('../client/components/config-editor.js', () => ({
  ConfigMergeEditor: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <textarea
      aria-label='New configuration'
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
  ConfigUnifiedDiff: () => <div>Configuration review</div>,
  ConfigEditor: () => null,
}));

const app = {
  app: { id: 'a', name: 'Example', currentDeploymentId: null },
  deployment: {
    desiredReleaseId: null,
    observedReleaseId: null,
    observedState: 'stopped',
    activation: 'eager',
    basePath: '/a',
    updatedAt: '2026-09-01T00:00:00Z',
  },
  releases: ['one', 'two'].map((id) => ({
    id,
    version: id,
    checksum: id,
    hasConfigTemplate: true,
    createdAt: '2026-09-01T00:00:00Z',
    size: 1,
  })),
} as AppDetail;

function Dialog({
  loadTemplate,
  deployed = false,
}: {
  loadTemplate: (appId: string, releaseId: string) => Promise<string | null>;
  deployed?: boolean;
}): ReactElement {
  const [releaseId, setReleaseId] = useState('one');
  const [content, setContent] = useState('stale: true');
  const [mode, setMode] = useState<ConfigMode>('file');
  return (
    <DeploymentDialog
      app={
        deployed
          ? {
              ...app,
              app: { ...app.app, currentDeploymentId: 'current-deployment' },
            }
          : app
      }
      releaseId={releaseId}
      content={content}
      mode={mode}
      baselineContent='current: true'
      baselineMode='file'
      rollback={false}
      busy={false}
      onRelease={setReleaseId}
      loadTemplate={loadTemplate}
      onContent={setContent}
      onMode={setMode}
      onClose={() => undefined}
      onComplete={() => undefined}
    />
  );
}

describe('Hub deployment configuration step', () => {
  it('starts an existing deployment draft from current config rather than the template', async () => {
    render(
      <Dialog
        deployed
        loadTemplate={vi.fn().mockResolvedValue('fresh: true')}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
    expect(
      await screen.findByRole('textbox', { name: 'New configuration' }),
    ).toHaveValue('current: true');
    expect(screen.getByText('Release template')).toBeVisible();
    expect(screen.getByText('Deployment draft')).toBeVisible();
  });
  it('loads only after Continue, blocks on failure, and allows retry', async () => {
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValue('fresh: true');
    render(<Dialog loadTemplate={loader} />);
    fireEvent.click(screen.getByRole('button', { name: /vtwo/ }));
    expect(loader).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
    const notification = await screen.findByText(
      /Failed to load configuration template/,
    );
    expect(notification).toBeVisible();
    expect(
      within(screen.getByRole('dialog')).queryByText(
        /Failed to load configuration template/,
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue/ })).toBeDisabled();
    expect(
      screen.queryByRole('textbox', { name: 'New configuration' }),
    ).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(
      await screen.findByRole('textbox', { name: 'New configuration' }),
    ).toHaveValue('fresh: true');
    expect(loader).toHaveBeenLastCalledWith('a', 'two');
    expect(screen.getByRole('button', { name: /Continue/ })).toBeEnabled();
  });

  it('preserves edits when going back without changing release', async () => {
    const loader = vi.fn().mockResolvedValue('fresh: true');
    render(<Dialog loadTemplate={loader} />);
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
    const editor = await screen.findByRole('textbox', {
      name: 'New configuration',
    });
    fireEvent.change(editor, { target: { value: 'edited: true' } });
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
    await waitFor(() =>
      expect(
        screen.getByRole('textbox', { name: 'New configuration' }),
      ).toHaveValue('edited: true'),
    );
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('tells releases with the same version apart by marking the running and newest ones', async () => {
    // Two uploads of the same version differ only by checksum. The list is newest first: "two" was uploaded
    // after "one", which is the release currently running.
    const sameVersion = {
      ...app,
      deployment: {
        ...app.deployment,
        desiredReleaseId: 'one',
        observedReleaseId: 'one',
      },
      releases: ['two', 'one'].map((id) => ({
        id,
        version: '1.0.0-beta.22',
        checksum: `${id}-checksum-abcdef`,
        hasConfigTemplate: true,
        createdAt: '2026-09-01T00:00:00Z',
        size: 1,
      })),
    } as AppDetail;
    render(
      <DeploymentDialog
        app={sameVersion}
        releaseId='two'
        content=''
        mode='file'
        baselineContent=''
        baselineMode='file'
        rollback={false}
        busy={false}
        onRelease={() => undefined}
        loadTemplate={vi.fn().mockResolvedValue('fresh: true')}
        onContent={() => undefined}
        onMode={() => undefined}
        onClose={() => undefined}
        onComplete={() => undefined}
      />,
    );

    const rows = screen.getAllByRole('button', { name: /v1\.0\.0-beta\.22/ });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('Latest');
    expect(rows[0]).toHaveTextContent('two-checksum');
    expect(rows[0]).not.toHaveTextContent('Current');
    expect(rows[1]).toHaveTextContent('Current');
    expect(rows[1]).not.toHaveTextContent('Latest');

    // The review step names the release by version and checksum so the two uploads stay distinguishable at the
    // moment of confirmation, not only in the picker.
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
    await screen.findByRole('textbox', { name: 'New configuration' });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Continue/ })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
    expect(
      await screen.findByText('v1.0.0-beta.22 · two-checksum'),
    ).toBeInTheDocument();
  });
});
