/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { CodeEditor } from '..';
import { CodeEditorExtension } from '../extension';

CodeEditorExtension.registerRightExtra({
  name: 'authoring-surface-extra-test',
  extra: ({ authoringSurfaceId }) => (
    <span data-testid="authoring-surface-id">{authoringSurfaceId ?? 'legacy-single-file'}</span>
  ),
});

describe('CodeEditor authoring surface extra', () => {
  it('passes the explicit authoring surface id to registered right extras', () => {
    render(
      <CodeEditor
        authoringSurfaceId="workspace:repo-1:entry-1"
        fullscreenControl={{ isFullscreen: false, toggleFullscreen: () => undefined }}
        showLogs={false}
      />,
    );

    expect(screen.getByTestId('authoring-surface-id')).toHaveTextContent('workspace:repo-1:entry-1');
  });

  it('keeps the legacy single-file behavior when no surface id is provided', () => {
    render(
      <CodeEditor fullscreenControl={{ isFullscreen: false, toggleFullscreen: () => undefined }} showLogs={false} />,
    );

    expect(screen.getByTestId('authoring-surface-id')).toHaveTextContent('legacy-single-file');
  });
});
