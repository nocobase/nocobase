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
import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { RunDetailTabs } from '../../../features/runs/detail/RunDetailTabs';
import { RunTaskTitle } from '../../../features/runs/detail/RelatedDetails';
import type { RunDetailTabKey, RunRecord } from '../../../pages/runs/types';

const run: RunRecord = {
  id: 'run-1',
  runCode: 'RUN-1',
  taskTitle: 'Keyboard task',
  status: 'running',
};

function DetailTabsFixture() {
  const [activeKey, setActiveKey] = useState<RunDetailTabKey>('summary');
  return (
    <RunDetailTabs
      t={(key) => key}
      activeKey={activeKey}
      onChange={setActiveKey}
      items={[
        { key: 'summary', label: 'Summary', children: <div>Summary content</div> },
        { key: 'agent-sessions', label: 'Agent Sessions', children: <div>Session content</div> },
      ]}
    />
  );
}

describe('run detail accessibility', () => {
  it('opens run details from the keyboard-accessible task link', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<RunTaskTitle run={run} t={(key) => key} onOpen={onOpen} />);

    const link = screen.getByRole('link', { name: 'View run details' });
    link.focus();
    await user.keyboard('{Enter}');

    expect(onOpen).toHaveBeenCalledWith(run);
  });

  it('labels the detail tabs and supports keyboard tab activation', async () => {
    const user = userEvent.setup();
    render(<DetailTabsFixture />);

    expect(screen.getByRole('region', { name: 'Run details' })).toBeTruthy();
    expect(screen.getByRole('tablist')).toBeTruthy();
    const summaryTab = screen.getByRole('tab', { name: 'Summary' });
    summaryTab.focus();
    await user.keyboard('{ArrowRight}{Enter}');

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Agent Sessions/ }).getAttribute('aria-selected')).toBe('true');
      expect(screen.getByText('Session content')).toBeTruthy();
    });
  });
});
