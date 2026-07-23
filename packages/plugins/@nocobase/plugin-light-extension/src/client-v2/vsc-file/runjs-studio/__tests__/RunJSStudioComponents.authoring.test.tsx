/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, within } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { CodeTab } from '../RunJSStudioComponents';

vi.mock('@nocobase/client-v2', () => ({
  CodeEditor: ({ authoringSurfaceId }: { authoringSurfaceId?: string }) => (
    <button data-authoring-surface-id={authoringSurfaceId} type="button">
      Focus editor
    </button>
  ),
}));

function renderCodeTab(authoringSurfaceId: string, onActivate: (surfaceId: string) => void) {
  return render(
    <CodeTab
      activeFile={{ path: 'src/index.ts', content: 'export default 1;', language: 'typescript' }}
      activePath="src/index.ts"
      authoringSurfaceId={authoringSurfaceId}
      diffRows={[]}
      filesCollapsed={false}
      isDiff={false}
      onAuthoringSurfaceActivate={onActivate}
      onChange={vi.fn()}
      onCloseFile={vi.fn()}
      onDiffToggle={vi.fn()}
      onFilesCollapsedChange={vi.fn()}
      onOpenFile={vi.fn()}
      openPaths={['src/index.ts']}
      readOnly={false}
      savedFiles={[]}
      t={(key) => key}
      version="v1"
      workspaceFiles={[{ path: 'src/index.ts', content: 'export default 1;', language: 'typescript' }]}
    />,
  );
}

describe('CodeTab authoring surface seam', () => {
  it('passes the exact surface id to CodeEditor and activates only on explicit focus', () => {
    const onFirstActivate = vi.fn();
    const onSecondActivate = vi.fn();
    const first = renderCodeTab('workspace:first', onFirstActivate);
    const second = renderCodeTab('workspace:second', onSecondActivate);

    expect(onFirstActivate).not.toHaveBeenCalled();
    expect(onSecondActivate).not.toHaveBeenCalled();
    expect(first.container.querySelector('[data-authoring-surface-id="workspace:first"]')).toBeInTheDocument();
    expect(second.container.querySelector('[data-authoring-surface-id="workspace:second"]')).toBeInTheDocument();

    fireEvent.focus(within(second.container).getByRole('button', { name: 'Focus editor' }));
    expect(onSecondActivate).toHaveBeenCalledWith('workspace:second');
    expect(onFirstActivate).not.toHaveBeenCalled();

    fireEvent.focus(within(first.container).getByRole('button', { name: 'Focus editor' }));
    expect(onFirstActivate).toHaveBeenCalledWith('workspace:first');
  });
});
