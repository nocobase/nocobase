/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { JobHistoryPage, JobHistoryPopover } from '../JobHistoryPopover';

vi.mock('../../locale', () => ({
  useWorkflowTranslation: () => ({
    t: (key: string, values?: Record<string, number>) => key.replace(/{{(\w+)}}/g, (_, name) => String(values?.[name])),
  }),
}));

const firstPage: JobHistoryPage = {
  items: [{ id: '9007199254740993', executionId: 1, nodeId: 2, status: 1 }],
  total: 2,
  snapshot: '9007199254740993',
  nextCursor: '9007199254740993',
};

function history(loadPage: (cursor: object) => Promise<JobHistoryPage>, onSelect = vi.fn(), key = '1') {
  return (
    <JobHistoryPopover key={key} loadPage={loadPage} onSelect={onSelect} renderJob={(job) => `Job ${job.id}`}>
      <Button>History</Button>
    </JobHistoryPopover>
  );
}

describe('JobHistoryPopover', () => {
  it('loads on opening only, then explicitly paginates and opens the selected job', async () => {
    const loadPage = vi
      .fn()
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce({
        items: [{ ...firstPage.items[0], id: '9007199254740992' }],
        snapshot: firstPage.snapshot,
        nextCursor: null,
      });
    const onSelect = vi.fn();
    render(history(loadPage, onSelect));
    expect(loadPage).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'View result' }));
    await screen.findByText('Loaded 1 of 2 jobs');
    expect(loadPage).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Load more' }));
    await screen.findByText('Loaded 2 of 2 jobs');
    expect(loadPage).toHaveBeenLastCalledWith({ before: firstPage.nextCursor, snapshot: firstPage.snapshot });
    expect(screen.queryByRole('menuitem', { name: 'Load more' })).toBeNull();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Job 9007199254740992' }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: '9007199254740992' }));
  });

  it('retries a failed request and supports a single job', async () => {
    const loadPage = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({
        ...firstPage,
        total: 1,
        nextCursor: null,
      });
    render(history(loadPage));
    fireEvent.focus(screen.getByRole('button', { name: 'View result' }));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Retry loading jobs' }));
    await screen.findByRole('menuitem', { name: 'Job 9007199254740993' });
    expect(screen.queryByText('Failed to load jobs')).toBeNull();
    expect(loadPage).toHaveBeenCalledTimes(2);
  });

  it('ignores an outstanding response after changing executions', async () => {
    let finish: (page: JobHistoryPage) => void = () => {};
    const slow = vi.fn(
      () =>
        new Promise<JobHistoryPage>((resolve) => {
          finish = resolve;
        }),
    );
    const view = render(history(slow));
    fireEvent.click(screen.getByRole('button', { name: 'View result' }));
    await waitFor(() => expect(slow).toHaveBeenCalledTimes(1));
    const next = vi.fn().mockResolvedValue({ items: [], total: 0, snapshot: '0', nextCursor: null });
    view.rerender(history(next, vi.fn(), '2'));
    fireEvent.click(screen.getByRole('button', { name: 'View result' }));
    await waitFor(() => expect(next).toHaveBeenCalledTimes(1));
    finish(firstPage);
    await waitFor(() => expect(screen.queryByRole('menuitem', { name: 'Load more' })).toBeNull());
    expect(screen.queryByText('Job 9007199254740993')).toBeNull();
  });
});
